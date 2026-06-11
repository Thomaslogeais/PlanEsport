"use client";

import { useFollowing } from "@/hooks/useFollowing";

/**
 * Vue de l'agenda personnalisé
 * Affiche les matchs filtrés selon les équipes/compétitions suivies
 * TODO (Étape 7) : implémenter la récupération et l'affichage des matchs
 */
export function AgendaView() {
  const { followedTeams, followedCompetitions, isHydrated } = useFollowing();

  if (!isHydrated) {
    return (
      <div className="p-8 text-center text-[var(--muted)] text-sm">
        Chargement...
      </div>
    );
  }

  if (followedTeams.length === 0 && followedCompetitions.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-[var(--surface)] border border-[var(--border)]">
        <p className="text-[var(--muted)] text-sm">
          Vous ne suivez encore aucune équipe ni compétition.
          Rendez-vous sur les pages d&apos;équipes et de compétitions pour commencer à personnaliser votre agenda.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[var(--muted)] text-sm mb-4">
        Vous suivez {followedTeams.length} équipe(s) et {followedCompetitions.length} compétition(s).
      </p>
      <div className="p-8 text-center rounded-lg bg-[var(--surface)] border border-[var(--border)]">
        <p className="text-[var(--muted)] text-sm">
          Affichage des matchs filtrés — à implémenter (Étape 7)
        </p>
      </div>
    </div>
  );
}
