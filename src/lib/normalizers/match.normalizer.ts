/**
 * Normalizer — Match (Match PandaScore)
 * Transforme un PSMatch brut en données prêtes pour l'upsert Prisma
 */

import { PANDASCORE_PROVIDER_NAME } from "@/lib/providers/pandascore/client";
import type { PSMatch } from "@/lib/providers/pandascore/types";

export type NormalizedMatch = {
  providerName: string;
  providerId: string;
  name: string | null;
  scheduledAt: Date | null;
  status: string;
  gameId: string;       // ID interne Prisma du Game
  tournamentId: string; // ID interne Prisma du Tournament
  results: PSMatch["results"];
  streams: PSMatch["streams_list"] | null;
  rawJson: PSMatch;
};

export type NormalizedMatchTeam = {
  psTeamId: number;  // ID PandaScore de l'équipe (pour retrouver le Team.id)
  isWinner: boolean;
  score: number | null;
};

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

const STATUS_MAP: Record<string, string> = {
  not_started: "not_started",
  running: "running",
  finished: "finished",
  canceled: "finished",
  cancelled: "finished",
};

/**
 * Normalise un match PandaScore (PSMatch) vers un NormalizedMatch.
 * @param psMatch      Données brutes PandaScore
 * @param gameId       ID interne Prisma du Game
 * @param tournamentId ID interne Prisma du Tournament
 */
export function normalizeMatch(
  psMatch: PSMatch,
  gameId: string,
  tournamentId: string
): NormalizedMatch {
  const status = STATUS_MAP[psMatch.status] ?? psMatch.status ?? "not_started";
  const scheduledAt =
    parseDate(psMatch.scheduled_at) ?? parseDate(psMatch.begin_at);

  return {
    providerName: PANDASCORE_PROVIDER_NAME,
    providerId: String(psMatch.id),
    name: psMatch.name ?? null,
    scheduledAt,
    status,
    gameId,
    tournamentId,
    results: psMatch.results ?? null,
    streams: psMatch.streams_list?.length ? psMatch.streams_list : null,
    rawJson: psMatch,
  };
}

/**
 * Extrait les participants (MatchTeam) d'un PSMatch.
 * Ne retourne que les opponents de type "Team" avec un id valide.
 * Enrichit avec le score et le statut gagnant si disponibles.
 */
export function normalizeMatchTeams(psMatch: PSMatch): NormalizedMatchTeam[] {
  if (!psMatch.opponents?.length) return [];

  return psMatch.opponents
    .filter((o) => o.type === "Team" && o.opponent?.id != null)
    .map((o) => {
      const teamId = o.opponent.id;

      // Cherche le score dans results
      const resultEntry = psMatch.results?.find((r) => r.team_id === teamId);
      const score = resultEntry?.score ?? null;

      // Détermine si cette équipe est gagnante
      const isWinner =
        psMatch.winner_type === "Team" &&
        psMatch.winner_id === teamId;

      return {
        psTeamId: teamId,
        isWinner,
        score,
      };
    });
}
