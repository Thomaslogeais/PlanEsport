/**
 * Normalizer — Competition (Ligue PandaScore)
 * Transforme un PSLeague brut en données prêtes pour l'upsert Prisma
 */

import { PANDASCORE_PROVIDER_NAME } from "@/lib/providers/pandascore/client";
import type { PSLeague } from "@/lib/providers/pandascore/types";

export type NormalizedCompetition = {
  providerName: string;
  providerId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  gameId: string; // ID interne Prisma du Game
};

/**
 * Génère un slug robuste depuis un texte
 * Fallback si PandaScore ne fournit pas de slug
 */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Normalise une ligue PandaScore (PSLeague) vers une NormalizedCompetition.
 * @param psLeague  Données brutes PandaScore
 * @param gameId    ID interne Prisma du jeu (Game.id)
 */
export function normalizeCompetition(
  psLeague: PSLeague,
  gameId: string
): NormalizedCompetition {
  // Slug : utilise celui de PandaScore ou génère un fallback
  const slug =
    psLeague.slug?.trim() ||
    toSlug(psLeague.name) ||
    `competition-${psLeague.id}`;

  return {
    providerName: PANDASCORE_PROVIDER_NAME,
    providerId: String(psLeague.id),
    name: psLeague.name,
    slug,
    imageUrl: psLeague.image_url ?? null,
    gameId,
  };
}
