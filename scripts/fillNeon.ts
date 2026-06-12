/**
 * Script one-shot : remplit la base Neon depuis PandaScore.
 * Utilise les variables d'environnement du fichier .env local.
 *
 * Usage :
 *   npx tsx scripts/fillNeon.ts
 *
 * Ce script n'est PAS commité avec des secrets.
 * Il lit DATABASE_URL et PANDASCORE_API_TOKEN depuis .env.
 */

import dotenv from "dotenv";
import { existsSync } from "fs";

// Next.js charge .env puis .env.local (override).
// On reproduit ce comportement ici pour les scripts hors Next.
dotenv.config({ path: ".env" });
if (existsSync(".env.local")) {
  dotenv.config({ path: ".env.local", override: true });
}

import { syncGameMatches } from "@/lib/sync/syncGame";
import { syncBracketsForRecentAndUpcomingTournaments } from "@/lib/sync/syncBrackets";

const GAMES = [
  "league-of-legends",
  "valorant",
  "rocket-league",
] as const;

async function main() {
  console.log("=== MatchPulse — Remplissage initial de Neon ===\n");

  // ── 1. Sync matchs + équipes + tournois par jeu ──────────────────────────
  for (const game of GAMES) {
    console.log(`[${game}] Synchronisation...`);
    try {
      const result = await syncGameMatches(game);
      if (result.ok) {
        console.log(`[${game}] ✓  upserted: ${JSON.stringify(result)}\n`);
      } else {
        console.warn(`[${game}] ⚠  résultat partiel: ${JSON.stringify(result)}\n`);
      }
    } catch (err) {
      console.error(`[${game}] ✗  erreur: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }

  // ── 2. Sync brackets ────────────────────────────────────────────────────
  console.log("[brackets] Synchronisation...");
  try {
    const bracketResult = await syncBracketsForRecentAndUpcomingTournaments();
    console.log(`[brackets] ✓  résultat: ${JSON.stringify(bracketResult)}\n`);
  } catch (err) {
    console.error(`[brackets] ✗  erreur: ${err instanceof Error ? err.message : String(err)}\n`);
  }

  console.log("=== Terminé. La base Neon est prête. ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
