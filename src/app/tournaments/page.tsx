import type { Metadata } from "next";
import { Suspense } from "react";
import { getTournaments } from "@/lib/db/tournaments";
import TournamentCard from "@/components/tournaments/TournamentCard";
import EmptyState from "@/components/ui/EmptyState";
import PillGroup from "@/components/ui/PillGroup";

export const metadata: Metadata = { title: "Tournois" };

const GAMES = [
  { value: "league-of-legends", label: "League of Legends" },
  { value: "valorant",          label: "Valorant" },
  { value: "rocket-league",     label: "Rocket League" },
];
const STATUSES = [
  { value: "not_started", label: "À venir",  color: "#7c3aed" },
  { value: "running",     label: "En cours",  color: "#ef4444" },
  { value: "finished",    label: "Terminé",   color: "#6b7280" },
];

type SP = Promise<{ game?: string; status?: string }>;

export default async function TournamentsPage({ searchParams }: { searchParams: SP }) {
  const sp     = await searchParams;
  const game   = typeof sp.game   === "string" ? sp.game   : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;

  const raw = await getTournaments({ gameSlug: game, status, limit: 50 });

  const tournaments = raw.map((t) => ({
    id: t.id, name: t.name, slug: t.slug, status: t.status,
    imageUrl: t.imageUrl,
    startDate: t.startDate?.toISOString() ?? null,
    endDate:   t.endDate?.toISOString()   ?? null,
    hasBracket: !!t.bracket,
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

      {/* Pills multi-select */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
        <Suspense>
          <PillGroup paramKey="game"   label="Jeu"    options={GAMES} />
          <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--border)" }} />
          <PillGroup paramKey="status" label="Statut" options={STATUSES} />
        </Suspense>
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
