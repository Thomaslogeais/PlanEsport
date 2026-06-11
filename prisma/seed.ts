/**
 * Seed Prisma — PlanE
 * Crée les jeux du MVP via upsert (idempotent)
 * Commande : npm run db:seed  (ou  npx prisma db seed)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Images officielles via Twitch Box Art CDN (public, sans authentification)
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
] as const;

async function main() {
  console.log("🌱 Démarrage du seed PlanE...\n");

  for (const game of MVP_GAMES) {
    const result = await prisma.game.upsert({
      where: { slug: game.slug },
      update: { name: game.name, imageUrl: game.imageUrl },
      create: {
        slug: game.slug,
        name: game.name,
        imageUrl: game.imageUrl,
      },
    });

    console.log(`  ✓ Jeu upserted : ${result.name} (id: ${result.id}, slug: ${result.slug})`);
  }

  console.log("\n✅ Seed terminé — 3 jeux présents en base.");
}

main()
  .catch((error) => {
    console.error("❌ Erreur pendant le seed :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
