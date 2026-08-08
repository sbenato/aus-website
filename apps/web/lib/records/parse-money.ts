/**
 * Parseo de montos tipeados a mano, uno solo para toda la app.
 *
 * Antes había dos: el formulario de aporte sacaba los puntos ("10.000" → 10000) y
 * el de ajuste los tomaba como decimal ("1.500" → 1.5). El ajuste fija un saldo
 * absoluto, así que ese desacuerdo borraba plata: escribir mil quinientos dejaba
 * el fondo en $1,50.
 *
 * Regla, pensada para es-UY: el punto es separador de miles y la coma decimal.
 * Un único punto con exactamente dos decimales ("10.50") se acepta como decimal,
 * porque es lo que la gente tipea cuando viene de un teclado numérico.
 */
export function parseMoney(input: string): number | null {
  const raw = input.trim();
  if (!raw) return null;
  if (!/^[\d.,\s]+$/.test(raw)) return null;

  const limpio = raw.replace(/\s/g, "");
  const comas = (limpio.match(/,/g) ?? []).length;
  const puntos = (limpio.match(/\./g) ?? []).length;
  if (comas > 1) return null;

  let normalizado: string;
  if (comas === 1) {
    // Con coma, el punto es siempre separador de miles: "1.234,56".
    normalizado = limpio.replace(/\./g, "").replace(",", ".");
  } else if (puntos === 1 && /\.\d{2}$/.test(limpio)) {
    // "10.50" → decimal. "1.500" → mil quinientos (cae al else).
    normalizado = limpio;
  } else {
    normalizado = limpio.replace(/\./g, "");
  }

  const n = Number(normalizado);
  if (!Number.isFinite(n) || n < 0) return null;
  // Nunca más de dos decimales: la plata se lleva en centavos.
  return Math.round(n * 100) / 100;
}

/** Cómo se va a interpretar lo tipeado, para mostrárselo a quien carga. */
export function describeMoney(input: string): string | null {
  const n = parseMoney(input);
  if (n === null) return null;
  return `$${n.toLocaleString("es-UY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
