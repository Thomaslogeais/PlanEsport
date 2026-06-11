"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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

const selectCls = "bg-[var(--surface)] border border-[var(--border)] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[var(--primary)] cursor-pointer min-w-[140px]";

export default function ExploreFilters() {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  const game        = searchParams.get("game")        ?? "";
  const competition = searchParams.get("competition") ?? "";
  const team        = searchParams.get("team")        ?? "";
  const tournament  = searchParams.get("tournament")  ?? "";
  const status      = searchParams.get("status")      ?? "";
  const period      = searchParams.get("period")      ?? "";

  const [facets, setFacets] = useState<FacetsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Recharger les facets quand les filtres actifs changent
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

  // Mettre à jour un filtre dans l'URL
  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("offset"); // reset pagination
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const reset = () => router.push(pathname);

  const hasFilters = !!(game || competition || team || tournament || status || period);

  if (loading && !facets) {
    return (
      <div className="flex flex-wrap gap-3 mb-6">
        {[1,2,3,4].map((i) => <div key={i} className="h-9 w-36 rounded bg-[var(--surface)] border border-[var(--border)] animate-pulse" />)}
      </div>
    );
  }

  if (!facets) return null;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Jeu — dynamique depuis la BDD */}
        <select value={game} onChange={(e) => setFilter("game", e.target.value)} className={selectCls}>
          <option value="">🎮 Tous les jeux</option>
          {facets.games.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.name} {g.count > 0 ? `(${g.count})` : ""}
            </option>
          ))}
        </select>

        {/* Compétition — filtrée par jeu */}
        {facets.competitions.length > 0 && (
          <select value={competition} onChange={(e) => setFilter("competition", e.target.value)} className={selectCls}>
            <option value="">🏆 Toutes les compétitions</option>
            {facets.competitions.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name} {c.count > 0 ? `(${c.count})` : ""}
              </option>
            ))}
          </select>
        )}

        {/* Équipe — top 20, filtrée par jeu + compétition */}
        {facets.teams.length > 0 && (
          <select value={team} onChange={(e) => setFilter("team", e.target.value)} className={selectCls}>
            <option value="">👥 Toutes les équipes</option>
            {facets.teams.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name} {t.count > 0 ? `(${t.count})` : ""}
              </option>
            ))}
          </select>
        )}

        {/* Tournoi — top 20, filtré par jeu + compétition */}
        {competition && facets.tournaments.length > 0 && (
          <select value={tournament} onChange={(e) => setFilter("tournament", e.target.value)} className={selectCls}>
            <option value="">📅 Tous les tournois</option>
            {facets.tournaments.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name} {t.count > 0 ? `(${t.count})` : ""}
              </option>
            ))}
          </select>
        )}

        {/* Statut */}
        <select value={status} onChange={(e) => setFilter("status", e.target.value)} className={selectCls}>
          <option value="">⚡ Tous les statuts</option>
          {facets.statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label} {s.count > 0 ? `(${s.count})` : ""}
            </option>
          ))}
        </select>

        {/* Période — statique (valeurs fixes) */}
        <select value={period} onChange={(e) => setFilter("period", e.target.value)} className={selectCls}>
          <option value="">📆 Toute période</option>
          {facets.periods.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button onClick={reset} className="text-xs text-[var(--muted)] hover:text-white underline transition-colors">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Filtres actifs affichés sous forme de badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          {game        && <ActiveBadge label={`Jeu: ${facets.games.find(g => g.slug === game)?.name ?? game}`} onRemove={() => setFilter("game", "")} />}
          {competition && <ActiveBadge label={`Compétition: ${facets.competitions.find(c => c.slug === competition)?.name ?? competition}`} onRemove={() => { setFilter("competition", ""); }} />}
          {team        && <ActiveBadge label={`Équipe: ${facets.teams.find(t => t.slug === team)?.name ?? team}`} onRemove={() => setFilter("team", "")} />}
          {tournament  && <ActiveBadge label={`Tournoi: ${facets.tournaments.find(t => t.slug === tournament)?.name ?? tournament}`} onRemove={() => setFilter("tournament", "")} />}
          {status      && <ActiveBadge label={`Statut: ${facets.statuses.find(s => s.value === status)?.label ?? status}`} onRemove={() => setFilter("status", "")} />}
          {period      && <ActiveBadge label={`Période: ${facets.periods.find(p => p.value === period)?.label ?? period}`} onRemove={() => setFilter("period", "")} />}
        </div>
      )}
    </div>
  );
}

function ActiveBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors ml-1">✕</button>
    </span>
  );
}
