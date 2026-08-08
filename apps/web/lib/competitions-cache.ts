import type { MapCompetition } from "@/app/api/map/[wca_id]/route";

type Subscriber = {
  onInit: (comps: MapCompetition[]) => void;
  onCompetition: (comp: MapCompetition) => void;
  onPhase: (phase: string) => void;
  onDone: () => void;
  onError?: (mensaje: string) => void;
};

type CacheEntry = {
  competitions: MapCompetition[];
  done: boolean;
  error: string | null;
  subscribers: Set<Subscriber>;
};

const cache = new Map<string, CacheEntry>();

/**
 * Suscribe un componente al stream de competencias de un WCA ID.
 * - Si el stream ya terminó: llama onInit con los datos y onDone inmediatamente.
 * - Si está en progreso: llama onInit con lo que hay hasta ahora y suscribe a futuros eventos.
 * - Si nunca se inició: arranca el stream y suscribe.
 * Devuelve una función de cleanup para cancelar la suscripción.
 */
export function subscribeToMap(wcaId: string, subscriber: Subscriber): () => void {
  let entry = cache.get(wcaId);

  // Una entrada que terminó en error no sirve de caché: se descarta para que el
  // próximo montaje reintente. Antes quedaba pegada y el mapa de esa persona
  // mostraba "cargando…" para siempre durante toda la sesión.
  if (entry?.error) {
    cache.delete(wcaId);
    entry = undefined;
  }

  if (entry) {
    // Snapshot del array para que mutaciones futuras no afecten el estado de React
    subscriber.onInit([...entry.competitions]);
    if (entry.done) {
      subscriber.onDone();
      return () => {};
    }
    entry.subscribers.add(subscriber);
    return () => { entry!.subscribers.delete(subscriber); };
  }

  // Primera vez: crear entrada y arrancar el stream
  entry = {
    competitions: [],
    done: false,
    error: null,
    subscribers: new Set([subscriber]),
  };
  cache.set(wcaId, entry);
  subscriber.onInit([]);
  fetchAndStream(wcaId, entry);

  return () => { entry!.subscribers.delete(subscriber); };
}

function marcarError(entry: CacheEntry, mensaje: string) {
  entry.error = mensaje;
  entry.done = true;
  for (const sub of entry.subscribers) {
    sub.onError?.(mensaje);
    sub.onDone();
  }
}

async function fetchAndStream(wcaId: string, entry: CacheEntry) {
  try {
    const res = await fetch(`/api/map/${encodeURIComponent(wcaId)}`);
    if (!res.ok || !res.body) {
      marcarError(entry, "No se pudo cargar el mapa.");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line) as
            | { type: "competition"; data: MapCompetition }
            | { type: "phase"; data: string }
            | { type: "done" }
            | { type: "error"; data: string };

          if (msg.type === "competition") {
            entry.competitions.push(msg.data);
            for (const sub of entry.subscribers) sub.onCompetition(msg.data);
          } else if (msg.type === "phase") {
            for (const sub of entry.subscribers) sub.onPhase(msg.data);
          } else if (msg.type === "done") {
            entry.done = true;
            for (const sub of entry.subscribers) sub.onDone();
          } else if (msg.type === "error") {
            marcarError(entry, msg.data);
          }
        } catch { /* línea malformada */ }
      }
    }
    // El stream cortó sin decir "done": tampoco puede quedar cargando eterno.
    if (!entry.done) marcarError(entry, "La carga del mapa se interrumpió.");
  } catch (err) {
    console.error("[competitions-cache]", err);
    marcarError(entry, "Error de red al cargar el mapa.");
  }
}
