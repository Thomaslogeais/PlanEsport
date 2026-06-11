import type { Metadata } from "next";
import { Suspense } from "react";
import { getMatches, countMatches } from "@/lib/db/matches";
import { periodToRange } from "@/lib/utils/period";
import MatchCard from "@/components/matches/MatchCard";
import ExploreFilters from "@/components/explore/ExploreFilters";
import GlobalSearch from "@/components/explore/GlobalSearch";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Explorer" };

const LIMIT = 20;

type SP = Promise<{
  game?: string; competition?: string; team?: string; tournament?: string;
  status?: string; period?: string; from?: string; to?: string;
  q?: string; offset?: string;
}>;

export default async function ExplorePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;

  const game        = typeof sp.game        === "string" ? sp.game        : undefined;
  const competition = typeof sp.competition === "string" ? sp.competition : undefined;
  const team        = typeof sp.team        === "string" ? sp.team        : undefined;
  const tournament  = typeof sp.tournament  === "string" ? sp.tournament  : undefined;
  const status      = typeof sp.status      === "string" ? sp.status      : undefined;
  const period      = typeof sp.period      === "string" ? sp.period      : undefined;
  const offset      = typeof sp.offset      === "string" ? (parseInt(sp.offset, 10) || 0) : 0;

  // Résoudre la période en plage de dates
  let from: Date | null = null;
  let to:   Date | null = null;

  if (period) {
    const range = periodToRange(period);
    if (range) { from = range.from; to = range.to; }
  } else {
    if (sp.from) { const d = new Date(sp.from); if (!isNaN(d.getTime())) from = d; }
    if (sp.to)   { const d = new Date(sp.to);   if (!isNaN(d.getTime())) to = d; }
  }

  const filters = {
    gameSlug: game, competitionSlug: competition, teamSlug: team,
    tournamentSlug: tournament, status, from, to,
    limit: LIMIT, offset,
  };

  const [raw, total] = await Promise.all([
    getMatches(filters),
    countMatches(filters),
  ]);

  const matches = raw.map((m) => ({
    id: m.id, name: m.name, status: m.status,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    game: m.game, tournament: m.tournament,
    teams: m.teams.map((t) => ({
      id: t.team.id, name: t.team.name, slug: t.team.slug,
      imageUrl: t.team.imageUrl, score: t.score, isWinner: t.isWinner,
    })),
  }));

  // Params à conserver pour la pagination
  const extraParams: Record<string, string> = {};
  if (game)        extraParams.game        = game;
  if (competition) extraParams.competition = competition;
  if (team)        extraParams.team        = team;
  if (tournament)  extraParams.tournament  = tournament;
  if (status)      extraParams.status      = status;
  if (period)      extraParams.period      = period;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Explorer</h1>
        <p className="text-sm text-[var(--muted)]">
          Filtrez par jeu, compétition, équipe, statut ou période. Toutes les options viennent de la base de données.
        </p>
      </div>

      {/* GlobalSearch */}
      <div className="mb-6">
        <Suspense>
          <GlobalSearch placeholder="Rechercher une équipe, compétition, tournoi…" />
        </Suspense>
      </div>

      {/* Filtres dynamiques (client) */}
      <Suspense fallback={
        <div className="flex flex-wrap gap-3 mb-6">
          {[1,2,3,4].map((i) => <div key={i} className="h-9 w-36 rounded bg-[var(--surface)] border border-[var(--border)] animate-pulse" />)}
        </div>
      }>
        <ExploreFilters />
      </Suspense>

      {/* Compteur */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--muted)]">
          {total === 0 ? "Aucun match" : `${total} match${total > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Liste des matchs */}
      {matches.length === 0 ? (
        <EmptyState
          title="Aucun match trouvé"
          description="Essayez de modifier ou supprimer certains filtres."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {matches.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
          <Pagination
            total={total} limit={LIMIT} offset={offset}
            basePath="/explore" extraParams={extraParams}
          />
        </>
      )}
    </div>
  );
}
