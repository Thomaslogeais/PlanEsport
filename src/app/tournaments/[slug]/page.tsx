import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTournamentBySlug } from "@/lib/db/tournaments";
import MatchCard from "@/components/matches/MatchCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils/date";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTournamentBySlug(slug);
  return { title: t ? t.name : "Tournoi introuvable" };
}

export default async function TournamentDetailPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTournamentBySlug(slug);
  if (!t) notFound();

  const gameInfo = { slug: t.competition.game.slug, name: t.competition.game.name, imageUrl: t.competition.game.imageUrl };
  const competitionInfo = { id: t.competition.id, slug: t.competition.slug, name: t.competition.name, imageUrl: t.competition.imageUrl };
  const tournamentInfo = { id: t.id, slug: t.slug, name: t.name, competition: competitionInfo };

  const matches = t.matches.map((m) => ({
    id: m.id, name: m.name, status: m.status,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    game: gameInfo,
    tournament: tournamentInfo,
    teams: m.teams.map((mt) => ({
      id: mt.team.id, name: mt.team.name, slug: mt.team.slug,
      imageUrl: mt.team.imageUrl, score: mt.score, isWinner: mt.isWinner,
    })),
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="text-sm text-[var(--muted)] mb-6">
        <Link href="/tournaments" className="hover:text-white transition-colors">Tournois</Link>
        {" / "}
        <span className="text-white">{t.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-[var(--muted)] mb-1">{t.competition.game.name} · {t.competition.name}</p>
          <h1 className="text-2xl font-bold text-white">{t.name}</h1>
        </div>
        <StatusBadge status={t.status} />
      </div>

      {/* Info card */}
      <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] mb-8 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[var(--muted)] text-xs mb-1">Début</p>
          <p className="text-white">{formatDate(t.startDate?.toISOString())}</p>
        </div>
        <div>
          <p className="text-[var(--muted)] text-xs mb-1">Fin</p>
          <p className="text-white">{formatDate(t.endDate?.toISOString())}</p>
        </div>
        <div>
          <p className="text-[var(--muted)] text-xs mb-1">Matchs</p>
          <p className="text-white">{t.matches.length}</p>
        </div>
        {t.bracket && (
          <div>
            <p className="text-[var(--muted)] text-xs mb-1">Bracket</p>
            <span className="text-green-400 text-xs">✓ Disponible</span>
          </div>
        )}
      </div>

      {/* Match list */}
      <h2 className="text-lg font-semibold text-white mb-4">Matchs ({t.matches.length})</h2>
      {matches.length === 0 ? (
        <EmptyState title="Aucun match pour ce tournoi" />
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  );
}
