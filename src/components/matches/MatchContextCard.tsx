import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MatchContextCardProps = {
  game: { slug: string; name: string };
  tournament: {
    id: string;
    slug: string;
    name: string;
    status: string;
    bracket: { id: string } | null;
    competition: {
      id: string;
      slug: string;
      name: string;
      game: { slug: string; name: string };
    };
  } | null;
};

// ─── Composant ───────────────────────────────────────────────────────────────

export default function MatchContextCard({ game, tournament }: MatchContextCardProps) {
  const hasBracket = !!tournament?.bracket;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6 text-sm">
      <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-4">
        Contexte
      </h2>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {/* Jeu */}
        <div>
          <dt className="text-[10px] text-[var(--muted)] mb-0.5">Jeu</dt>
          <dd className="text-white font-medium">{game.name}</dd>
        </div>

        {/* Compétition */}
        <div>
          <dt className="text-[10px] text-[var(--muted)] mb-0.5">Compétition</dt>
          <dd className="text-white font-medium">
            {tournament?.competition?.name ?? "—"}
          </dd>
        </div>

        {/* Tournoi */}
        <div className="col-span-2">
          <dt className="text-[10px] text-[var(--muted)] mb-0.5">Tournoi</dt>
          <dd>
            {tournament ? (
              <Link
                href={`/tournaments/${tournament.slug}`}
                className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium"
              >
                {tournament.name}
                <ArrowRight size={12} />
              </Link>
            ) : (
              <span className="text-[var(--muted)]">—</span>
            )}
          </dd>
        </div>

        {/* Statut tournoi */}
        {tournament && (
          <div>
            <dt className="text-[10px] text-[var(--muted)] mb-0.5">Statut tournoi</dt>
            <dd><StatusBadge status={tournament.status} /></dd>
          </div>
        )}

        {/* Bracket */}
        {tournament && (
          <div>
            <dt className="text-[10px] text-[var(--muted)] mb-0.5">Bracket</dt>
            <dd>
              {hasBracket ? (
                <Link
                  href={`/tournaments/${tournament.slug}#bracket`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300 transition-colors"
                >
                  <Trophy size={11} />
                  Voir le bracket
                </Link>
              ) : (
                <span className="text-[var(--muted)] text-xs">Non disponible</span>
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
