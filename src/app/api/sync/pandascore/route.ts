/**
 * POST /api/sync/pandascore
 * Déclenche une synchronisation manuelle PandaScore → PostgreSQL
 *
 * Auth (au choix) :
 *   - Header  : x-sync-secret: <SYNC_SECRET>
 *   - Query   : ?secret=<SYNC_SECRET>
 *
 * Paramètres :
 *   ?game=league-of-legends  (seul jeu supporté au MVP)
 *
 * Exemples :
 *   curl -X POST "http://localhost:3000/api/sync/pandascore?game=league-of-legends&secret=dev-secret"
 *   curl -X POST "http://localhost:3000/api/sync/pandascore?game=league-of-legends" \
 *        -H "x-sync-secret: dev-secret"
 */

import { NextRequest, NextResponse } from "next/server";
import { syncLeagueOfLegendsMatches } from "@/lib/sync/syncLoL";

// Jeux supportés dans cette route (MVP = LoL uniquement)
const SUPPORTED_GAMES = ["league-of-legends"] as const;
type SupportedGame = (typeof SUPPORTED_GAMES)[number];

function isSupportedGame(value: string | null): value is SupportedGame {
  return SUPPORTED_GAMES.includes(value as SupportedGame);
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
        supported: SUPPORTED_GAMES,
        example: "/api/sync/pandascore?game=league-of-legends",
      },
      { status: 400 }
    );
  }

  if (!isSupportedGame(game)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Jeu '${game}' non supporté dans cette version.`,
        supported: SUPPORTED_GAMES,
      },
      { status: 400 }
    );
  }

  // ─── Lancement de la sync ─────────────────────────────────────────────────
  try {
    let result;

    if (game === "league-of-legends") {
      result = await syncLeagueOfLegendsMatches();
    }

    return NextResponse.json(result, { status: result?.ok ? 200 : 500 });
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
