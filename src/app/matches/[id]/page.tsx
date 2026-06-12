import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getMatchById } from "@/lib/db/matches";
import MatchDetailHeader from "@/components/matches/MatchDetailHeader";
import MatchContextCard from "@/components/matches/MatchContextCard";
import MatchStreams from "@/components/matches/MatchStreams";
import MatchGameResults from "@/components/matches/MatchGameResults";

type Props = { params: Promise<{ id: string }> };

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = await getMatchById(id);
  if (!m) return { title: "Match introuvable" };
  const teams = m.teams.map((t) => t.team.name).join(" vs ");
  return { title: teams || m.name || "Match" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;
  const m = await getMatchById(id);
  if (!m) notFound();

  const isDev = process.env.NODE_ENV !== "production";

  // ── Données pour MatchDetailHeader ──────────────────────────────────────────
  const teams = m.teams.map((mt) => ({
    id: mt.team.id,
    name: mt.team.name,
    slug: mt.team.slug,
    imageUrl: mt.team.imageUrl,
    score: mt.score,
    isWinner: mt.isWinner,
  }));

  // ── Données pour MatchContextCard ────────────────────────────────────────────
  const tournamentForCtx = m.tournament
    ? {
        id: m.tournament.id,
        slug: m.tournament.slug,
        name: m.tournament.name,
        status: m.tournament.status,
        bracket: m.tournament.bracket ?? null,
        competition: {
          id: m.tournament.competition.id,
          slug: m.tournament.competition.slug,
          name: m.tournament.competition.name,
          game: m.tournament.competition.game ?? m.game,
        },
      }
    : null;

  // ── Données pour MatchGameResults ────────────────────────────────────────────
  const teamsForGames = m.teams.map((mt) => ({ team: { id: mt.team.id, name: mt.team.name } }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/matches" className="hover:text-white transition-colors">
          Matchs
        </Link>
        {" / "}
        <span className="text-white">
          {teams.length >= 2
            ? `${teams[0].name} vs ${teams[1].name}`
            : (m.name ?? "Match")}
        </span>
      </nav>

      {/* ── 1. Header : équipes, score, BO, date ─────────────────────────── */}
      <MatchDetailHeader
        name={m.name}
        status={m.status}
        scheduledAt={m.scheduledAt}
        teams={teams}
        rawJson={m.rawJson}
      />

      {/* ── 2. Contexte : jeu / compétition / tournoi / bracket ──────────── */}
      <MatchContextCard
        game={m.game}
        tournament={tournamentForCtx}
      />

      {/* ── 3. Résultats par game / map ───────────────────────────────────── */}
      <MatchGameResults
        status={m.status}
        rawJson={m.rawJson}
        teams={teamsForGames}
      />

      {/* ── 4. Streams ───────────────────────────────────────────────────── */}
      <MatchStreams
        streams={m.streams}
        rawJson={m.rawJson}
      />

      {/* ── 5. Debug JSON — dev uniquement ───────────────────────────────── */}
      {isDev && m.rawJson && (
        <details className="mt-4">
          <summary className="text-[10px] text-[var(--muted)] cursor-pointer hover:text-white transition-colors select-none">
            ▸ Debug rawJson (dev uniquement)
          </summary>
          <pre className="mt-2 text-[10px] text-[var(--muted)] bg-[var(--bg)] rounded p-3 overflow-auto max-h-80 leading-relaxed border border-[var(--border)]">
            {JSON.stringify(m.rawJson, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
