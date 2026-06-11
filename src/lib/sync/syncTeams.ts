/**
 * Synchronisation des équipes depuis PandaScore vers la BDD
 * TODO (Étape 2) : implémenter l'upsert complet avec SyncLog
 *
 * Stratégie :
 * 1. Récupérer les équipes via fetchTeams
 * 2. Normaliser avec team.normalizer.ts
 * 3. Upsert sur (providerName, providerId)
 * 4. Logger le résultat dans SyncLog
 */

export async function syncTeams(_gameSlug: string): Promise<void> {
  throw new Error("syncTeams — à implémenter (Étape 2)");
}
