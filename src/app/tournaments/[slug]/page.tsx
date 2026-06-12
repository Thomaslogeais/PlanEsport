import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { getTournamentBySlug } from "@/lib/db/tournaments";
import MatchCard from "@/components/matches/MatchCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { BracketViewer } from "@/components/tournaments/BracketViewer";
import { formatDate } from "@/lib/utils/date";

type Props = { params: Promise<{ slug: string }> };

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Retourne true si le bracket existe et que tous les matchs ont des équipes TBD.
 * Gère les structures inconnues sans crasher — retourne false par défaut.
 */
function isBracketAllTBD(rawJson: unknown): boolean {
  try {
    // Guard : doit être un tableau non-vide
    if (!Array.isArray(rawJson) || rawJson.length === 0) return false;

    // Chaque élément doit ressembler à un match avec opponents
    return rawJson.every((item) => {
      // Guard : doit être un objet
      if (typeof item !== "object" || item === null) return false;

      const match = item as Record<string, unknown>;
      const opponents = match.opponents;

      // Si pas d'opponents du tout → TBD
      if (!Array.isArray(opponents)) return true;
      if (opponents.length === 0) return true;

      // Si au moins un opponent a un nom → pas TBD
      return opponents.every((opp) => {
        if (typeof opp !== "object" || opp === null) return true;
        const o = opp as Record<string, unknown>;
        const inner = o.opponent;
        if (typeof inner !== "object" || inner === null) return true;
        const name = (inner as Record<string, unknown>).name;
        const acronym = (inner as Record<string, unknown>).acronym;
        return !name && !acronym;
      });
    });
  } catch {
    // Ne jamais crasher la page
    return false;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const hasBracket = !!t.bracket;
  const bracketRawJson = t.bracket?.rawJson as Record<string, unknown> | null ?? null;
  const bracketUpdatedAt = t.bracket?.updatedAt?.toISOString();
  const bracketAllTBD = hasBracket && isBracketAllTBD(bracketRawJson);

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
        <div>
          <p className="text-[var(--muted)] text-xs mb-1">Bracket</p>
          {hasBracket ? (
            <span className="text-green-400 text-xs font-medium">✓ Disponible</span>
          ) : (
            <span className="text-[var(--muted)] text-xs">Non disponible</span>
          )}
        </div>
      </div>

      {/* Match list */}
      <h2 className="text-lg font-semibold text-white mb-4">Matchs ({t.matches.length})</h2>
      {matches.length === 0 ? (
        <EmptyState title="Aucun match pour ce tournoi" />
      ) : (
        <div className="flex flex-col gap-3 mb-10">
          {matches.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      )}

      {/* Section Bracket */}
      <div id="bracket" className="mt-2">
        <h2 className="text-lg font-semibold text-white mb-4">Bracket</h2>

        {hasBracket && bracketRawJson ? (
          <>
            {/* Message discret si toutes les équipes sont TBD */}
            {bracketAllTBD && (
              <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-3 px-1">
                <Info size={13} className="shrink-0 text-blue-400" />
                <span>
                  Le bracket est disponible, mais certaines équipes ne sont pas encore qualifiées.
                </span>
              </div>
            )}
            <BracketViewer
              rawJson={bracketRawJson}
              updatedAt={bracketUpdatedAt}
            />
          </>
        ) : matches.length > 0 ? (
          /* Tournoi avec matchs mais sans bracket */
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="text-sm text-[var(--muted)]">
              Bracket non disponible pour ce tournoi.
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Les matchs sont visibles ci-dessus.
            </p>
          </div>
        ) : (
          /* Tournoi vide sans bracket */
          <EmptyState title="Aucun bracket ni match disponible" />
        )}
      </div>
    </div>
  );
}
