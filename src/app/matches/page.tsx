import type { Metadata } from "next";
import { getMatches, countMatches } from "@/lib/db/matches";
import MatchCard from "@/components/matches/MatchCard";
import MatchFilters from "@/components/matches/MatchFilters";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Matchs" };

const LIMIT = 20;

// game et status peuvent être comma-separated (multi-select)
type SP = Promise<{ game?: string; status?: string; team?: string; offset?: string }>;

export default async function MatchesPage({ searchParams }: { searchParams: SP }) {
  const sp     = await searchParams;
  const game   = typeof sp.game   === "string" ? sp.game   : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const team   = typeof sp.team   === "string" ? sp.team   : undefined;
  const offset = typeof sp.offset === "string" ? parseInt(sp.offset, 10) || 0 : 0;

  const filters = { gameSlug: game, status, teamSlug: team, limit: LIMIT, offset };

  const [raw, total] = await Promise.all([
    getMatches(filters),
    countMatches(filters),
  ]);

  const matches = raw.map((m) => ({
    id: m.id,
    name: m.name,
    status: m.status,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    game: m.game,
    tournament: m.tournament,
    teams: m.teams.map((t) => ({
      id: t.team.id, name: t.team.name, slug: t.team.slug,
      imageUrl: t.team.imageUrl, score: t.score, isWinner: t.isWinner,
    })),
  }));

  // extraParams pour la pagination (préserve les valeurs comma-separated)
  const extraParams: Record<string, string> = {};
  if (game)   extraParams.game   = game;
  if (status) extraParams.status = status;
  if (team)   extraParams.team   = team;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Matchs</h1>
        {total > 0 && <span className="text-sm text-[var(--muted)]">{total} résultats</span>}
      </div>

      <MatchFilters />

      {matches.length === 0 ? (
        <EmptyState title="Aucun match trouvé" description="Essayez de modifier vos filtres ou revenez plus tard." />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {matches.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
          <Pagination total={total} limit={LIMIT} offset={offset} basePath="/matches" extraParams={extraParams} />
        </>
      )}
    </div>
  );
}
