/**
 * Provider PandaScore — Équipes
 * ⚠️ Backend uniquement — ne pas importer côté client
 *
 * Endpoints utilisés :
 *   GET /{psSlug}/teams  → équipes d'un jeu spécifique
 *
 * Ref : https://developers.pandascore.co/reference#tag/Teams
 */

import {
  requestPandaScore,
  resolvePandaScoreSlug,
  type PandaScorePaginationParams,
} from "./client";
import type { PSTeam } from "./types";

/**
 * Récupère les équipes d'un jeu.
 * @param gameSlug  Slug interne du jeu (requis — les équipes sont par jeu)
 * @param options   Pagination optionnelle
 */
export async function getTeamsByGame(
  gameSlug: string,
  options: PandaScorePaginationParams = {}
): Promise<PSTeam[]> {
  const psSlug = resolvePandaScoreSlug(gameSlug);
  return requestPandaScore<PSTeam[]>(`/${psSlug}/teams`, {
    perPage: options.perPage ?? 100,
    page: options.page ?? 1,
    sort: "name",
  });
}
