import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCompetitionBySlug } from "@/lib/db/competitions";
import { getMatches } from "@/lib/db/matches";
import MatchCard from "@/components/matches/MatchCard";
import EmptyState from "@/components/ui/EmptyState";
import FollowButton from "@/components/ui/FollowButton";
import { Trophy } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCompetitionBySlug(slug);
  return { title: c ? c.name : "Compétition introuvable" };
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { slug } = await params;
  const [competition, rawMatches] = await Promise.all([
    getCompetitionBySlug(slug),
    getMatches({ competitionSlug: slug, limit: 20 }),
  ]);
  if (!competition) notFound();

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
      {/* Breadcrumb */}
      <div className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        <Link href="/explore" className="hover:underline">Explorer</Link>
        {" / "}
        <span style={{ color: "var(--text)" }}>{competition.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {competition.imageUrl ? (
            <Image src={competition.imageUrl} alt={competition.name} width={64} height={64}
              className="rounded-xl object-contain" style={{ backgroundColor: "var(--surface-2)" }} />
          ) : (
            <div className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--surface-2)", color: "var(--muted)" }}>
              <Trophy size={24} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>{competition.name}</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {competition.game?.name ?? "—"} · {competition.tournaments?.length ?? 0} tournoi{(competition.tournaments?.length ?? 0) > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <FollowButton type="competition" id={competition.id} slug={competition.slug} name={competition.name} />
      </div>

      {/* Tournois */}
      {competition.tournaments && competition.tournaments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>Tournois</h2>
          <div className="flex flex-col gap-2">
            {competition.tournaments.map((t) => (
              <Link key={t.id} href={`/tournaments/${t.slug}`}
                className="flex items-center justify-between p-3 rounded-xl transition-colors"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{t.name}</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{t.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Matchs */}
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>Matchs récents / à venir</h2>
      {matches.length === 0 ? (
        <EmptyState title="Aucun match disponible" description="Les matchs de cette compétition apparaîtront ici." />
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  );
}
