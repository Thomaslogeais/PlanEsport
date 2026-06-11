import { prisma } from "./prisma";

/**
 * Requêtes BDD pour les tournois
 * TODO (Étape 3) : enrichir selon les besoins des routes API
 */

export async function getTournaments(filters: {
  gameSlug?: string;
  competitionId?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { gameSlug, competitionId, status, page = 1, limit = 20 } = filters;

  return prisma.tournament.findMany({
    where: {
      ...(gameSlug && { competition: { game: { slug: gameSlug } } }),
      ...(competitionId && { competitionId }),
      ...(status && { status }),
    },
    include: {
      competition: { include: { game: true } },
    },
    orderBy: { startDate: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function getTournamentBySlug(slug: string) {
  // slug n'est plus globalement unique (scopé par competitionId) → findFirst
  return prisma.tournament.findFirst({
    where: { slug },
    include: {
      competition: { include: { game: true } },
      bracket: true,
      matches: {
        include: { teams: { include: { team: true } } },
        orderBy: { scheduledAt: "asc" },
      },
    },
  });
}
