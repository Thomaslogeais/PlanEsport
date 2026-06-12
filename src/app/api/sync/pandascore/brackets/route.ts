/**
 * POST /api/sync/pandascore/brackets
 * Déclenche la synchronisation manuelle des brackets PandaScore → PostgreSQL.
 * ⚠️ Ne pas appeler depuis le frontend.
 *
 * Auth (même pattern que /api/sync/pandascore) :
 *   - Header : x-sync-secret: <SYNC_SECRET>
 *   - Query  : ?secret=<SYNC_SECRET>  (dev uniquement)
 *
 * Paramètres :
 *   ?limit=25   Nombre de tournois à traiter (défaut: 25, max: 50)
 *
 * Exemple local :
 *   curl -X POST "http://localhost:3000/api/sync/pandascore/brackets?secret=dev_sync_secret_changeme"
 *   curl -X POST "http://localhost:3000/api/sync/pandascore/brackets?secret=dev_sync_secret_changeme&limit=10"
 *
 * TODO future :
 *   - Brancher au cron principal 1x/jour
 *   - Limiter aux tournois actifs/récents uniquement
 */

import { NextRequest, NextResponse } from "next/server";
import { syncBracketsForRecentAndUpcomingTournaments } from "@/lib/sync/syncBrackets";
import { prisma } from "@/lib/db/prisma";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  const syncSecret = process.env.SYNC_SECRET;
  if (!syncSecret) return false;

  const syncHeader = request.headers.get("x-sync-secret");
  if (syncHeader === syncSecret) return true;

  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  if (querySecret === syncSecret) return true;

  return false;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
        hint: "Fournissez le secret via x-sync-secret ou ?secret=... (dev uniquement).",
      },
      { status: 401 }
    );
  }

  // ── Paramètre limit ───────────────────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const rawLimit = searchParams.get("limit");
  const limit = rawLimit ? Math.min(Math.max(1, parseInt(rawLimit, 10) || 25), 50) : 25;

  const startedAt = new Date();

  // ── SyncLog "running" ─────────────────────────────────────────────────────
  let syncLogId: string | null = null;
  try {
    const log = await prisma.syncLog.create({
      data: {
        providerName: "pandascore",
        syncType: "brackets:pandascore",
        status: "running",
        startedAt,
      },
      select: { id: true },
    });
    syncLogId = log.id;
  } catch {
    // Non bloquant — on continue même si le log échoue
  }

  // ── Sync brackets ─────────────────────────────────────────────────────────
  let summary;
  let globalError: string | null = null;

  try {
    summary = await syncBracketsForRecentAndUpcomingTournaments({ limit });
  } catch (err) {
    globalError = err instanceof Error ? err.message : String(err);
  }

  const endedAt = new Date();
  const finalStatus = globalError
    ? "error"
    : summary && summary.errors > 0
    ? "partial"
    : "success";

  // ── Mise à jour SyncLog ───────────────────────────────────────────────────
  if (syncLogId) {
    try {
      await prisma.syncLog.update({
        where: { id: syncLogId },
        data: {
          status: finalStatus,
          endedAt,
          message: globalError
            ?? (summary && summary.errors > 0 ? `${summary.errors} erreur(s)` : null),
          createdCount: summary?.created ?? 0,
          updatedCount: summary?.updated ?? 0,
          errorCount: summary?.errors ?? (globalError ? 1 : 0),
        },
      });
    } catch {
      // Non bloquant
    }
  }

  // ── Réponse erreur globale ────────────────────────────────────────────────
  if (globalError) {
    return NextResponse.json(
      {
        ok: false,
        provider: "pandascore",
        error: globalError,
        hint: "Vérifiez les logs serveur pour plus de détails.",
      },
      { status: 500 }
    );
  }

  // ── Réponse succès / partiel ──────────────────────────────────────────────
  const ok = summary!.errors === 0;

  return NextResponse.json(
    {
      ok,
      ...(ok ? {} : { status: "partial" }),
      provider: "pandascore",
      summary: {
        processed: summary!.processed,
        created: summary!.created,
        updated: summary!.updated,
        empty: summary!.empty,
        errors: summary!.errors,
        ...(summary!.errorDetails.length > 0
          ? { errorDetails: summary!.errorDetails }
          : {}),
      },
    },
    { status: ok ? 200 : 207 }
  );
}
