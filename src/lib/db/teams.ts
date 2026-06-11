import { prisma } from "./prisma";

/**
 * Couche BDD — Équipes
 */

export type TeamFilters = {
  gameSlug?: string;
  search?: string;   // name ILIKE search (insensitive)
  limit?: number;
  offset?: number;
};

export async function getTeams(filters: TeamFilters = {}) {
  const { gameSlug, search, limit = 50, offset = 0 } = filters;

  return prisma.team.findMany({
    where: {
      ...(gameSlug && { game: { slug: gameSlug } }),
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      game: { select: { id: true, slug: true, name: true, imageUrl: true } },
      _count: { select: { matchTeams: true } },
    },
    orderBy: { name: "asc" },
    skip: offset,
    take: limit,
  });
}

export async function getTeamBySlug(slug: string) {
  return prisma.team.findFirst({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      game: { select: { id: true, slug: true, name: true, imageUrl: true } },
      _count: { select: { matchTeams: true } },
    },
  });
}
