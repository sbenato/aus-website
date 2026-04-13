"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { MapCompetition } from "@/app/api/map/[wca_id]/route";
import { subscribeToMap } from "@/lib/competitions-cache";

const TODAY = new Date().toISOString().split("T")[0];

function isUpcoming(comp: MapCompetition) {
  return comp.startDate >= TODAY;
}

function markerColor(comp: MapCompetition) {
  if (isUpcoming(comp)) return "#f59e0b";
  if (comp.delegated && comp.organized) return "#7c3aed";
  if (comp.organized) return "#16a34a";
  return "#0070BD";
}

// ── Clustering ───────────────────────────────────────────────────────────────

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Cluster = { lat: number; lng: number; comps: MapCompetition[] };

function buildClusters(competitions: MapCompetition[], threshold = 20): Cluster[] {
  const clusters: Cluster[] = [];
  const processed = new Set<string>();

  for (const comp of competitions) {
    if (processed.has(comp.id)) continue;
    processed.add(comp.id);

    const group: MapCompetition[] = [comp];
    for (const other of competitions) {
      if (processed.has(other.id)) continue;
      if (haversineMeters(comp.lat, comp.lng, other.lat, other.lng) <= threshold) {
        processed.add(other.id);
        group.push(other);
      }
    }

    const lat = group.reduce((s, c) => s + c.lat, 0) / group.length;
    const lng = group.reduce((s, c) => s + c.lng, 0) / group.length;
    clusters.push({ lat, lng, comps: group });
  }

  return clusters;
}

function clusterIcon(count: number) {
  return L.divIcon({
    html: `<div style="background:#1e3a5f;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${count}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// ── Centrado automático ───────────────────────────────────────────────────────

function AutoCenter({ competitions }: { competitions: MapCompetition[] }) {
  const map = useMap();
  const centered = useRef(false);

  useEffect(() => {
    if (centered.current || competitions.length === 0) return;
    centered.current = true;
    const lat = competitions.reduce((s, c) => s + c.lat, 0) / competitions.length;
    const lng = competitions.reduce((s, c) => s + c.lng, 0) / competitions.length;
    map.flyTo([lat, lng], 4, { animate: true, duration: 1 });
  }, [competitions, map]);

  return null;
}

// ────────────────────────────────────────────────────────────────────────────

export default function CompetitionsMap({ wcaId }: { wcaId: string }) {
  const [competitions, setCompetitions] = useState<MapCompetition[]>([]);
  const [phase, setPhase] = useState("Iniciando…");
  const [done, setDone] = useState(false);

  useEffect(() => {
    return subscribeToMap(wcaId, {
      onInit: (comps) => setCompetitions(comps),
      onCompetition: (comp) => setCompetitions((prev) => [...prev, comp]),
      onPhase: setPhase,
      onDone: () => setDone(true),
    });
  }, [wcaId]);

  const clusters = useMemo(() => buildClusters(competitions), [competitions]);
  const upcomingCount = useMemo(() => competitions.filter(isUpcoming).length, [competitions]);
  const pastCount = competitions.length - upcomingCount;

  return (
    <div className="space-y-3">
      {/* Leyenda + estado */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <LegendDot color="#0070BD" label="Delegado" />
        <LegendDot color="#16a34a" label="Organizado" />
        <LegendDot color="#7c3aed" label="Ambos" />
        <LegendDot color="#f59e0b" label="Próxima" />
        <span className="ml-auto text-gray-400 text-xs">
          {pastCount > 0 && <>{pastCount} pasada{pastCount !== 1 ? "s" : ""}</>}
          {pastCount > 0 && upcomingCount > 0 && <span className="mx-1">·</span>}
          {upcomingCount > 0 && (
            <span className="text-amber-500 font-medium">
              {upcomingCount} próxima{upcomingCount !== 1 ? "s" : ""}
            </span>
          )}
          {!done && <span className="ml-2 animate-pulse">· {phase}</span>}
        </span>
      </div>

      {/* Mapa */}
      <MapContainer
        center={[0, 0]}
        zoom={2}
        scrollWheelZoom
        className="h-[600px] w-full rounded-xl z-0 shadow-sm border border-gray-100"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AutoCenter competitions={competitions} />

        {clusters.map((cluster) => {
          const { lat, lng, comps } = cluster;

          if (comps.length === 1) {
            const comp = comps[0];
            return (
              <CircleMarker
                key={comp.id}
                center={[comp.lat, comp.lng]}
                radius={7}
                pathOptions={{
                  color: markerColor(comp),
                  fillColor: markerColor(comp),
                  fillOpacity: isUpcoming(comp) ? 0.5 : 0.85,
                  weight: isUpcoming(comp) ? 2 : 1.5,
                  dashArray: isUpcoming(comp) ? "4" : undefined,
                }}
              >
                <Popup>
                  <div className="text-sm space-y-1 min-w-[180px]">
                    <p className="font-semibold">{comp.name}</p>
                    <p className="text-gray-500">{comp.city}, {comp.countryIso2}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(comp.startDate + "T12:00:00").toLocaleDateString("es-UY", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    <div className="flex gap-1 pt-1 flex-wrap">
                      {isUpcoming(comp) && <Badge color="#f59e0b" label="Próxima" />}
                      {comp.delegated && <Badge color="#0070BD" label="Delegado" />}
                      {comp.organized && <Badge color="#16a34a" label="Organizado" />}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          }

          // Cluster: varios en el mismo lugar
          return (
            <Marker
              key={`cluster-${lat.toFixed(5)}-${lng.toFixed(5)}`}
              position={[lat, lng]}
              icon={clusterIcon(comps.length)}
            >
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <p className="font-semibold mb-2">
                    {comps.length} competencias en este lugar
                  </p>
                  <ul className="space-y-1.5">
                    {comps
                      .slice()
                      .sort((a, b) => b.startDate.localeCompare(a.startDate))
                      .map((comp) => (
                        <li key={comp.id} className="flex items-start gap-1.5">
                          <span
                            className="mt-0.5 w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: markerColor(comp) }}
                          />
                          <span className="text-xs text-gray-700 leading-tight">
                            {comp.name}
                            <span className="text-gray-400 ml-1">
                              ({new Date(comp.startDate + "T12:00:00").getFullYear()})
                            </span>
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: color }}>
      {label}
    </span>
  );
}
