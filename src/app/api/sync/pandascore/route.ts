/**
 * POST /api/sync/pandascore
 * Déclenche une synchronisation manuelle PandaScore → PostgreSQL
 *
 * Auth (au choix) :
 *   - Header  : x-sync-secret: <SYNC_SECRET>
 *   - Query   : ?secret=<SYNC_SECRET>
 *
 * Paramètres :
 *   ?game=league-of-legends  → sync LoL uniquement
 *   ?game=valorant           → sync Valorant uniquement
 *   ?game=rocket-league      → sync Rocket League uniquement
 *   ?game=all                → sync séquentielle des 3 jeux
 *
 * Exemples :
 *   curl -X POST "http://localhost:3000/api/sync/pandascore?game=valorant&secret=dev-secret"
 *   curl -X POST "http://localhost:3000/api/sync/pandascore?game=all&secret=dev-secret"
 *   curl -X POST "http://localhost:3000/api/sync/pandascore?game=league-of-legends" \
 *        -H "x-sync-secret: dev-secret"
 */

import { NextRequest, NextResponse } from "next/server";
import { syncGameMatches, type SyncResult } from "@/lib/sync/syncGame";
import { PANDASCORE_GAME_SLUGS } from "@/lib/providers/pandascore/client";

// Jeux disponibles — source unique : PANDASCORE_GAME_SLUGS
const SYNC_GAMES = Object.keys(PANDASCORE_GAME_SLUGS) as Array<
  keyof typeof PANDASCORE_GAME_SLUGS
>;

function isSupportedGame(value: string): value is keyof typeof PANDASCORE_GAME_SLUGS {
  return SYNC_GAMES.includes(value as keyof typeof PANDASCORE_GAME_SLUGS);
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // ─── Auth : header OU query param ────────────────────────────────────────
  const secret =
    request.headers.get("x-sync-secret") ?? searchParams.get("secret");
  const syncSecret = process.env.SYNC_SECRET;

  if (!syncSecret || secret !== syncSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
        hint: "Fournissez le secret via le header 'x-sync-secret' ou le query param 'secret'.",
      },
      { status: 401 }
    );
  }

  // ─── Paramètre game ───────────────────────────────────────────────────────
  const game = searchParams.get("game");

  if (!game) {
    return NextResponse.json(
      {
        ok: false,
        error: "Paramètre 'game' manquant.",
        supported: [...SYNC_GAMES, "all"],
        example: "/api/sync/pandascore?game=league-of-legends",
      },
      { status: 400 }
    );
  }

  // ─── game=all : sync séquentielle de tous les jeux ────────────────────────
  if (game === "all") {
    const results: Record<string, SyncResult | { ok: false; errors: string[] }> = {};

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

    // ok global = true seulement si tous les jeux ont réussi
    const allOk = Object.values(results).every((r) => r.ok);

    return NextResponse.json(
      {
        ok: allOk,
        ...(allOk ? {} : { status: "partial" }),
        provider: "pandascore",
        games: results,
      },
      { status: allOk ? 200 : 207 }
    );
  }

  // ─── game=<slug> : sync d'un jeu spécifique ───────────────────────────────
  if (!isSupportedGame(game)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Jeu '${game}' non supporté.`,
        supported: [...SYNC_GAMES, "all"],
      },
      { status: 400 }
    );
  }

  try {
    const result = await syncGameMatches(game);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        provider: "pandascore",
        game,
        error: message,
        hint: "Vérifiez les logs serveur pour plus de détails.",
      },
      { status: 500 }
    );
  }
}
