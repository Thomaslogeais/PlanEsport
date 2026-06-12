"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

type FacetItem  = { slug?: string; value?: string; id?: string; name: string; count: number; label?: string };
type FacetsData = {
  ok: boolean;
  games: (FacetItem & { slug: string; imageUrl?: string | null })[];
  competitions: (FacetItem & { id: string; slug: string; game?: { slug: string; name: string } })[];
  teams: (FacetItem & { id: string; slug: string })[];
  tournaments: (FacetItem & { id: string; slug: string; competition?: { slug: string; name: string } })[];
  statuses: { value: string; label: string; count: number }[];
  periods: { value: string; label: string }[];
};

// ── Pill avec hover ──────────────────────────────────────────────────────────
function Pill({
  label, active, color, onClick,
}: {
  label: string;
  active: boolean;
  color?: string;  // couleur custom pour statut
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const bg    = active ? (color ?? "var(--primary)") : hovered ? "var(--surface-hover)" : "var(--surface-2)";
  const fg    = active ? "#fff" : hovered ? "var(--text)" : "var(--muted-light)";
  const border= active ? (color ?? "var(--primary)") : hovered ? "var(--primary)" : "var(--border)";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: bg,
        color: fg,
        border: `1px solid ${border}`,
        transition: "background-color 120ms, color 120ms, border-color 120ms",
      }}
    >
      {label}
    </button>
  );
}

// ── Select stylisé (sans emoji) ──────────────────────────────────────────────
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

// ── Component principal ───────────────────────────────────────────────────────
export default function ExploreFilters() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const game        = searchParams.get("game")        ?? "";
  const competition = searchParams.get("competition") ?? "";
  const team        = searchParams.get("team")        ?? "";
  const tournament  = searchParams.get("tournament")  ?? "";
  const status      = searchParams.get("status")      ?? "";
  const period      = searchParams.get("period")      ?? "";

  const [facets, setFacets] = useState<FacetsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (game)        params.set("game", game);
    if (competition) params.set("competition", competition);
    if (team)        params.set("team", team);
    if (tournament)  params.set("tournament", tournament);
    if (status)      params.set("status", status);
    if (period)      params.set("period", period);

    fetch(`/api/explore/facets?${params.toString()}`)
      .then((r) => r.json())
      .then((d: FacetsData) => setFacets(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [game, competition, team, tournament, status, period]);

  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("offset");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const reset = () => router.push(pathname);
  const hasFilters = !!(game || competition || team || tournament || status || period);

  // ── Skeleton ──
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

  // Couleurs par statut
  const statusColors: Record<string, string> = {
    running:     "#ef4444",
    not_started: "#7c3aed",
    finished:    "#6b7280",
    canceled:    "#f59e0b",
  };

  return (
    <div className="mb-6 space-y-3">

      {/* ── Ligne 1 : Pills (listes courtes) ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">

        {/* Jeux */}
        {facets.games.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>Jeu</span>
            {facets.games.map((g) => (
              <Pill key={g.slug} label={g.name} active={game === g.slug}
                onClick={() => setFilter("game", game === g.slug ? "" : g.slug)} />
            ))}
          </div>
        )}

        {/* Séparateur */}
        {facets.statuses.length > 0 && <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--border)" }} />}

        {/* Statut */}
        {facets.statuses.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>Statut</span>
            {facets.statuses.map((s) => (
              <Pill key={s.value} label={s.label} active={status === s.value}
                color={statusColors[s.value]}
                onClick={() => setFilter("status", status === s.value ? "" : s.value)} />
            ))}
          </div>
        )}

        {/* Séparateur */}
        {facets.periods.length > 0 && <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--border)" }} />}

        {/* Période */}
        {facets.periods.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>Période</span>
            {facets.periods.map((p) => (
              <Pill key={p.value} label={p.label} active={period === p.value}
                onClick={() => setFilter("period", period === p.value ? "" : p.value)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Ligne 2 : Selects (listes longues) ────────────────────────────── */}
      {(facets.competitions.length > 0 || facets.teams.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">

          {/* Compétition */}
          {facets.competitions.length > 0 && (
            <select
              value={competition}
              onChange={(e) => setFilter("competition", e.target.value)}
              style={selectCls}
            >
              <option value="">Toutes les compétitions</option>
              {facets.competitions.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Équipe */}
          {facets.teams.length > 0 && (
            <select
              value={team}
              onChange={(e) => setFilter("team", e.target.value)}
              style={selectCls}
            >
              <option value="">Toutes les équipes</option>
              {facets.teams.map((t) => (
                <option key={t.id} value={t.slug}>{t.name}</option>
              ))}
            </select>
          )}

          {/* Tournoi (visible uniquement si une compétition est sélectionnée) */}
          {competition && facets.tournaments.length > 0 && (
            <select
              value={tournament}
              onChange={(e) => setFilter("tournament", e.target.value)}
              style={selectCls}
            >
              <option value="">Tous les tournois</option>
              {facets.tournaments.map((t) => (
                <option key={t.id} value={t.slug}>{t.name}</option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors"
              style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              <X size={10} />
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* ── Filtres actifs ────────────────────────────────────────────────── */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {game        && <ActiveBadge label={facets.games.find(g => g.slug === game)?.name ?? game} onRemove={() => setFilter("game", "")} />}
          {competition && <ActiveBadge label={facets.competitions.find(c => c.slug === competition)?.name ?? competition} onRemove={() => setFilter("competition", "")} />}
          {team        && <ActiveBadge label={facets.teams.find(t => t.slug === team)?.name ?? team} onRemove={() => setFilter("team", "")} />}
          {tournament  && <ActiveBadge label={facets.tournaments.find(t => t.slug === tournament)?.name ?? tournament} onRemove={() => setFilter("tournament", "")} />}
          {status      && <ActiveBadge label={facets.statuses.find(s => s.value === status)?.label ?? status} onRemove={() => setFilter("status", "")} />}
          {period      && <ActiveBadge label={facets.periods.find(p => p.value === period)?.label ?? period} onRemove={() => setFilter("period", "")} />}
        </div>
      )}
    </div>
  );
}

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
