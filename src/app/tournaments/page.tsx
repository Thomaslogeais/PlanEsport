import type { Metadata } from "next";
import { getTournaments } from "@/lib/db/tournaments";
import TournamentCard from "@/components/tournaments/TournamentCard";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Tournois" };

const GAMES = [
  { slug: "league-of-legends", name: "League of Legends" },
  { slug: "valorant", name: "Valorant" },
  { slug: "rocket-league", name: "Rocket League" },
];

type SP = Promise<{ game?: string; status?: string }>;

export default async function TournamentsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const game   = typeof sp.game   === "string" ? sp.game   : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;

  const raw = await getTournaments({ gameSlug: game, status, limit: 50 });

  const tournaments = raw.map((t) => ({
    id: t.id, name: t.name, slug: t.slug, status: t.status,
    imageUrl: t.imageUrl,
    startDate: t.startDate?.toISOString() ?? null,
    endDate: t.endDate?.toISOString() ?? null,
    competition: {
      id: t.competition.id, slug: t.competition.slug,
      name: t.competition.name, imageUrl: t.competition.imageUrl,
      game: { slug: t.competition.game.slug, name: t.competition.game.name },
    },
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Tournois</h1>
        <span className="text-sm text-[var(--muted)]">{tournaments.length} tournois</span>
      </div>

      {/* Filtres simples */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link href="/tournaments" className={`px-3 py-1.5 rounded text-sm border transition-colors ${!game ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:text-white"}`}>
          Tous
        </Link>
        {GAMES.map((g) => (
          <Link key={g.slug} href={`/tournaments?game=${g.slug}`}
            className={`px-3 py-1.5 rounded text-sm border transition-colors ${game === g.slug ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:text-white"}`}>
            {g.name}
          </Link>
        ))}
      </div>

      {tournaments.length === 0 ? (
        <EmptyState title="Aucun tournoi trouvé" description="Essayez de modifier le filtre de jeu." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}
        </div>
      )}
    </div>
  );
}
