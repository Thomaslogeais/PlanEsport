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

  const gameSlugs = gameSlug ? gameSlug.split(",").filter(Boolean) : [];

  return prisma.team.findMany({
    where: {
      ...(gameSlugs.length === 1 ? { game: { slug: gameSlugs[0] } }
        : gameSlugs.length  > 1 ? { game: { slug: { in: gameSlugs } } } : {}),
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

/**
 * Statistiques agrégées pour une équipe.
 * Toutes les requêtes sont parallèles pour minimiser la latence.
 */
export async function getTeamStats(teamId: string) {
  // TODO: À terme, ajouter Organization pour regrouper les équipes multi-jeux
  // comme Karmine Corp, Vitality, Gentle Mates.
  // Pour l'instant, cette page représente une Team liée à un seul jeu.

  const [wins, upcoming, finished] = await Promise.all([
    prisma.matchTeam.count({
      where: { teamId, isWinner: true },
    }),
    prisma.match.count({
      where: {
        teams: { some: { teamId } },
        status: { in: ["not_started", "running"] },
      },
    }),
    prisma.match.count({
      where: {
        teams: { some: { teamId } },
        status: "finished",
      },
    }),
  ]);

  const losses = finished - wins;
  const winrate =
    finished > 0 ? Math.round((wins / finished) * 100) : null;

  return { wins, losses, upcoming, finished, winrate };
}
