/**
 * Synchronisation League of Legends — PandaScore → PostgreSQL
 * ⚠️ Backend uniquement — ne pas importer côté client
 *
 * Flux :
 *  1. Récupère le Game "league-of-legends" en base
 *  2. Fetche les matchs (upcoming + running + past) depuis PandaScore
 *  3. Déduplique les matchs par PSMatch.id
 *  4. Pour chaque match : upsert Competition → Tournament → Teams → Match → MatchTeam
 *  5. Crée un SyncLog avec les compteurs créés/mis à jour/erreurs
 */

import { prisma } from "@/lib/db/prisma";
import { PANDASCORE_PROVIDER_NAME } from "@/lib/providers/pandascore/client";
import {
  getUpcomingMatches,
  getRunningMatches,
  getPastMatches,
} from "@/lib/providers/pandascore/matches";
import { normalizeCompetition } from "@/lib/normalizers/competition.normalizer";
import { normalizeTournament } from "@/lib/normalizers/tournament.normalizer";
import { normalizeTeam } from "@/lib/normalizers/team.normalizer";
import { normalizeMatch, normalizeMatchTeams } from "@/lib/normalizers/match.normalizer";
import type { PSMatch } from "@/lib/providers/pandascore/types";
import { Prisma } from "@prisma/client";

// ─── Types internes ───────────────────────────────────────────────────────────

type EntityCounts = { created: number; updated: number };

export type SyncSummary = {
  competitions: EntityCounts;
  tournaments: EntityCounts;
  teams: EntityCounts;
  matches: EntityCounts;
  matchTeams: EntityCounts;
};

export type SyncResult = {
  ok: boolean;
  provider: string;
  game: string;
  summary: SyncSummary;
  errors: string[];
};

function emptyCounts(): EntityCounts {
  return { created: 0, updated: 0 };
}

function emptySummary(): SyncSummary {
  return {
    competitions: emptyCounts(),
    tournaments: emptyCounts(),
    teams: emptyCounts(),
    matches: emptyCounts(),
    matchTeams: emptyCounts(),
  };
}

// ─── Helpers upsert avec compteur created/updated ────────────────────────────

/**
 * Upsert d'une Competition.
 * findUnique avant upsert pour incrémenter correctement created/updated.
 */
async function upsertCompetition(
  data: ReturnType<typeof normalizeCompetition>,
  counts: EntityCounts
): Promise<string> {
  const where = {
    providerName_providerId: {
      providerName: data.providerName,
      providerId: data.providerId,
    },
  };

  const existing = await prisma.competition.findUnique({
    where,
    select: { id: true },
  });

  const record = await prisma.competition.upsert({
    where,
    create: {
      providerName: data.providerName,
      providerId: data.providerId,
      name: data.name,
      slug: data.slug,
      imageUrl: data.imageUrl,
      gameId: data.gameId,
    },
    update: {
      name: data.name,
      imageUrl: data.imageUrl,
    },
    select: { id: true },
  });

  if (existing) {
    counts.updated++;
  } else {
    counts.created++;
  }

  return record.id;
}

/**
 * Upsert d'un Tournament.
 * Si un conflit de slug survient, on ajoute le providerId en suffixe.
 */
async function upsertTournament(
  data: ReturnType<typeof normalizeTournament>,
  counts: EntityCounts
): Promise<string> {
  const where = {
    providerName_providerId: {
      providerName: data.providerName,
      providerId: data.providerId,
    },
  };

  const existing = await prisma.tournament.findUnique({
    where,
    select: { id: true },
  });

  try {
    const record = await prisma.tournament.upsert({
      where,
      create: {
        providerName: data.providerName,
        providerId: data.providerId,
        name: data.name,
        slug: data.slug,
        imageUrl: data.imageUrl,
        competitionId: data.competitionId,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        rawJson: data.rawJson as unknown as Prisma.InputJsonValue,
      },
      update: {
        name: data.name,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        rawJson: data.rawJson as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    if (existing) {
      counts.updated++;
    } else {
      counts.created++;
    }

    return record.id;
  } catch (err) {
    // Conflit de slug : on réessaie avec un slug suffixé par l'id
    const isUniqueConstraint =
      err instanceof Error && err.message.includes("Unique constraint");

    if (isUniqueConstraint && !existing) {
      const fallbackSlug = `${data.slug}-${data.providerId}`;
      const record = await prisma.tournament.upsert({
        where,
        create: {
          providerName: data.providerName,
          providerId: data.providerId,
          name: data.name,
          slug: fallbackSlug,
          imageUrl: data.imageUrl,
          competitionId: data.competitionId,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          rawJson: data.rawJson as unknown as Prisma.InputJsonValue,
        },
        update: {
          name: data.name,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          rawJson: data.rawJson as unknown as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
      counts.created++;
      return record.id;
    }
    throw err;
  }
}

/**
 * Upsert d'une Team.
 */
async function upsertTeam(
  data: ReturnType<typeof normalizeTeam>,
  counts: EntityCounts
): Promise<string> {
  const where = {
    providerName_providerId: {
      providerName: data.providerName,
      providerId: data.providerId,
    },
  };

  const existing = await prisma.team.findUnique({
    where,
    select: { id: true },
  });

  const record = await prisma.team.upsert({
    where,
    create: {
      providerName: data.providerName,
      providerId: data.providerId,
      name: data.name,
      slug: data.slug,
      imageUrl: data.imageUrl,
      gameId: data.gameId,
    },
    update: {
      name: data.name,
      imageUrl: data.imageUrl,
    },
    select: { id: true },
  });

  if (existing) {
    counts.updated++;
  } else {
    counts.created++;
  }

  return record.id;
}

/**
 * Upsert d'un Match.
 */
async function upsertMatch(
  data: ReturnType<typeof normalizeMatch>,
  counts: EntityCounts
): Promise<string> {
  const where = {
    providerName_providerId: {
      providerName: data.providerName,
      providerId: data.providerId,
    },
  };

  const existing = await prisma.match.findUnique({
    where,
    select: { id: true },
  });

  const record = await prisma.match.upsert({
    where,
    create: {
      providerName: data.providerName,
      providerId: data.providerId,
      name: data.name,
      scheduledAt: data.scheduledAt,
      status: data.status,
      gameId: data.gameId,
      tournamentId: data.tournamentId,
      results: data.results as unknown as Prisma.InputJsonValue ?? Prisma.JsonNull,
      streams: data.streams as unknown as Prisma.InputJsonValue ?? Prisma.JsonNull,
      rawJson: data.rawJson as unknown as Prisma.InputJsonValue,
    },
    update: {
      name: data.name,
      scheduledAt: data.scheduledAt,
      status: data.status,
      results: data.results as unknown as Prisma.InputJsonValue ?? Prisma.JsonNull,
      streams: data.streams as unknown as Prisma.InputJsonValue ?? Prisma.JsonNull,
      rawJson: data.rawJson as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  if (existing) {
    counts.updated++;
  } else {
    counts.created++;
  }

  return record.id;
}

/**
 * Upsert d'un MatchTeam.
 */
async function upsertMatchTeam(
  matchId: string,
  teamId: string,
  isWinner: boolean,
  score: number | null,
  counts: EntityCounts
): Promise<void> {
  const where = { matchId_teamId: { matchId, teamId } };

  const existing = await prisma.matchTeam.findUnique({
    where,
    select: { id: true },
  });

  await prisma.matchTeam.upsert({
    where,
    create: { matchId, teamId, isWinner, score },
    update: { isWinner, score },
  });

  if (existing) {
    counts.updated++;
  } else {
    counts.created++;
  }
}

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * Lance une synchronisation complète League of Legends depuis PandaScore.
 * Retourne un SyncResult avec les compteurs et les erreurs rencontrées.
 */
export async function syncLeagueOfLegendsMatches(): Promise<SyncResult> {
  const startedAt = new Date();
  const summary = emptySummary();
  const errors: string[] = [];

  // ─── 1. Récupère le jeu LoL en base ────────────────────────────────────────
  const game = await prisma.game.findUnique({
    where: { slug: "league-of-legends" },
    select: { id: true, slug: true },
  });

  if (!game) {
    const msg = "Jeu 'league-of-legends' introuvable en base. Vérifie le seed.";
    await createSyncLog({
      status: "error",
      startedAt,
      message: msg,
      summary,
      errorCount: 1,
    });
    return { ok: false, provider: PANDASCORE_PROVIDER_NAME, game: "league-of-legends", summary, errors: [msg] };
  }

  // ─── 2. Fetch PandaScore ────────────────────────────────────────────────────
  let rawMatches: PSMatch[] = [];

  try {
    const [upcoming, running, past] = await Promise.all([
      getUpcomingMatches("league-of-legends", { perPage: 50 }),
      getRunningMatches("league-of-legends", { perPage: 50 }),
      getPastMatches("league-of-legends", { perPage: 50 }),
    ]);
    rawMatches = [...upcoming, ...running, ...past];
  } catch (err) {
    const msg = `Erreur lors du fetch PandaScore : ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
    await createSyncLog({ status: "error", startedAt, message: msg, summary, errorCount: 1 });
    return { ok: false, provider: PANDASCORE_PROVIDER_NAME, game: "league-of-legends", summary, errors };
  }

  // ─── 3. Déduplication par PSMatch.id ───────────────────────────────────────
  const uniqueMatches = Array.from(
    new Map(rawMatches.map((m) => [m.id, m])).values()
  );

  // ─── 4. Traitement match par match ─────────────────────────────────────────
  for (const psMatch of uniqueMatches) {
    try {
      // ── 4a. Competition (league) ──────────────────────────────────────────
      const competitionData = normalizeCompetition(psMatch.league, game.id);
      const competitionId = await upsertCompetition(competitionData, summary.competitions);

      // ── 4b. Tournament ────────────────────────────────────────────────────
      const tournamentData = normalizeTournament(psMatch.tournament, competitionId);
      const tournamentId = await upsertTournament(tournamentData, summary.tournaments);

      // ── 4c. Teams depuis opponents ────────────────────────────────────────
      // Map psTeamId → teamId interne pour les MatchTeam
      const psTeamIdToInternalId = new Map<number, string>();

      for (const opponent of psMatch.opponents ?? []) {
        if (opponent.type !== "Team" || !opponent.opponent?.id) continue;

        const teamData = normalizeTeam(opponent.opponent, game.id);
        try {
          const teamId = await upsertTeam(teamData, summary.teams);
          psTeamIdToInternalId.set(opponent.opponent.id, teamId);
        } catch (teamErr) {
          errors.push(
            `Team ${opponent.opponent.id} (match ${psMatch.id}) : ${teamErr instanceof Error ? teamErr.message : String(teamErr)}`
          );
        }
      }

      // ── 4d. Match ─────────────────────────────────────────────────────────
      const matchData = normalizeMatch(psMatch, game.id, tournamentId);
      const matchId = await upsertMatch(matchData, summary.matches);

      // ── 4e. MatchTeam ─────────────────────────────────────────────────────
      const matchTeams = normalizeMatchTeams(psMatch);
      for (const mt of matchTeams) {
        const teamId = psTeamIdToInternalId.get(mt.psTeamId);
        if (!teamId) continue; // Team non persistée (erreur précédente)

        try {
          await upsertMatchTeam(matchId, teamId, mt.isWinner, mt.score, summary.matchTeams);
        } catch (mtErr) {
          errors.push(
            `MatchTeam match=${matchId} team=${teamId} : ${mtErr instanceof Error ? mtErr.message : String(mtErr)}`
          );
        }
      }
    } catch (matchErr) {
      const msg = `Match ${psMatch.id} : ${matchErr instanceof Error ? matchErr.message : String(matchErr)}`;
      errors.push(msg);
    }
  }

  // ─── 5. SyncLog ────────────────────────────────────────────────────────────
  const status = errors.length === 0 ? "success" : "partial";
  await createSyncLog({
    status,
    startedAt,
    message: errors.length > 0 ? `${errors.length} erreur(s) rencontrée(s)` : null,
    summary,
    errorCount: errors.length,
  });

  return {
    ok: true,
    provider: PANDASCORE_PROVIDER_NAME,
    game: "league-of-legends",
    summary,
    errors,
  };
}

// ─── Helpers SyncLog ──────────────────────────────────────────────────────────

async function createSyncLog(opts: {
  status: string;
  startedAt: Date;
  message: string | null;
  summary: SyncSummary;
  errorCount: number;
}) {
  const totalCreated =
    opts.summary.competitions.created +
    opts.summary.tournaments.created +
    opts.summary.teams.created +
    opts.summary.matches.created +
    opts.summary.matchTeams.created;

  const totalUpdated =
    opts.summary.competitions.updated +
    opts.summary.tournaments.updated +
    opts.summary.teams.updated +
    opts.summary.matches.updated +
    opts.summary.matchTeams.updated;

  await prisma.syncLog.create({
    data: {
      providerName: PANDASCORE_PROVIDER_NAME,
      syncType: "league-of-legends-matches",
      status: opts.status,
      startedAt: opts.startedAt,
      endedAt: new Date(),
      message: opts.message,
      createdCount: totalCreated,
      updatedCount: totalUpdated,
      errorCount: opts.errorCount,
    },
  });
}
