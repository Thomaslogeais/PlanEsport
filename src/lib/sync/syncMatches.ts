/**
 * Wrappers nommés pour la synchronisation des matchs par jeu.
 * Chaque fonction appelle simplement syncGameMatches avec le bon slug.
 *
 * Pour ajouter un nouveau jeu :
 *  1. Ajouter son slug dans PANDASCORE_GAME_SLUGS (client.ts)
 *  2. Ajouter un wrapper ici
 *  3. L'ajouter dans SYNC_GAMES de la route /api/sync/pandascore
 */

import { syncGameMatches } from "./syncGame";

export { syncGameMatches };
export type { SyncResult, SyncSummary } from "./syncGame";

export async function syncLeagueOfLegendsMatches() {
  return syncGameMatches("league-of-legends");
}

export async function syncValorantMatches() {
  return syncGameMatches("valorant");
}

export async function syncRocketLeagueMatches() {
  return syncGameMatches("rocket-league");
}
