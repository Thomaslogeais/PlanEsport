/**
 * Normalizer — Team (Équipe PandaScore)
 * Transforme un PSTeam brut en données prêtes pour l'upsert Prisma
 */

import { PANDASCORE_PROVIDER_NAME } from "@/lib/providers/pandascore/client";
import type { PSTeam } from "@/lib/providers/pandascore/types";

export type NormalizedTeam = {
  providerName: string;
  providerId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  gameId: string; // ID interne Prisma du Game
};

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
 * Normalise une équipe PandaScore (PSTeam) vers une NormalizedTeam.
 * @param psTeam  Données brutes PandaScore
 * @param gameId  ID interne Prisma du jeu (Game.id)
 */
export function normalizeTeam(
  psTeam: PSTeam,
  gameId: string
): NormalizedTeam {
  // Slug : PandaScore ou fallback depuis le nom ou l'id
  const slug =
    psTeam.slug?.trim() ||
    toSlug(psTeam.name) ||
    `team-${psTeam.id}`;

  return {
    providerName: PANDASCORE_PROVIDER_NAME,
    providerId: String(psTeam.id),
    name: psTeam.name,
    slug,
    imageUrl: psTeam.image_url ?? null,
    gameId,
  };
}
