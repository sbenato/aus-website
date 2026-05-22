export interface WCAEventInfo {
  name: string;
  nameEs: string;
  shortName: string;
}

export const WCA_EVENTS: Record<string, WCAEventInfo> = {
  "333":    { name: "3x3x3 Cube",           nameEs: "Cubo 3x3x3",              shortName: "3x3" },
  "222":    { name: "2x2x2 Cube",           nameEs: "Cubo 2x2x2",              shortName: "2x2" },
  "444":    { name: "4x4x4 Cube",           nameEs: "Cubo 4x4x4",              shortName: "4x4" },
  "555":    { name: "5x5x5 Cube",           nameEs: "Cubo 5x5x5",              shortName: "5x5" },
  "666":    { name: "6x6x6 Cube",           nameEs: "Cubo 6x6x6",              shortName: "6x6" },
  "777":    { name: "7x7x7 Cube",           nameEs: "Cubo 7x7x7",              shortName: "7x7" },
  "333bf":  { name: "3x3 Blindfolded",      nameEs: "3x3 A Ciegas",            shortName: "3BLD" },
  "333fm":  { name: "3x3 Fewest Moves",     nameEs: "3x3 Menos Movimientos",   shortName: "FMC" },
  "333oh":  { name: "3x3 One-Handed",       nameEs: "3x3 Con Una Mano",        shortName: "OH" },
  "clock":  { name: "Clock",               nameEs: "Reloj",                   shortName: "CLK" },
  "minx":   { name: "Megaminx",            nameEs: "Megaminx",                shortName: "MGA" },
  "pyram":  { name: "Pyraminx",            nameEs: "Pyraminx",                shortName: "PYR" },
  "skewb":  { name: "Skewb",              nameEs: "Skewb",                   shortName: "SKB" },
  "sq1":    { name: "Square-1",            nameEs: "Square-1",                shortName: "SQ1" },
  "444bf":  { name: "4x4 Blindfolded",     nameEs: "4x4 A Ciegas",            shortName: "4BLD" },
  "555bf":  { name: "5x5 Blindfolded",     nameEs: "5x5 A Ciegas",            shortName: "5BLD" },
  "333mbf": { name: "3x3 Multi-Blind",     nameEs: "3x3 Múltiples A Ciegas",  shortName: "MBLD" },
};

export const EVENT_ORDER = [
  "333", "222", "444", "555", "666", "777",
  "333bf", "333fm", "333oh",
  "clock", "minx", "pyram", "skewb", "sq1",
  "444bf", "555bf", "333mbf",
];

export function getEventInfo(eventId: string): WCAEventInfo {
  return WCA_EVENTS[eventId] ?? { name: eventId, nameEs: eventId, shortName: eventId };
}
