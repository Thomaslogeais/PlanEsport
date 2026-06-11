import { prisma } from "./prisma";

/**
 * Couche BDD — Facets d'exploration
 *
 * Retourne les options de filtres disponibles depuis PostgreSQL.
 * Les counts sont calculés avec les filtres actifs quand c'est simple et fiable.
 * Les seules valeurs statiques sont les statuts (labels) et les périodes.
 */

export type FacetFilters = {
  gameSlug?: string;
  competitionSlug?: string;
  teamSlug?: string;
  tournamentSlug?: string;
  status?: string;
  from?: Date | null;
  to?: Date | null;
};

/** Clause where partagée pour compter les matchs avec filtres actifs */
function buildMatchWhere(f: FacetFilters) {
  const scheduledAt: Record<string, Date> = {};
  if (f.from) scheduledAt.gte = f.from;
  if (f.to) scheduledAt.lte = f.to;

  return {
    ...(f.gameSlug && { game: { slug: f.gameSlug } }),
    ...(f.teamSlug && { teams: { some: { team: { slug: f.teamSlug } } } }),
    ...(f.competitionSlug && { tournament: { competition: { slug: f.competitionSlug } } }),
    ...(f.tournamentSlug && { tournament: { slug: f.tournamentSlug } }),
    ...(f.status && { status: f.status }),
    ...(Object.keys(scheduledAt).length > 0 && { scheduledAt }),
  };
}

export async function getFacets(filters: FacetFilters = {}) {
  const { gameSlug, competitionSlug } = filters;

  const [games, competitions, teams, tournaments, statusGroups] = await Promise.all([
    // ── Games : tous, count de matchs direct (Match.gameId) ──────────────────
    prisma.game.findMany({
      include: { _count: { select: { matches: true } } },
      orderBy: { name: "asc" },
    }),

    // ── Compétitions : top 50, filtrées par jeu, count de tournois ──────────
    prisma.competition.findMany({
      where: { ...(gameSlug && { game: { slug: gameSlug } }) },
      include: {
        _count: { select: { tournaments: true } },
        game: { select: { slug: true, name: true } },
      },
      orderBy: { name: "asc" },
      take: 50,
    }),

    // ── Équipes : top 20 par activité, filtrées par jeu + compétition ────────
    prisma.team.findMany({
      where: {
        ...(gameSlug && { game: { slug: gameSlug } }),
        ...(competitionSlug && {
          matchTeams: {
            some: {
              match: { tournament: { competition: { slug: competitionSlug } } },
            },
          },
        }),
      },
      include: { _count: { select: { matchTeams: true } } },
      orderBy: { matchTeams: { _count: "desc" } },
      take: 20,
    }),

    // ── Tournois : top 20, filtrés par jeu + compétition ─────────────────────
    prisma.tournament.findMany({
      where: {
        ...(gameSlug && { competition: { game: { slug: gameSlug } } }),
        ...(competitionSlug && { competition: { slug: competitionSlug } }),
      },
      include: {
        _count: { select: { matches: true } },
        competition: { select: { slug: true, name: true } },
      },
      orderBy: { startDate: "desc" },
      take: 20,
    }),

    // ── Statuts : comptés avec filtres actifs (sauf status lui-même) ─────────
    prisma.match.groupBy({
      by: ["status"],
      where: buildMatchWhere({ ...filters, status: undefined }),
      _count: { id: true },
    }),
  ]);

  return { games, competitions, teams, tournaments, statusGroups };
}
