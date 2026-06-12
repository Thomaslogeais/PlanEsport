import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTeamBySlug, getTeamStats } from "@/lib/db/teams";
import { getMatches } from "@/lib/db/matches";
import TeamHeader from "@/components/teams/TeamHeader";
import TeamStats from "@/components/teams/TeamStats";
import TeamMatchesSection from "@/components/teams/TeamMatchesSection";

type Props = { params: Promise<{ slug: string }> };

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  return { title: team ? team.name : "Équipe introuvable" };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Transforme un résultat de getMatches() en MatchCardDTO */
function toMatchCards(
  rawMatches: Awaited<ReturnType<typeof getMatches>>,
  gameOverride?: { slug: string; name: string; imageUrl: string | null }
) {
  return rawMatches.map((m) => ({
    id: m.id,
    name: m.name,
    status: m.status,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    game: gameOverride ?? m.game,
    tournament: m.tournament
      ? {
          id: m.tournament.id,
          slug: m.tournament.slug,
          name: m.tournament.name,
          competition: m.tournament.competition,
        }
      : null,
    teams: m.teams.map((t) => ({
      id: t.team.id,
      name: t.team.name,
      slug: t.team.slug,
      imageUrl: t.team.imageUrl,
      score: t.score,
      isWinner: t.isWinner,
    })),
  }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TeamDetailPage({ params }: Props) {
  const { slug } = await params;

  // ── 1. Équipe ──────────────────────────────────────────────────────────────
  const team = await getTeamBySlug(slug);
  if (!team) notFound();

  // ── 2. Stats + matchs en parallèle ────────────────────────────────────────
  const [stats, upcomingRaw, finishedRaw] = await Promise.all([
    getTeamStats(team.id),
    getMatches({
      teamSlug: slug,
      status: "not_started,running",
      limit: 10,
      orderDir: "asc",
    }),
    getMatches({
      teamSlug: slug,
      status: "finished",
      limit: 10,
      orderDir: "desc",
    }),
  ]);

  // ── 3. Conversion en MatchCardDTO ──────────────────────────────────────────
  const upcomingMatches = toMatchCards(upcomingRaw, team.game);
  const finishedMatches = toMatchCards(finishedRaw, team.game);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/teams" className="hover:text-white transition-colors">
          Équipes
        </Link>
        {" / "}
        <span className="text-white">{team.name}</span>
      </nav>

      {/* ── 1. Header : logo, nom, jeu, FollowButton ───────────────────────── */}
      <TeamHeader
        id={team.id}
        name={team.name}
        slug={team.slug}
        imageUrl={team.imageUrl}
        game={team.game}
        totalMatches={team._count.matchTeams}
      />

      {/* ── 2. Statistiques ────────────────────────────────────────────────── */}
      <TeamStats
        total={team._count.matchTeams}
        wins={stats.wins}
        losses={stats.losses}
        upcoming={stats.upcoming}
        finished={stats.finished}
        winrate={stats.winrate}
      />

      {/* ── 3. Prochains matchs ────────────────────────────────────────────── */}
      <TeamMatchesSection
        title="Prochains matchs"
        matches={upcomingMatches}
        emptyTitle="Aucun match à venir"
        emptyDescription="Cette équipe n'a pas de match planifié pour le moment."
      />

      {/* ── 4. Derniers résultats ──────────────────────────────────────────── */}
      <TeamMatchesSection
        title="Derniers résultats"
        matches={finishedMatches}
        emptyTitle="Aucun résultat récent"
        emptyDescription="Aucun match terminé disponible pour cette équipe."
      />
    </div>
  );
}
