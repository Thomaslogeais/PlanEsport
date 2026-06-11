/**
 * Synchronisation des tournois/compétitions depuis PandaScore vers la BDD
 * TODO (Étape 2) : implémenter l'upsert complet avec SyncLog
 *
 * Stratégie :
 * 1. Récupérer les leagues via fetchLeagues → upsert Competition
 * 2. Récupérer les series via fetchSeries → upsert Tournament
 * 3. Upsert sur (providerName, providerId)
 * 4. Logger le résultat dans SyncLog
 */

export async function syncTournaments(_gameSlug: string): Promise<void> {
  throw new Error("syncTournaments — à implémenter (Étape 2)");
}
