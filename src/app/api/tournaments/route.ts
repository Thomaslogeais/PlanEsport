/**
 * GET /api/tournaments
 *
 * Query params : game, competition, status, from, to, limit, offset
 *
 * Exemples :
 *   /api/tournaments?game=league-of-legends
 *   /api/tournaments?competition=lec
 *   /api/tournaments?status=running
 *   /api/tournaments?from=2026-01-01&to=2026-12-31
 */

import { NextRequest, NextResponse } from "next/server";
import { getTournaments } from "@/lib/db/tournaments";
import { parseCommonParams } from "@/lib/api/queryParams";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const { pagination, errors } = parseCommonParams(searchParams);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const gameSlug = searchParams.get("game") ?? undefined;
    const competitionId = searchParams.get("competition") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const rawList = await getTournaments({
      gameSlug,
      competitionId,
      status,
      page: 1,
      limit: pagination.limit,
    });

    const tournaments = rawList.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      imageUrl: t.imageUrl,
      startDate: t.startDate?.toISOString() ?? null,
      endDate: t.endDate?.toISOString() ?? null,
      competition: {
        id: t.competition.id,
        slug: t.competition.slug,
        name: t.competition.name,
        imageUrl: t.competition.imageUrl,
        game: t.competition.game,
      },
    }));

    return NextResponse.json({
      ok: true,
      count: tournaments.length,
      limit: pagination.limit,
      offset: pagination.offset,
      tournaments,
    });
  } catch (err) {
    console.error("[GET /api/tournaments]", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
