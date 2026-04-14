"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import type { MapCompetition } from "@/app/api/map/[wca_id]/route";
import { subscribeToMap } from "@/lib/competitions-cache";

const TODAY = new Date().toISOString().split("T")[0];

interface Props {
  wcaId: string;
}

export function RoleCountsCard({ wcaId }: Props) {
  const [delegated, setDelegated] = useState(0);
  const [organized, setOrganized] = useState(0);
  const [both, setBoth] = useState(0);
  const [upcoming, setUpcoming] = useState(0);
  const [phase, setPhase] = useState("Iniciando…");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const tally = (comps: MapCompetition[]) => {
      let d = 0, o = 0, b = 0, u = 0;
      for (const c of comps) {
        if (c.startDate >= TODAY) u++;
        else {
          if (c.delegated) d++;
          if (c.organized) o++;
          if (c.organized && c.delegated) b++;
        }
      }
      return { d, o, b, u };
    };

    return subscribeToMap(wcaId, {
      onInit: (comps) => {
        const { d, o, b, u } = tally(comps);
        setDelegated(d);
        setOrganized(o);
        setBoth(b);
        setUpcoming(u);
      },
      onCompetition: (comp) => {
        if (comp.startDate >= TODAY) {
          setUpcoming((u) => u + 1);
        } else {
          if (comp.delegated) setDelegated((d) => d + 1);
          if (comp.organized) setOrganized((o) => o + 1);
          if (comp.organized && comp.delegated) setBoth((b) => b + 1);
        }
      },
      onPhase: setPhase,
      onDone: () => setDone(true),
    });
  }, [wcaId]);

  const total = delegated + organized - both;

  return (
    <Card>
      <CardBody className="text-center py-5">
        <div className="text-2xl mb-1">📋</div>
        {total > 0
          ? <p className="text-2xl font-bold text-gray-900">{total}</p>
          : <p className={`text-2xl font-bold text-gray-300 ${!done ? "animate-pulse" : ""}`}>—</p>
        }
        <p className="text-xs text-gray-500 mt-0.5">Org. / Delegadas</p>
        {total > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
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
            {both > 0 && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold text-brand-violet bg-violet-50">
                {both} org. y del.
              </span>
            )}
            {upcoming > 0 && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold text-amber-500 bg-amber-50">
                {upcoming} próx.
              </span>
            )}
          </div>
        )}
        {!done && (
          <p className="text-xs text-gray-400 mt-2 truncate animate-pulse">{phase}</p>
        )}
        <Link
          href={`/members/${wcaId}/map`}
          className="mt-3 text-xs font-semibold text-brand-blue hover:text-brand-blue-dark transition-colors"
        >
          Ver mapa →
        </Link>
      </CardBody>
    </Card>
  );
}
