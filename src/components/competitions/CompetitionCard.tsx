import type { Competition } from "@/types/competition";

/**
 * Carte affichant une compétition
 * TODO (Étape 4/5) : implémenter l'UI complète avec bouton de suivi
 */
interface CompetitionCardProps {
  competition: Competition;
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  return (
    <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
      <p className="text-sm text-[var(--muted)]">{competition.game.name}</p>
      <p className="text-white font-medium">{competition.name}</p>
    </div>
  );
}
