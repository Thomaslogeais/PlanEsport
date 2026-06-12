"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PillGroup from "@/components/ui/PillGroup";
import { X } from "lucide-react";

const GAMES: { value: string; label: string }[] = [
  { value: "league-of-legends", label: "League of Legends" },
  { value: "valorant",          label: "Valorant" },
  { value: "rocket-league",     label: "Rocket League" },
];
const STATUSES: { value: string; label: string; color: string }[] = [
  { value: "running",     label: "En cours", color: "#ef4444" },
  { value: "not_started", label: "À venir",  color: "#7c3aed" },
  { value: "finished",    label: "Terminé",  color: "#6b7280" },
];

function Filters() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const game   = searchParams.get("game")   ?? "";
  const status = searchParams.get("status") ?? "";
  const team   = searchParams.get("team")   ?? "";

  const reset = () => router.push(pathname);
  const hasFilters = !!(game || status || team);

  return (
    <div className="mb-6 space-y-3">
      {/* Pills jeux + statuts */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <PillGroup paramKey="game"   label="Jeu"    options={GAMES} />
        <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--border)" }} />
        <PillGroup paramKey="status" label="Statut" options={STATUSES} />
        {hasFilters && (
          <button onClick={reset}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ml-auto"
            style={{ color: "var(--muted)", border: "1px solid var(--border)" }}>
            <X size={10} /> Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

export default function MatchFilters(_props: { current?: unknown }) {
  return (
    <Suspense>
      <Filters />
    </Suspense>
  );
}
