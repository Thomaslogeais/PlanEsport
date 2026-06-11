import { prisma } from "./prisma";

/**
 * Requêtes BDD pour les compétitions
 * TODO (Étape 3) : enrichir selon les besoins des routes API
 */

export async function getCompetitions(filters: {
  gameSlug?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { gameSlug, page = 1, limit = 50 } = filters;

  return prisma.competition.findMany({
    where: {
      ...(gameSlug && { game: { slug: gameSlug } }),
    },
    include: { game: true },
    orderBy: { name: "asc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function getCompetitionBySlug(slug: string) {
  // slug n'est plus globalement unique (scopé par gameId) → findFirst
  return prisma.competition.findFirst({
    where: { slug },
    include: {
      game: true,
      tournaments: {
        orderBy: { startDate: "desc" },
        take: 10,
      },
    },
  });
}
