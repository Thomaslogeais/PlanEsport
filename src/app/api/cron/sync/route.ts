/**
 * GET /api/cron/sync
 * Route dédiée aux cron jobs — synchronise tous les jeux séquentiellement.
 * ⚠️ Backend uniquement — ne pas appeler depuis le client.
 *
 * Auth acceptée (par ordre de priorité) :
 *   1. Authorization: Bearer <CRON_SECRET>     ← Vercel Cron (prod)
 *   2. x-sync-secret: <SYNC_SECRET>            ← compat sync manuelle
 *   3. ?secret=<SYNC_SECRET>                   ← dev local uniquement (ignoré en prod)
 *
 * Garde-fou anti double-exécution :
 *   Vérifie dans SyncLog si une sync "matches:cron" est en cours depuis < 10 min.
 *   Si oui → 409 Conflict.
 */

import { NextRequest, NextResponse } from "next/server";
import { syncGameMatches, type SyncResult } from "@/lib/sync/syncGame";
import { PANDASCORE_GAME_SLUGS } from "@/lib/providers/pandascore/client";
import { prisma } from "@/lib/db/prisma";

// Désactive le cache Next.js — la route doit toujours s'exécuter
export const dynamic = "force-dynamic";

const SYNC_GAMES = Object.keys(PANDASCORE_GAME_SLUGS) as Array<
  keyof typeof PANDASCORE_GAME_SLUGS
>;

// Délai minimum entre deux cron runs (ms)
const DEBOUNCE_MS = 10 * 60 * 1000; // 10 minutes

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  const isProd = process.env.NODE_ENV === "production";

  // 1. Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && token === cronSecret) return true;
  }

  // 2. x-sync-secret: <SYNC_SECRET>
  const syncHeader = request.headers.get("x-sync-secret");
  const syncSecret = process.env.SYNC_SECRET;
  if (syncSecret && syncHeader === syncSecret) return true;

  // 3. ?secret=... — dev uniquement, ignoré en production
  if (!isProd) {
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");
    if (syncSecret && querySecret === syncSecret) return true;
    if (process.env.CRON_SECRET && querySecret === process.env.CRON_SECRET) return true;
  }

  return false;
}

// ─── Garde-fou double-exécution ───────────────────────────────────────────────

async function isAlreadyRunning(): Promise<boolean> {
  const since = new Date(Date.now() - DEBOUNCE_MS);

  const running = await prisma.syncLog.findFirst({
    where: {
      syncType: "matches:cron",
      status: "running",
      startedAt: { gte: since },
    },
    select: { id: true, startedAt: true },
  });

  return running !== null;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
        hint: "Utilisez Authorization: Bearer <CRON_SECRET> ou x-sync-secret: <SYNC_SECRET>.",
      },
      { status: 401 }
    );
  }

  // ── Garde-fou ─────────────────────────────────────────────────────────────
  if (await isAlreadyRunning()) {
    return NextResponse.json(
      {
        ok: false,
        status: "already_running",
        message: "Une sync cron est déjà en cours (< 10 min). Réessayez plus tard.",
      },
      { status: 409 }
    );
  }

  const startedAt = new Date();

  // ── Créer le SyncLog "running" ────────────────────────────────────────────
  let cronLog: { id: string } | null = null;
  try {
    cronLog = await prisma.syncLog.create({
      data: {
        providerName: "pandascore",
        syncType: "matches:cron",
        status: "running",
        startedAt,
      },
      select: { id: true },
    });
  } catch {
    // Non bloquant — on continue la sync même si le log échoue
  }

  // ── Sync séquentielle ─────────────────────────────────────────────────────
  const results: Record<string, SyncResult | { ok: false; errors: string[] }> = {};
  let globalError: string | null = null;

  try {
    for (const gameSlug of SYNC_GAMES) {
      try {
        results[gameSlug] = await syncGameMatches(gameSlug);
      } catch (err) {
        results[gameSlug] = {
          ok: false,
          errors: [err instanceof Error ? err.message : String(err)],
        };
      }
    }
  } catch (err) {
    globalError = err instanceof Error ? err.message : String(err);
  }

  // ── Calcul du statut global ───────────────────────────────────────────────
  const endedAt = new Date();
  const durationMs = endedAt.getTime() - startedAt.getTime();

  const allOk = !globalError && Object.values(results).every((r) => r.ok);
  const finalStatus = globalError ? "error" : allOk ? "success" : "partial";

  // ── Compteurs agrégés pour le SyncLog global ──────────────────────────────
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const r of Object.values(results)) {
    if (r.ok && "summary" in r) {
      const s = r.summary;
      totalCreated += s.competitions.created + s.tournaments.created +
                      s.teams.created + s.matches.created + s.matchTeams.created;
      totalUpdated += s.competitions.updated + s.tournaments.updated +
                      s.teams.updated + s.matches.updated + s.matchTeams.updated;
    } else if (!r.ok && "errors" in r) {
      totalErrors += r.errors.length;
    }
  }

  // ── Mettre à jour le SyncLog cron ─────────────────────────────────────────
  if (cronLog) {
    try {
      await prisma.syncLog.update({
        where: { id: cronLog.id },
        data: {
          status: finalStatus,
          endedAt,
          message: globalError ?? (totalErrors > 0 ? `${totalErrors} erreur(s)` : null),
          createdCount: totalCreated,
          updatedCount: totalUpdated,
          errorCount: totalErrors,
        },
      });
    } catch {
      // Non bloquant — ne pas masquer l'erreur principale
    }
  }

  // ── Réponse ───────────────────────────────────────────────────────────────
  if (globalError) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        provider: "pandascore",
        source: "cron",
        error: globalError,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMs,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: allOk,
      ...(allOk ? {} : { status: "partial" }),
      provider: "pandascore",
      source: "cron",
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationMs,
      games: results,
    },
    { status: allOk ? 200 : 207 }
  );
}
