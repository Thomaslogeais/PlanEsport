/**
 * Normalizer — Tournament (Tournoi/Phase PandaScore)
 * Transforme un PSTournament brut en données prêtes pour l'upsert Prisma
 */

import { PANDASCORE_PROVIDER_NAME } from "@/lib/providers/pandascore/client";
import type { PSTournament } from "@/lib/providers/pandascore/types";

export type NormalizedTournament = {
  providerName: string;
  providerId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  competitionId: string; // ID interne Prisma de la Competition
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  rawJson: PSTournament; // JSON brut conservé pour debug
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

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Normalise un tournoi PandaScore (PSTournament) vers un NormalizedTournament.
 * @param psTournament  Données brutes PandaScore
 * @param competitionId ID interne Prisma de la Competition parent
 */
export function normalizeTournament(
  psTournament: PSTournament,
  competitionId: string
): NormalizedTournament {
  const slug =
    psTournament.slug?.trim() ||
    toSlug(psTournament.name) ||
    `tournament-${psTournament.id}`;

  // Normalisation du statut vers notre convention interne
  const statusMap: Record<string, string> = {
    not_started: "not_started",
    running: "running",
    finished: "finished",
    canceled: "finished",
    cancelled: "finished",
  };
  const status = statusMap[psTournament.status] ?? psTournament.status ?? "not_started";

  return {
    providerName: PANDASCORE_PROVIDER_NAME,
    providerId: String(psTournament.id),
    name: psTournament.name,
    slug,
    imageUrl: null, // PandaScore ne fournit pas d'imageUrl sur les tournois
    competitionId,
    startDate: parseDate(psTournament.begin_at),
    endDate: parseDate(psTournament.end_at),
    status,
    rawJson: psTournament,
  };
}
