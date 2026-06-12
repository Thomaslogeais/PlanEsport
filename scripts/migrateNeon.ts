/**
 * Script de migration Neon : applique le schéma Prisma sur la base Neon.
 * Usage : npx tsx scripts/migrateNeon.ts
 *
 * Prérequis : NEON_DATABASE_URL rempli dans .env.local
 */

import dotenv from "dotenv";
import { existsSync } from "fs";
import { execSync } from "child_process";

if (existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}

const neonUrl =
  process.env.NEON_DATABASE_URL ||
  (process.env.DATABASE_URL?.includes("neon.tech") ? process.env.DATABASE_URL : undefined);

if (!neonUrl) {
  console.error("❌ NEON_DATABASE_URL introuvable dans .env.local");
  process.exit(1);
}

process.env.DATABASE_URL = neonUrl;
console.log(`🔗 Connexion Neon : ${neonUrl.substring(0, 50)}...`);
console.log("📦 Lancement de prisma db push...\n");

try {
  execSync("npx prisma db push --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: neonUrl },
  });
  console.log("\n✅ Migration Neon terminée !");
  console.log("💡 Lance ensuite : npx prisma generate");
} catch (err) {
  console.error("❌ Erreur migration :", err);
  process.exit(1);
}
