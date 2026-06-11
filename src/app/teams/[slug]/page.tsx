import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTeamBySlug } from "@/lib/db/teams";
import { getMatches } from "@/lib/db/matches";
import MatchCard from "@/components/matches/MatchCard";
import EmptyState from "@/components/ui/EmptyState";
import FollowButton from "@/components/ui/FollowButton";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTeamBySlug(slug);
  return { title: t ? t.name : "Équipe introuvable" };
}

export default async function TeamDetailPage({ params }: Props) {
  const { slug } = await params;
  const [team, rawMatches] = await Promise.all([
    getTeamBySlug(slug),
    getMatches({ teamSlug: slug, limit: 10 }),
  ]);
  if (!team) notFound();

  const initials = team.name.slice(0, 2).toUpperCase();
  const matches = rawMatches.map((m) => ({
    id: m.id, name: m.name, status: m.status,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    game: m.game, tournament: m.tournament,
    teams: m.teams.map((t) => ({
      id: t.team.id, name: t.team.name, slug: t.team.slug,
      imageUrl: t.team.imageUrl, score: t.score, isWinner: t.isWinner,
    })),
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-sm text-[var(--muted)] mb-6">
        <Link href="/teams" className="hover:text-white transition-colors">Équipes</Link>
        {" / "}
        <span className="text-white">{team.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {team.imageUrl ? (
            <Image src={team.imageUrl} alt={team.name} width={64} height={64}
              className="rounded-xl object-contain" style={{ backgroundColor: "var(--surface-2)" }} />
          ) : (
            <span className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: "var(--surface-2)", color: "var(--muted)" }}>{initials}</span>
          )}
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>{team.name}</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{team.game.name} · {team._count.matchTeams} matchs joués</p>
          </div>
        </div>
        <FollowButton type="team" id={team.id} slug={team.slug} name={team.name} />
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Derniers matchs</h2>
      {matches.length === 0 ? (
        <EmptyState title="Aucun match récent" />
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      )}

      <div className="mt-6">
        <Link href={`/matches?team=${team.slug}`}
          className="text-sm text-[var(--primary)] hover:underline">
          Voir tous les matchs →
        </Link>
      </div>
    </div>
  );
}
