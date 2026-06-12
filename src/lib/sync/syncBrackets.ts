/**
 * Synchronisation des brackets PandaScore → PostgreSQL
 * ⚠️ Backend uniquement — ne pas importer côté client
 *
 * Flux :
 *  1. Récupère les tournois actifs/récents depuis la BDD
 *  2. Pour chaque tournoi : appelle getTournamentBrackets(tournament.providerId)
 *  3. Upsert dans la table Bracket
 *
 * Nota bene sur Bracket.providerId :
 *   On utilise String(tournament.providerId) comme providerId du bracket.
 *   PandaScore ne fournit pas d'identifiant de bracket indépendant pour le MVP.
 *   Si PandaScore fournit plus tard un vrai identifiant de bracket, on pourra
 *   remplacer cette logique. Pour l'instant, tournamentId est unique → cohérent.
 *
 * TODO future :
 *   - Synchroniser les brackets 1x/jour via le cron principal
 *   - Synchroniser uniquement les tournois actifs/récents
 */

import { prisma } from "@/lib/db/prisma";
import { getTournamentBrackets } from "@/lib/providers/pandascore/tournaments";
import { PANDASCORE_PROVIDER_NAME } from "@/lib/providers/pandascore/client";
import type { Prisma } from "@prisma/client";

// ─── Types exportés ───────────────────────────────────────────────────────────

export type BracketSyncOutcome = "created" | "updated" | "empty" | "error";

export type BracketSyncSummary = {
  processed: number;
  created: number;
  updated: number;
  empty: number;
  errors: number;
  errorDetails: string[];
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 25;

/** Fenêtre de sélection des tournois "récents" (en jours) */
const RECENT_WINDOW_DAYS = 30;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Vérifie si une valeur est un objet JSON non-vide exploitable.
 * PandaScore peut retourner null, [], {}, ou un vrai bracket.
 */
function isMeaningfulBracket(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return false;
}

// ─── Sync d'un tournoi ────────────────────────────────────────────────────────

/**
 * Synchronise le bracket d'un tournoi donné.
 *
 * @param tournament  Objet tournoi avec { id, providerId, slug }
 * @returns Outcome de l'opération
 */
export async function syncTournamentBracket(tournament: {
  id: string;
  providerId: string;
  slug: string;
}): Promise<BracketSyncOutcome> {
  let rawData: unknown;

  // ── Appel API PandaScore ──────────────────────────────────────────────────
  try {
    rawData = await getTournamentBrackets(tournament.providerId);
  } catch (err) {
    // Erreurs non-bloquantes : 404, tournoi sans bracket, etc.
    const msg = err instanceof Error ? err.message : String(err);
    const isNotFound = msg.includes("404") || msg.includes("not found") || msg.includes("Not Found");
    if (isNotFound) return "empty";
    throw err; // Erreur réseau/auth → laisser remonter
  }

  // ── Bracket vide / absent ─────────────────────────────────────────────────
  if (!isMeaningfulBracket(rawData)) {
    return "empty";
  }

  // ── Upsert Bracket ─────────────────────────────────────────────────────────
  const providerName = PANDASCORE_PROVIDER_NAME;
  const providerId = tournament.providerId; // String(psId) — 1 bracket par tournoi

  const where = {
    providerName_providerId: { providerName, providerId },
  };

  const existing = await prisma.bracket.findUnique({
    where,
    select: { id: true },
  });

  await prisma.bracket.upsert({
    where,
    create: {
      providerName,
      providerId,
      tournamentId: tournament.id,
      rawJson: rawData as Prisma.InputJsonValue,
    },
    update: {
      rawJson: rawData as Prisma.InputJsonValue,
    },
  });

  return existing ? "updated" : "created";
}

// ─── Sync batch ───────────────────────────────────────────────────────────────

/**
 * Synchronise les brackets pour les tournois actifs, à venir et récents.
 *
 * @param opts.limit  Nombre maximum de tournois à traiter (défaut: 25, max: 50)
 * @returns BracketSyncSummary avec les compteurs et erreurs non-bloquantes
 */
export async function syncBracketsForRecentAndUpcomingTournaments(opts: {
  limit?: number;
} = {}): Promise<BracketSyncSummary> {
  const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const summary: BracketSyncSummary = {
    processed: 0,
    created: 0,
    updated: 0,
    empty: 0,
    errors: 0,
    errorDetails: [],
  };

  // ── Sélection des tournois ────────────────────────────────────────────────
  // Priorité :
  //   1. Tournois en cours (ongoing)
  //   2. Tournois à venir (not_started)
  //   3. Tournois terminés récemment (finished, endDate > now - 30j)
  //
  // Robustesse : certains champs peuvent être null (startDate/endDate)
  const recentWindow = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const tournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { status: "ongoing" },
        { status: "not_started" },
        {
          status: "finished",
          endDate: { gte: recentWindow },
        },
        // Fallback : pas de endDate mais startDate récente
        {
          status: "finished",
          endDate: null,
          startDate: { gte: recentWindow },
        },
      ],
    },
    select: {
      id: true,
      providerId: true,
      slug: true,
      status: true,
    },
    orderBy: [
      // Priorité : ongoing d'abord, puis not_started, puis finished
      { status: "asc" },
      { startDate: "desc" },
    ],
    take: limit,
  });

  summary.processed = tournaments.length;

  // ── Traitement séquentiel ────────────────────────────────────────────────
  for (const t of tournaments) {
    try {
      const outcome = await syncTournamentBracket(t);

      switch (outcome) {
        case "created": summary.created++; break;
        case "updated": summary.updated++; break;
        case "empty":   summary.empty++;   break;
      }
    } catch (err) {
      summary.errors++;
      summary.errorDetails.push(
        `[${t.slug}] ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return summary;
}
