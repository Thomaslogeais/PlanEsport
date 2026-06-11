/**
 * Provider PandaScore — Matchs
 * ⚠️ Backend uniquement — ne pas importer côté client
 *
 * Endpoints utilisés :
 *   GET /matches                  → tous jeux confondus
 *   GET /{psSlug}/matches         → jeu spécifique
 *   GET /{psSlug}/matches?filter[tournament_id]=...
 *
 * Ref : https://developers.pandascore.co/reference#tag/Matches
 */

import {
  requestPandaScore,
  resolvePandaScoreSlug,
  PS_MATCH_STATUS,
  type PandaScorePaginationParams,
} from "./client";
import type { PSMatch } from "./types";

/** Options communes de pagination */
type MatchOptions = PandaScorePaginationParams;

/**
 * Retourne le préfixe d'endpoint selon le jeu fourni.
 * Sans gameSlug → /matches (tous jeux)
 * Avec gameSlug → /lol/matches, /valorant/matches, /rl/matches
 */
function matchesPath(gameSlug?: string): string {
  if (!gameSlug) return "/matches";
  const psSlug = resolvePandaScoreSlug(gameSlug);
  return `/${psSlug}/matches`;
}

// ─── Fonctions publiques ──────────────────────────────────────────────────────

/**
 * Récupère les matchs à venir (statut "not_started")
 * @param gameSlug  Slug interne du jeu (optionnel — tous jeux si absent)
 */
export async function getUpcomingMatches(
  gameSlug?: string,
  options: MatchOptions = {}
): Promise<PSMatch[]> {
  return requestPandaScore<PSMatch[]>(matchesPath(gameSlug), {
    ...options,
    filter: { status: PS_MATCH_STATUS.upcoming },
    sort: "scheduled_at",
    perPage: options.perPage ?? 50,
  });
}

/**
 * Récupère les matchs en cours (statut "running")
 * @param gameSlug  Slug interne du jeu (optionnel)
 */
export async function getRunningMatches(
  gameSlug?: string,
  options: MatchOptions = {}
): Promise<PSMatch[]> {
  return requestPandaScore<PSMatch[]>(matchesPath(gameSlug), {
    ...options,
    filter: { status: PS_MATCH_STATUS.running },
    sort: "begin_at",
    perPage: options.perPage ?? 50,
  });
}

/**
 * Récupère les matchs récents/passés (statut "finished")
 * @param gameSlug  Slug interne du jeu (optionnel)
 */
export async function getPastMatches(
  gameSlug?: string,
  options: MatchOptions = {}
): Promise<PSMatch[]> {
  return requestPandaScore<PSMatch[]>(matchesPath(gameSlug), {
    ...options,
    filter: { status: PS_MATCH_STATUS.finished },
    sort: "-scheduled_at",
    perPage: options.perPage ?? 50,
  });
}

/**
 * Récupère les matchs d'un tournoi spécifique.
 * @param tournamentIdOrSlug  ID numérique ou slug du tournoi (PandaScore)
 * @param gameSlug            Slug interne du jeu (pour l'endpoint spécialisé)
 *
 * Note : PandaScore supporte filter[tournament_id] sur les endpoints matches.
 * L'ID attendu est celui de PandaScore (Tournament.providerId en BDD).
 */
export async function getMatchesByTournament(
  tournamentIdOrSlug: string | number,
  gameSlug?: string,
  options: MatchOptions = {}
): Promise<PSMatch[]> {
  return requestPandaScore<PSMatch[]>(matchesPath(gameSlug), {
    ...options,
    filter: { tournament_id: String(tournamentIdOrSlug) },
    sort: "scheduled_at",
    perPage: options.perPage ?? 100,
  });
}
