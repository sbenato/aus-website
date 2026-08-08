#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
wca_datos_full.py · Genera datos-wca.json COMPLETO para el Fondo de Récords de la AUS.

Extiende wca_datos.py con lo que records.md §6 marcaba como pendiente:

  - m0     : mediana histórica de las mejoras del récord nacional, POR EVENTO y por
             tipo (single / media). Es el parámetro de la curva f(m) del §4.2.
  - sar    : récord continental (Sudamérica) y de qué país es hoy.
  - sarHist: histórico de quién tuvo el continental, para detectar el cambio de país
             que dispara el bonus del §4.3.

Todo lo demás sale igual que en wca_datos.py: wr, nr, wrAvg, nrAvg, nrDate, days, ppl.

Uso:
  python3 wca_datos_full.py --zip wca-export.zip
  python3 wca_datos_full.py --zip wca-export.zip --country Uruguay --months 24

El script nunca toca plata: los montos los carga la AUS a mano.
"""

import argparse, csv, io, json, statistics, sys, zipfile
from datetime import date, datetime

csv.field_size_limit(10**8)

FMT = {"333fm": "number", "333mbf": "multi"}      # el resto es tiempo en centisegundos
NAMES = {
    "333":"3x3x3","222":"2x2x2","444":"4x4x4","555":"5x5x5","666":"6x6x6","777":"7x7x7",
    "333bf":"3x3 a ciegas","333fm":"Menos movimientos","333oh":"A una mano","clock":"Clock",
    "minx":"Megaminx","pyram":"Pyraminx","skewb":"Skewb","sq1":"Square-1",
    "444bf":"4x4 a ciegas","555bf":"5x5 a ciegas","333mbf":"Multi a ciegas",
}
NO_AVERAGE = {"333mbf"}                            # MBLD no tiene media -> 33 fondos
M0_FALLBACK = 0.03                                 # §4.2: menos de 3 roturas
MIN_ROTURAS = 3

# ---------------------------------------------------------------- helpers

def find_col(header, *cands):
    low = {h.strip().lower(): i for i, h in enumerate(header)}
    for c in cands:
        if c.lower() in low:
            return low[c.lower()]
    return None

def member(zf, *needles, exact_suffix=None):
    """Elige el TSV correcto. exact_suffix evita agarrar results_attempts en vez de results."""
    if exact_suffix:
        for n in zf.namelist():
            if n.lower().rsplit("/", 1)[-1].endswith(exact_suffix):
                return n
    for n in zf.namelist():
        b = n.lower().rsplit("/", 1)[-1]
        if b.endswith(".tsv") and any(x in b for x in needles):
            return n
    return None

def rows(zf, name):
    with zf.open(name) as raw:
        rd = csv.reader(io.TextIOWrapper(raw, encoding="utf-8", newline=""), delimiter="\t")
        header = next(rd)
        yield header
        for r in rd:
            yield r

def to_int(s):
    try: return int(s)
    except (ValueError, TypeError): return 0

def human(raw, fmt, es_media=False):
    """Valor legible. La razón WR/NR no cambia mientras ambos estén en la misma unidad."""
    if not raw or raw <= 0: return None
    if fmt == "time": return round(raw / 100, 2)      # centisegundos -> segundos
    if fmt == "multi": return mbld_puntos(raw)        # §3.1: puntos = resueltos - fallados
    if es_media: return round(raw / 100, 2)           # FMC: la media viene ×100 (§3.1)
    return raw                                         # FMC single: movimientos

def mbld_puntos(raw):
    """MBLD viejo (1SSAATTTTT) y nuevo (0DDTTTTTMM). Devuelve puntos = resueltos - fallados."""
    s = str(int(raw)).zfill(10)
    if s[0] == "1":                                   # formato viejo: SS = 99 - puntos
        return 99 - int(s[1:3])
    dd = int(s[1:3]); mm = int(s[8:10])               # nuevo: DD = 99 - puntos, MM = intentados
    puntos = 99 - dd
    resueltos = (puntos + mm) // 2
    return resueltos - (mm - resueltos)

def roturas(hist, mayor_es_mejor):
    """hist = [(fecha, valor, persona)] ordenado. Devuelve CADA vez que el récord
    cayó, con quién lo rompió y contra qué valor.

    Antes esto devolvía solo los márgenes y descartaba la persona, que es el único
    dato que la API de récords de la WCA no trae. El fondo lo necesita para saber
    a quién pagarle: `GET /api/v0/records` da valores, no nombres.

    La primera marca de la historia no es una rotura — no había récord que romper.
    """
    out, best = [], None
    for fecha, v, pid in hist:
        if v is None or v <= 0: continue
        if best is None:
            best = v; continue
        mejor = v > best if mayor_es_mejor else v < best
        if mejor:
            m = (v - best) / best if mayor_es_mejor else (best - v) / best
            if m > 0:
                # `m` queda con precisión completa: es lo que alimenta la mediana
                # de m0, y redondear acá corría todos los premios. Se redondea al
                # serializar, no al calcular.
                out.append({
                    "fecha": fecha.isoformat(),
                    "wcaId": pid,
                    "anterior": best,
                    "nuevo": v,
                    "m": m,
                })
            best = v
    return out

def mejoras(hist, mayor_es_mejor):
    """Solo los márgenes, que es la materia prima de m0 (§4.2). Se deriva de
    `roturas` a propósito: dos recorridos separados de la misma historia se
    desincronizan en cuanto alguien toca uno."""
    return [r["m"] for r in roturas(hist, mayor_es_mejor)]

def m0_de(margenes):
    if len(margenes) >= MIN_ROTURAS:
        return round(statistics.median(margenes), 4), len(margenes), False
    return M0_FALLBACK, len(margenes), True

# ---------------------------------------------------------------- main

def build(zip_path, country_in, months, out_path):
    today = date.today()
    zf = zipfile.ZipFile(zip_path)

    # --- países: id del país objetivo + qué países son del continente sudamericano
    cm = member(zf, "countries", "country")
    it = rows(zf, cm); head = next(it)
    i_id, i_iso = find_col(head, "id", "country_id"), find_col(head, "iso2", "iso_2")
    i_name, i_cont = find_col(head, "name"), find_col(head, "continentId", "continent_id")
    target, continente, sudamerica = country_in, None, set()
    paises = []
    for r in it:
        cid = r[i_id]; nm = r[i_name] if i_name is not None else cid
        iso = r[i_iso] if i_iso is not None else ""
        cont = r[i_cont] if i_cont is not None else ""
        paises.append((cid, nm, cont))
        if country_in.strip().lower() in (cid.lower(), iso.lower(), nm.lower()):
            target, continente = cid, cont
    for cid, nm, cont in paises:
        if continente and cont == continente:
            sudamerica.add(cid)
    print(f"País: {target} · continente: {continente} ({len(sudamerica)} países)")

    # --- competencias: id -> fecha de fin
    cm = member(zf, "competitions", "competition")
    it = rows(zf, cm); head = next(it)
    i_cid = find_col(head, "id")
    i_end = find_col(head, "end_date", "enddate")
    i_y, i_mo, i_d = find_col(head, "year"), find_col(head, "month"), find_col(head, "day")
    i_em, i_ed = find_col(head, "endMonth", "end_month"), find_col(head, "endDay", "end_day")
    comp_date = {}
    for r in it:
        dt = None
        if i_end is not None and r[i_end]:
            try: dt = datetime.strptime(r[i_end][:10], "%Y-%m-%d").date()
            except ValueError: dt = None
        if dt is None and i_y is not None:
            try:
                y = int(r[i_y]); mo = int((r[i_em] if i_em is not None and r[i_em] != "0" else r[i_mo]) or 1)
                d = int((r[i_ed] if i_ed is not None and r[i_ed] != "0" else r[i_d]) or 1)
                dt = date(y, max(min(mo, 12), 1), max(min(d, 28), 1))
            except (ValueError, TypeError): dt = None
        if dt: comp_date[r[i_cid]] = dt

    # --- resultados: una sola pasada sobre el archivo grande
    rm = member(zf, "results", "result", exact_suffix="results.tsv")
    it = rows(zf, rm); head = next(it)
    i_comp = find_col(head, "competitionId", "competition_id")
    i_ev   = find_col(head, "eventId", "event_id")
    i_pid  = find_col(head, "personId", "person_id")
    i_pc   = find_col(head, "personCountryId", "person_country_id", "personCountry")
    i_best, i_avg = find_col(head, "best"), find_col(head, "average")
    if None in (i_comp, i_ev, i_pid, i_pc, i_best):
        sys.exit("No reconozco results.tsv. Encabezado:\n" + "\t".join(head))

    # ventana de participación
    cutoff = None
    if months:
        m = today.month - 1 - (months % 12); y = today.year - months // 12
        while m < 0: m += 12; y -= 1
        cutoff = date(y, m + 1, 1)

    wr, wravg = {}, {}
    nat = {}    # ev -> [(fecha, best, avg, pid)]  del país
    sa  = {}    # ev -> [(fecha, best, avg, pid, pais)]  del continente
    ppl_win, ppl_all = {}, {}
    n = 0
    for r in it:
        n += 1
        if n % 2_000_000 == 0: print(f"  {n//1_000_000}M filas…", flush=True)
        ev = r[i_ev]
        if ev not in NAMES: continue
        b = to_int(r[i_best]); a = to_int(r[i_avg]) if i_avg is not None else 0
        if b > 0 and (ev not in wr or b < wr[ev]): wr[ev] = b
        if a > 0 and (ev not in wravg or a < wravg[ev]): wravg[ev] = a
        pais = r[i_pc]
        if pais != target and pais not in sudamerica: continue
        cd = comp_date.get(r[i_comp])
        if cd is None: continue
        if pais in sudamerica:
            sa.setdefault(ev, []).append((cd, b, a, r[i_pid], pais))
        if pais == target:
            nat.setdefault(ev, []).append((cd, b, a, r[i_pid]))
            ppl_all.setdefault(ev, set()).add(r[i_pid])
            if cutoff is None or cd >= cutoff:
                ppl_win.setdefault(ev, set()).add(r[i_pid])
    print(f"  {n} filas leídas.")

    # --- armar salida
    events = {}
    for ev in NAMES:
        fmt = FMT.get(ev, "time")
        mayor_mejor = (fmt == "multi")
        H = sorted(nat.get(ev, []), key=lambda x: x[0])

        # NR single + fecha, y NR media + fecha, recorriendo la historia del país
        nr = nr_date = nravg = nravg_date = None
        for cd, b, a, _ in H:
            vb = human(b, fmt); va = human(a, fmt, True)
            if vb is not None and (nr is None or (vb > nr if mayor_mejor else vb < nr)):
                nr, nr_date = vb, cd
            if ev not in NO_AVERAGE and va is not None and (nravg is None or va < nravg):
                nravg, nravg_date = va, cd

        # Historial completo de roturas del NR, con quién la hizo. De acá salen
        # tanto m0 (§4.2) como la lista que el fondo usa para pagar (§4).
        rot_s = roturas([(cd, human(b, fmt), pid) for cd, b, _, pid in H], mayor_mejor)
        rot_a = (
            roturas([(cd, human(a, fmt, True), pid) for cd, _, a, pid in H], False)
            if ev not in NO_AVERAGE else []
        )
        m0_s, n_s, fb_s = m0_de([r["m"] for r in rot_s])
        m0_a, n_a, fb_a = (
            m0_de([r["m"] for r in rot_a]) if ev not in NO_AVERAGE else (None, 0, True)
        )

        # continental: quién tiene el SAR hoy y el histórico de países que lo tuvieron
        SA = sorted(sa.get(ev, []), key=lambda x: x[0])
        sar = sar_pais = sar_pid = None
        hist = []
        for cd, b, _, pid, pais in SA:
            v = human(b, fmt)
            if v is None: continue
            if sar is None or (v > sar if mayor_mejor else v < sar):
                sar, sar_pais, sar_pid = v, pais, pid
                hist.append({"fecha": cd.isoformat(), "pais": pais, "wca_id": pid, "valor": v})
        saravg = saravg_pais = None
        if ev not in NO_AVERAGE:
            for cd, _, a, pid, pais in SA:
                v = human(a, fmt, True)
                if v is None: continue
                if saravg is None or v < saravg:
                    saravg, saravg_pais = v, pais

        events[ev] = {
            "name": NAMES[ev],
            "wr": human(wr.get(ev), fmt),
            "nr": nr,
            "wrAvg": None if ev in NO_AVERAGE else human(wravg.get(ev), fmt, True),
            "nrAvg": nravg,
            "nrDate": nr_date.isoformat() if nr_date else None,
            "nrAvgDate": nravg_date.isoformat() if nravg_date else None,
            "days": (today - nr_date).days if nr_date else None,
            "daysAvg": (today - nravg_date).days if nravg_date else None,
            "ppl": len(ppl_win.get(ev, ())),
            "pplAllTime": len(ppl_all.get(ev, ())),
            "m0": m0_s, "m0Roturas": n_s, "m0Fallback": fb_s,
            "m0Avg": m0_a, "m0AvgRoturas": n_a, "m0AvgFallback": fb_a,
            "sar": sar, "sarPais": sar_pais, "sarWcaId": sar_pid,
            "sarAvg": saravg, "sarAvgPais": saravg_pais,
            "sarEsNuestro": sar_pais == target,
            "sarHist": hist[-12:],
            # Cada rotura del NR con quién la hizo. Es la fuente de verdad para
            # pagar: completa (incluye récords hechos afuera del país), fechada y
            # con nombre. La API de récords no da nada de esto.
            "roturas": [{**r, "m": round(r["m"], 6)} for r in rot_s],
            "roturasAvg": [{**r, "m": round(r["m"], 6)} for r in rot_a],
            "lowerIsBetter": not mayor_mejor,
            "note": "MBLD/FMC: revisar dificultad a mano" if fmt != "time" else None,
        }

    out = {"meta": {
              "fuente": "WCA results export", "pais": target, "continente": continente,
              "ventana_meses": months, "generado": today.isoformat(),
              "m0_fallback": M0_FALLBACK, "m0_min_roturas": MIN_ROTURAS,
              "aviso": "Datos de la World Cube Association (worldcubeassociation.org/results). "
                       "Los montos los carga la AUS a mano; este script nunca toca plata."},
           "events": events}
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    # la página se abre con file:// y ahí no se puede hacer fetch de un .json,
    # así que además dejamos el mismo contenido como script cargable.
    js_path = out_path[:-5] + ".js" if out_path.endswith(".json") else out_path + ".js"
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(f"// generado por wca_datos_full.py desde el export oficial de la WCA · {today}\n")
        f.write("window.WCA_DATOS = " + json.dumps(out, ensure_ascii=False) + ";\n")

    print(f"\nEscrito {out_path} y {js_path}\n")
    print(f"{'Evento':<18}{'NR':>9}{'WR':>9}{'dif':>7}{'días':>7}{'gente':>7}{'m0':>8}{'rot':>5}  SAR")
    for ev, e in events.items():
        if not e["nr"]: continue
        dif = (e["nr"]/e["wr"] if ev == "333mbf" else e["wr"]/e["nr"]) if e["wr"] else 0
        print(f"{e['name']:<18}{e['nr']:>9}{e['wr']:>9}{dif:>7.3f}{str(e['days']):>7}"
              f"{e['ppl']:>7}{e['m0']:>8.4f}{e['m0Roturas']:>5}  "
              f"{e['sar']} ({e['sarPais']})")


def main():
    ap = argparse.ArgumentParser(description="datos-wca.json completo (con m0 y continental).")
    ap.add_argument("--zip", required=True, help="Export TSV de la WCA ya descargado.")
    ap.add_argument("--country", default="Uruguay")
    ap.add_argument("--months", type=int, default=24, help="Ventana de participantes; 0 = histórico.")
    ap.add_argument("--out", default="datos-wca.json")
    a = ap.parse_args()
    build(a.zip, a.country, a.months, a.out)


if __name__ == "__main__":
    main()
