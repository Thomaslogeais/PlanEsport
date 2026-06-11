/**
 * Synchronisation des matchs depuis PandaScore vers la BDD
 * TODO (Étape 2) : implémenter l'upsert complet avec SyncLog
 *
 * Stratégie :
 * 1. Récupérer les matchs via lib/providers/pandascore/matches.ts
 * 2. Normaliser avec lib/normalizers/match.normalizer.ts
 * 3. Upsert en BDD sur (providerName, providerId)
 * 4. Upsert les MatchTeam associés
 * 5. Logger le résultat dans SyncLog
 */

export async function syncMatches(_gameSlug: string): Promise<void> {
  throw new Error("syncMatches — à implémenter (Étape 2)");
}
