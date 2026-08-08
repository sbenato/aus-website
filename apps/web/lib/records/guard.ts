/**
 * Guardas comunes de las rutas de escritura: tamaño del body y frecuencia.
 *
 * Todas requieren permiso de editor, así que esto no frena a un atacante anónimo:
 * frena a una sesión comprometida o a un script mal escrito que use la app como
 * amplificador contra la API de la WCA (cada reparto dispara un fetch saliente).
 */

/** Tope de body. Ningún cuerpo legítimo de estas rutas pasa de unos pocos KB. */
const MAX_BODY_BYTES = 64 * 1024;

/** Ventana y cupo por actor. */
const WINDOW_MS = 60_000;
const MAX_POR_VENTANA = 20;

const hits = new Map<string, number[]>();

export function rateLimit(actor: string): Response | null {
  const ahora = Date.now();
  const previos = (hits.get(actor) ?? []).filter((t) => ahora - t < WINDOW_MS);
  if (previos.length >= MAX_POR_VENTANA) {
    const esperar = Math.ceil((WINDOW_MS - (ahora - previos[0])) / 1000);
    return Response.json(
      { error: `Demasiadas operaciones seguidas. Probá de nuevo en ${esperar} s.` },
      { status: 429, headers: { "Retry-After": String(esperar) } }
    );
  }
  previos.push(ahora);
  hits.set(actor, previos);

  // Limpieza barata para que el Map no crezca sin fin.
  if (hits.size > 500) {
    for (const [key, tiempos] of hits) {
      if (tiempos.every((t) => ahora - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return null;
}

/** Lee el JSON del body con tope de tamaño. Devuelve el error listo para tirar. */
export async function readJsonBody<T>(
  request: Request
): Promise<{ ok: true; body: T } | { ok: false; response: Response }> {
  const declarado = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declarado) && declarado > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: Response.json({ error: "El cuerpo es demasiado grande." }, { status: 413 }),
    };
  }

  const texto = await request.text();
  if (texto.length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: Response.json({ error: "El cuerpo es demasiado grande." }, { status: 413 }),
    };
  }

  try {
    return { ok: true, body: JSON.parse(texto) as T };
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "JSON inválido." }, { status: 400 }),
    };
  }
}
