"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { subscribeToMap } from "@/lib/competitions-cache";

const CompetitionsMap = dynamic(
  () => import("@/components/members/CompetitionsMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-sm text-gray-400">
        Cargando mapa…
      </div>
    ),
  }
);

export function MapSection({ wcaId }: { wcaId: string }) {
  const [open, setOpen] = useState(false);
  const [delegated, setDelegated] = useState(0);
  const [organized, setOrganized] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    return subscribeToMap(wcaId, {
      onInit: (comps) => {
        let d = 0, o = 0;
        for (const c of comps) {
          if (c.delegated) d++;
          if (c.organized) o++;
        }
        setDelegated(d);
        setOrganized(o);
      },
      onCompetition: (comp) => {
        if (comp.delegated) setDelegated((d) => d + 1);
        if (comp.organized) setOrganized((o) => o + 1);
      },
      onPhase: () => {},
      onDone: () => setDone(true),
    });
  }, [wcaId]);

  const total = delegated + organized;
  if (done && total === 0) return null;

  return (
    <div className="border border-gray-100 rounded-xl shadow-sm bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">
            Mapa de competencias
          </span>
          {total > 0 ? (
            <span className="flex gap-1.5">
              {delegated > 0 && (
                <span className="px-1.5 py-0.5 rounded text-xs font-bold text-amber-600 bg-amber-50">
                  {delegated} del.
                </span>
              )}
              {organized > 0 && (
                <span className="px-1.5 py-0.5 rounded text-xs font-bold text-brand-blue bg-blue-50">
                  {organized} org.
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs text-gray-400 animate-pulse">cargando…</span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="pt-4">
            <CompetitionsMap wcaId={wcaId} />
          </div>
        </div>
      )}
    </div>
  );
}
