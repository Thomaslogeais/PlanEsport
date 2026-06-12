/**
 * Script one-shot : remplit la base Neon depuis PandaScore.
 *
 * Usage :
 *   npx tsx scripts/fillNeon.ts
 *
 * Stratégie env vars :
 *   1. .env.local → PANDASCORE_API_TOKEN + autres secrets
 *   2. DATABASE_URL écrasé depuis .env (Neon) via fs, AVANT tout import Prisma
 */

import dotenv from "dotenv";
import { existsSync } from "fs";

// ─── STEP 1 : forçage synchrone de DATABASE_URL → Neon ────────────────────
//
// Comment trouver ta Neon URL ?
//   Option A : Neon dashboard → https://console.neon.tech → ton projet → "Connection string"
//   Option B : Vercel dashboard → Settings → Environment Variables → DATABASE_URL
//
// Ajoute ensuite dans .env.local (une seule fois) :
//   NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require
//
// Le script lit NEON_DATABASE_URL (ignoré par Next.js) → pas d'impact sur le dev local.

if (existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}

const neonUrl = process.env.NEON_DATABASE_URL;

if (!neonUrl) {
  console.error(`
❌ NEON_DATABASE_URL n'est pas défini.

   Ajoute cette ligne dans .env.local :
   NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require

   → Récupère l'URL dans : https://console.neon.tech
     ou : Vercel dashboard → Settings → Environment Variables → DATABASE_URL
  `);
  process.exit(1);
}

// Force DATABASE_URL pour que Prisma utilise Neon
process.env.DATABASE_URL = neonUrl;
console.log(`DATABASE_URL → Neon : ${neonUrl.substring(0, 55)}...`);

// ─── STEP 2 : imports dynamiques (Prisma lit DATABASE_URL ici) ─────────────

async function main() {
  // Les modules sync importés ici voient le DATABASE_URL déjà forcé
  const { syncGameMatches } = await import("@/lib/sync/syncGame");
  const { syncBracketsForRecentAndUpcomingTournaments } = await import(
    "@/lib/sync/syncBrackets"
  );

  const GAMES = ["league-of-legends", "valorant", "rocket-league"] as const;

  console.log("\n=== MatchPulse — Remplissage initial de Neon ===\n");

  // Sync matchs + équipes + tournois
  for (const game of GAMES) {
    console.log(`[${game}] Synchronisation...`);
    try {
      const result = await syncGameMatches(game);
      if (result.ok) {
        const s = result.summary;
        console.log(
          `[${game}] ✓  comps:${s.competitions.created}c/${s.competitions.updated}u` +
          `  teams:${s.teams.created}c/${s.teams.updated}u` +
          `  matches:${s.matches.created}c/${s.matches.updated}u\n`
        );
      } else {
        console.warn(`[${game}] ⚠  erreurs: ${JSON.stringify(result.errors)}\n`);
      }
    } catch (err) {
      console.error(`[${game}] ✗  ${err instanceof Error ? err.message : err}\n`);
    }
  }

  // Sync brackets
  console.log("[brackets] Synchronisation...");
  try {
    const br = await syncBracketsForRecentAndUpcomingTournaments();
    console.log(
      `[brackets] ✓  processed:${br.processed} created:${br.created}` +
      ` updated:${br.updated} errors:${br.errors}\n`
    );
  } catch (err) {
    console.error(`[brackets] ✗  ${err instanceof Error ? err.message : err}\n`);
  }

  console.log("=== Terminé. La base Neon est prête. ===");
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
