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

// Priorité :
//   1. NEON_DATABASE_URL  (variable dédiée, n'écrase pas DATABASE_URL local)
//   2. DATABASE_URL       (si c'est déjà une URL Neon, on l'utilise directement)
const neonUrl =
  process.env.NEON_DATABASE_URL ||
  (process.env.DATABASE_URL?.includes("neon.tech")
    ? process.env.DATABASE_URL
    : undefined);

if (!neonUrl) {
  console.error(`
❌ Aucune URL Neon trouvée.

   Option 1 — Ajoute dans .env.local :
     NEON_DATABASE_URL=<ta neon url>

   Option 2 — Si DATABASE_URL dans .env.local est déjà l'URL Neon, c'est ok.

   → Récupère l'URL : Vercel dashboard → Settings → Env Vars → DATABASE_URL
     ou : https://console.neon.tech → ton projet → Connection string
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
  const { prisma } = await import("@/lib/db/prisma");

  const GAMES = ["league-of-legends", "valorant", "rocket-league"] as const;

  console.log("\n=== MatchPulse — Remplissage initial de Neon ===\n");

  // ── STEP A : seed des jeux (idempotent) ──────────────────────────────────
  console.log("[seed] Upsert des jeux de base...");
  const MVP_GAMES = [
    {
      slug: "league-of-legends",
      name: "League of Legends",
      imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/League_of_Legends-144x192.jpg",
    },
    {
      slug: "valorant",
      name: "Valorant",
      imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/Valorant-144x192.jpg",
    },
    {
      slug: "rocket-league",
      name: "Rocket League",
      imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/Rocket_League-144x192.jpg",
    },
  ];
  for (const g of MVP_GAMES) {
    await prisma.game.upsert({
      where: { slug: g.slug },
      update: { name: g.name, imageUrl: g.imageUrl },
      create: g,
    });
    console.log(`  ✓ ${g.name}`);
  }
  console.log("[seed] ✓ Jeux OK\n");

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
