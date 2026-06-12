"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import PillGroup, { type PillOption } from "@/components/ui/PillGroup";

type FacetsData = {
  ok: boolean;
  games:        { slug: string; name: string; count: number; imageUrl?: string | null }[];
  competitions: { id: string; slug: string; name: string; game?: { slug: string; name: string } }[];
  teams:        { id: string; slug: string; name: string }[];
  tournaments:  { id: string; slug: string; name: string }[];
  statuses:     { value: string; label: string; count: number }[];
  periods:      { value: string; label: string }[];
};

// Couleurs par statut
const STATUS_COLORS: Record<string, string> = {
  running:     "#ef4444",
  not_started: "#7c3aed",
  finished:    "#6b7280",
  canceled:    "#f59e0b",
};

const selectCls: React.CSSProperties = {
  backgroundColor: "var(--surface-2)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: "0.5rem",
  padding: "0.375rem 0.75rem",
  fontSize: "0.8125rem",
  cursor: "pointer",
  minWidth: 150,
  outline: "none",
};

// ── Badge filtre actif (pour les selects, valeur unique) ────────────────────
function ActiveBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: "rgba(124,58,237,0.15)", color: "var(--primary)", border: "1px solid rgba(124,58,237,0.3)" }}>
      {label}
      <button onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity">
        <X size={10} />
      </button>
    </span>
  );
}

// ── Composant interne (a besoin de useSearchParams) ──────────────────────────
function Filters() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // Lire les params (pills = multi, selects = single)
  const game        = searchParams.get("game")        ?? "";
  const status      = searchParams.get("status")      ?? "";
  const period      = searchParams.get("period")      ?? "";
  const competition = searchParams.get("competition") ?? "";
  const team        = searchParams.get("team")        ?? "";
  const tournament  = searchParams.get("tournament")  ?? "";

  const [facets, setFacets]   = useState<FacetsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (game)        params.set("game", game);
    if (status)      params.set("status", status);
    if (period)      params.set("period", period);
    if (competition) params.set("competition", competition);
    if (team)        params.set("team", team);
    if (tournament)  params.set("tournament", tournament);

    fetch(`/api/explore/facets?${params.toString()}`)
      .then((r) => r.json())
      .then((d: FacetsData) => setFacets(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [game, status, period, competition, team, tournament]);

  // Pour les selects (valeur unique)
  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("offset");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const reset = () => router.push(pathname);

  // Filtres selects actifs
  const hasSelectFilters = !!(competition || team || tournament);
  const hasAnyFilter     = !!(game || status || period || competition || team || tournament);

  // Skeleton
  if (loading && !facets) {
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {[80, 100, 70, 90, 80].map((w, i) => (
          <div key={i} className="h-7 rounded-full animate-pulse"
            style={{ width: w, backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }} />
        ))}
      </div>
    );
  }
  if (!facets) return null;

  // Mapper en PillOption[]
  const gameOptions: PillOption[] = facets.games.map((g) => ({ value: g.slug, label: g.name }));
  const statusOptions: PillOption[] = facets.statuses.map((s) => ({
    value: s.value, label: s.label, color: STATUS_COLORS[s.value],
  }));
  const periodOptions: PillOption[] = facets.periods.map((p) => ({ value: p.value, label: p.label }));

  return (
    <div className="mb-6 space-y-3">

      {/* ── Ligne 1 : Pills multi-select (listes courtes) ─────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {gameOptions.length > 0 && (
          <PillGroup paramKey="game" label="Jeu" options={gameOptions} />
        )}
        {gameOptions.length > 0 && statusOptions.length > 0 && (
          <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--border)" }} />
        )}
        {statusOptions.length > 0 && (
          <PillGroup paramKey="status" label="Statut" options={statusOptions} />
        )}
        {periodOptions.length > 0 && (
          <>
            <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--border)" }} />
            <PillGroup paramKey="period" label="Période" options={periodOptions} />
          </>
        )}
      </div>

      {/* ── Ligne 2 : Selects (listes longues) ────────────────────────────── */}
      {(facets.competitions.length > 0 || facets.teams.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {facets.competitions.length > 0 && (
            <select value={competition} onChange={(e) => setFilter("competition", e.target.value)} style={selectCls}>
              <option value="">Toutes les compétitions</option>
              {facets.competitions.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          )}
          {facets.teams.length > 0 && (
            <select value={team} onChange={(e) => setFilter("team", e.target.value)} style={selectCls}>
              <option value="">Toutes les équipes</option>
              {facets.teams.map((t) => (
                <option key={t.id} value={t.slug}>{t.name}</option>
              ))}
            </select>
          )}
          {competition && facets.tournaments.length > 0 && (
            <select value={tournament} onChange={(e) => setFilter("tournament", e.target.value)} style={selectCls}>
              <option value="">Tous les tournois</option>
              {facets.tournaments.map((t) => (
                <option key={t.id} value={t.slug}>{t.name}</option>
              ))}
            </select>
          )}
          {hasAnyFilter && (
            <button onClick={reset}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors"
              style={{ color: "var(--muted)", border: "1px solid var(--border)" }}>
              <X size={10} /> Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* ── Badges actifs pour les selects (valeur unique) ────────────────── */}
      {hasSelectFilters && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {competition && (
            <ActiveBadge
              label={facets.competitions.find((c) => c.slug === competition)?.name ?? competition}
              onRemove={() => setFilter("competition", "")} />
          )}
          {team && (
            <ActiveBadge
              label={facets.teams.find((t) => t.slug === team)?.name ?? team}
              onRemove={() => setFilter("team", "")} />
          )}
          {tournament && (
            <ActiveBadge
              label={facets.tournaments.find((t) => t.slug === tournament)?.name ?? tournament}
              onRemove={() => setFilter("tournament", "")} />
          )}
        </div>
      )}
    </div>
  );
}

export default function ExploreFilters() {
  return (
    <Suspense>
      <Filters />
    </Suspense>
  );
}
