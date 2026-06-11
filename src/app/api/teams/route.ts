/**
 * GET /api/teams
 *
 * Query params : game, search, limit, offset
 *
 * Exemples :
 *   /api/teams?game=league-of-legends
 *   /api/teams?search=karmine
 *   /api/teams?game=league-of-legends&search=fnatic
 */

import { NextRequest, NextResponse } from "next/server";
import { getTeams } from "@/lib/db/teams";
import { parsePagination } from "@/lib/api/queryParams";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const { pagination, errors } = parsePagination(searchParams);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const gameSlug = searchParams.get("game") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const rawList = await getTeams({
      gameSlug,
      search,
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const teams = rawList.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      imageUrl: t.imageUrl,
      game: t.game,
      matchCount: t._count.matchTeams,
    }));

    return NextResponse.json({
      ok: true,
      count: teams.length,
      limit: pagination.limit,
      offset: pagination.offset,
      teams,
    });
  } catch (err) {
    console.error("[GET /api/teams]", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
