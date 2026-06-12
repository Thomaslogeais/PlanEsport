/**
 * syncLoL.ts — Compatibilité backward
 *
 * La logique de synchronisation LoL a été généralisée dans syncGame.ts.
 * Ce fichier réexporte simplement syncLeagueOfLegendsMatches depuis syncMatches.ts
 * pour ne pas casser les imports existants.
 *
 * À terme, importer directement depuis @/lib/sync/syncMatches.
 */

export {
  syncLeagueOfLegendsMatches,
  type SyncResult,
  type SyncSummary,
} from "./syncMatches";
