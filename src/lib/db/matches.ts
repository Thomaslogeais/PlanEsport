import { prisma } from "./prisma";

/**
 * Couche BDD — Matchs
 * Toutes les requêtes passent par ici. Jamais de PandaScore direct.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchFilters = {
  gameSlug?: string;         // filtre sur Game.slug
  teamSlug?: string;         // filtre sur Team.slug (via MatchTeam)
  competitionSlug?: string;  // filtre sur Competition.slug (via Tournament)
  tournamentSlug?: string;   // filtre sur Tournament.slug
  status?: string;           // "not_started" | "running" | "finished"
  from?: Date | null;        // scheduledAt >= from
  to?: Date | null;          // scheduledAt <= to
  limit?: number;
  offset?: number;
};

// Select partagé pour les listes (pas de rawJson)
const matchListInclude = {
  game: {
    select: { id: true, slug: true, name: true, imageUrl: true },
  },
  tournament: {
    select: {
      id: true,
      slug: true,
      name: true,
      competition: {
        select: { id: true, slug: true, name: true, imageUrl: true },
      },
    },
  },
  teams: {
    select: {
      isWinner: true,
      score: true,
      team: {
        select: { id: true, name: true, slug: true, imageUrl: true },
      },
    },
  },
} as const;

// ─── Requêtes ─────────────────────────────────────────────────────────────────

/**
 * Récupère les matchs filtrés. Ne retourne jamais rawJson.
 */
export async function getMatches(filters: MatchFilters = {}) {
  const {
    gameSlug,
    teamSlug,
    competitionSlug,
    tournamentSlug,
    status,
    from,
    to,
    limit = 50,
    offset = 0,
  } = filters;

  // Clause scheduledAt
  const scheduledAtFilter: Record<string, Date> = {};
  if (from) scheduledAtFilter.gte = from;
  if (to) scheduledAtFilter.lte = to;

  // Support valeurs multiples séparées par virgule
  const gameSlugs   = gameSlug ? gameSlug.split(",").filter(Boolean)  : [];
  const statuses    = status   ? status.split(",").filter(Boolean)     : [];

  return prisma.match.findMany({
    where: {
      ...(gameSlugs.length === 1 ? { game: { slug: gameSlugs[0] } }
        : gameSlugs.length  > 1 ? { game: { slug: { in: gameSlugs } } } : {}),
      ...(teamSlug && { teams: { some: { team: { slug: teamSlug } } } }),
      ...(competitionSlug && {
        tournament: { competition: { slug: competitionSlug } },
      }),
      ...(tournamentSlug && { tournament: { slug: tournamentSlug } }),
      ...(statuses.length === 1 ? { status: statuses[0] }
        : statuses.length  > 1 ? { status: { in: statuses } } : {}),
      ...(Object.keys(scheduledAtFilter).length > 0 && {
        scheduledAt: scheduledAtFilter,
      }),
    },
    include: matchListInclude,
    orderBy: { scheduledAt: "asc" },
    skip: offset,
    take: limit,
  });
}

/**
 * Compte les matchs (pour pagination côté client si besoin).
 */
export async function countMatches(filters: MatchFilters = {}) {
  const {
    gameSlug,
    teamSlug,
    competitionSlug,
    tournamentSlug,
    status,
    from,
    to,
  } = filters;

  const scheduledAtFilter: Record<string, Date> = {};
  if (from) scheduledAtFilter.gte = from;
  if (to) scheduledAtFilter.lte = to;

  const gameSlugs = gameSlug ? gameSlug.split(",").filter(Boolean) : [];
  const statuses  = status   ? status.split(",").filter(Boolean)   : [];

  return prisma.match.count({
    where: {
      ...(gameSlugs.length === 1 ? { game: { slug: gameSlugs[0] } }
        : gameSlugs.length  > 1 ? { game: { slug: { in: gameSlugs } } } : {}),
      ...(teamSlug && { teams: { some: { team: { slug: teamSlug } } } }),
      ...(competitionSlug && {
        tournament: { competition: { slug: competitionSlug } },
      }),
      ...(tournamentSlug && { tournament: { slug: tournamentSlug } }),
      ...(statuses.length === 1 ? { status: statuses[0] }
        : statuses.length  > 1 ? { status: { in: statuses } } : {}),
      ...(Object.keys(scheduledAtFilter).length > 0 && {
        scheduledAt: scheduledAtFilter,
      }),
    },
  });
}

/**
 * Détail complet d'un match par ID interne Prisma.
 * Inclut rawJson uniquement hors production.
 */
export async function getMatchById(id: string) {
  return prisma.match.findUnique({
    where: { id },
    select: {
      id: true,
      providerId: true,
      providerName: true,
      name: true,
      status: true,
      scheduledAt: true,
      results: true,
      streams: true,
      rawJson: true,
      createdAt: true,
      updatedAt: true,
      game: {
        select: { id: true, slug: true, name: true, imageUrl: true },
      },
      tournament: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
          bracket: { select: { id: true } },
          competition: {
            select: {
              id: true,
              slug: true,
              name: true,
              imageUrl: true,
              game: { select: { slug: true, name: true } },
            },
          },
        },
      },
      teams: {
        select: {
          isWinner: true,
          score: true,
          team: {
            select: { id: true, name: true, slug: true, imageUrl: true },
          },
        },
      },
    },
  });
}
