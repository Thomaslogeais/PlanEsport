/**
 * Route de debug PandaScore — développement uniquement
 * ⚠️ Retourne 403 en production
 *
 * Usage :
 *   GET /api/debug/pandascore
 *   GET /api/debug/pandascore?game=league-of-legends
 *   GET /api/debug/pandascore?game=valorant
 *   GET /api/debug/pandascore?game=rocket-league
 *
 * Objectif : vérifier que le token PandaScore fonctionne et que l'API répond,
 * sans écrire en base de données.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUpcomingMatches } from "@/lib/providers/pandascore/matches";
import type { PSMatch } from "@/lib/providers/pandascore/types";

/** Extrait un sous-ensemble réduit d'un match pour la réponse debug */
function reduceMatch(match: PSMatch) {
  return {
    id: match.id,
    name: match.name,
    status: match.status,
    scheduled_at: match.scheduled_at,
    begin_at: match.begin_at,
    videogame: match.videogame
      ? { id: match.videogame.id, name: match.videogame.name, slug: match.videogame.slug }
      : null,
    league: match.league
      ? { id: match.league.id, name: match.league.name, slug: match.league.slug }
      : null,
    tournament: match.tournament
      ? { id: match.tournament.id, name: match.tournament.name, slug: match.tournament.slug }
      : null,
    opponents: match.opponents?.map((o) => ({
      type: o.type,
      name: o.opponent.name,
      slug: o.opponent.slug,
    })) ?? [],
  };
}

export async function GET(request: NextRequest) {
  // ─── Bloquer en production ────────────────────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Cette route de debug n'est pas disponible en production." },
      { status: 403 }
    );
  }

  // ─── Paramètre ?game= optionnel ───────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get("game") ?? undefined;

  // ─── Appel PandaScore ─────────────────────────────────────────────────────
  try {
    const matches = await getUpcomingMatches(gameSlug, { perPage: 5, page: 1 });

    return NextResponse.json({
      ok: true,
      debug: true,
      game: gameSlug ?? "all",
      count: matches.length,
      note: "Token PandaScore fonctionnel. Aucune écriture en base effectuée.",
      matches: matches.map(reduceMatch),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Ne jamais exposer le token dans la réponse
    const safeMessage = message.replace(
      /Bearer\s+[^\s"]+/gi,
      "Bearer [REDACTED]"
    );

    return NextResponse.json(
      {
        ok: false,
        debug: true,
        game: gameSlug ?? "all",
        error: safeMessage,
        hint:
          "Vérifiez que PANDASCORE_API_TOKEN est bien renseigné dans .env.local",
      },
      { status: 500 }
    );
  }
}
