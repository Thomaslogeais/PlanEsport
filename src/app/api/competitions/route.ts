/**
 * GET /api/competitions
 *
 * Query params : game, limit, offset
 *
 * Exemples :
 *   /api/competitions?game=league-of-legends
 *   /api/competitions
 */

import { NextRequest, NextResponse } from "next/server";
import { getCompetitions } from "@/lib/db/competitions";
import { parsePagination } from "@/lib/api/queryParams";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const { pagination, errors } = parsePagination(searchParams);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const gameSlug = searchParams.get("game") ?? undefined;

    const rawList = await getCompetitions({
      gameSlug,
      page: 1,
      limit: pagination.limit,
    });

    const competitions = rawList.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      game: c.game,
    }));

    return NextResponse.json({
      ok: true,
      count: competitions.length,
      limit: pagination.limit,
      offset: pagination.offset,
      competitions,
    });
  } catch (err) {
    console.error("[GET /api/competitions]", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
