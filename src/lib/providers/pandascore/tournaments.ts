/**
 * Provider PandaScore — Tournois, Brackets, Standings
 * ⚠️ Backend uniquement — ne pas importer côté client
 *
 * Endpoints utilisés :
 *   GET /tournaments                          → tous jeux
 *   GET /{psSlug}/tournaments                 → jeu spécifique
 *   GET /tournaments/{id_or_slug}/brackets    → bracket d'un tournoi
 *   GET /tournaments/{id_or_slug}/standings   → classement d'un tournoi
 *
 * Ref : https://developers.pandascore.co/reference#tag/Tournaments
 */

import {
  requestPandaScore,
  resolvePandaScoreSlug,
  PS_TOURNAMENT_STATUS,
  type PandaScorePaginationParams,
} from "./client";
import type { PSBracket, PSStandings, PSTournament } from "./types";

type TournamentOptions = PandaScorePaginationParams;

/**
 * Retourne le préfixe d'endpoint selon le jeu fourni.
 * Sans gameSlug → /tournaments (tous jeux)
 * Avec gameSlug → /lol/tournaments, etc.
 */
function tournamentsPath(gameSlug?: string): string {
  if (!gameSlug) return "/tournaments";
  const psSlug = resolvePandaScoreSlug(gameSlug);
  return `/${psSlug}/tournaments`;
}

// ─── Fonctions publiques ──────────────────────────────────────────────────────

/**
 * Récupère les tournois en cours (statut "running")
 * @param gameSlug  Slug interne du jeu (optionnel)
 */
export async function getRunningTournaments(
  gameSlug?: string,
  options: TournamentOptions = {}
): Promise<PSTournament[]> {
  return requestPandaScore<PSTournament[]>(tournamentsPath(gameSlug), {
    ...options,
    filter: { status: PS_TOURNAMENT_STATUS.running },
    sort: "begin_at",
    perPage: options.perPage ?? 50,
  });
}

/**
 * Récupère les tournois à venir (statut "not_started")
 * @param gameSlug  Slug interne du jeu (optionnel)
 */
export async function getUpcomingTournaments(
  gameSlug?: string,
  options: TournamentOptions = {}
): Promise<PSTournament[]> {
  return requestPandaScore<PSTournament[]>(tournamentsPath(gameSlug), {
    ...options,
    filter: { status: PS_TOURNAMENT_STATUS.upcoming },
    sort: "begin_at",
    perPage: options.perPage ?? 50,
  });
}

/**
 * Récupère le bracket d'un tournoi.
 * @param tournamentIdOrSlug  ID numérique ou slug PandaScore du tournoi
 *
 * La réponse est stockée telle quelle en rawJson (structure variable selon les jeux).
 * Ref : GET /tournaments/{tournament_id_or_slug}/brackets
 */
export async function getTournamentBrackets(
  tournamentIdOrSlug: string | number
): Promise<PSBracket> {
  return requestPandaScore<PSBracket>(
    `/tournaments/${tournamentIdOrSlug}/brackets`
  );
}

/**
 * Récupère le classement (standings) d'un tournoi.
 * @param tournamentIdOrSlug  ID numérique ou slug PandaScore du tournoi
 *
 * Note : la structure de réponse peut varier selon le jeu
 * (LoL et Valorant retournent des groupes, RL peut retourner un classement simple).
 * Ref : GET /tournaments/{tournament_id_or_slug}/standings
 */
export async function getTournamentStandings(
  tournamentIdOrSlug: string | number
): Promise<PSStandings> {
  return requestPandaScore<PSStandings>(
    `/tournaments/${tournamentIdOrSlug}/standings`
  );
}
