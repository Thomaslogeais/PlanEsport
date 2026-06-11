/**
 * GET /api/matches
 *
 * Query params :
 *   game, team, competition, tournament, status, from, to, limit, offset
 *
 * Exemples :
 *   /api/matches?game=league-of-legends
 *   /api/matches?status=not_started
 *   /api/matches?game=league-of-legends&status=not_started
 *   /api/matches?from=2026-06-01&to=2026-06-30
 *   /api/matches?team=karmine-corp
 *   /api/matches?competition=lec
 *   /api/matches?tournament=lec-summer-2026
 */

import { NextRequest, NextResponse } from "next/server";
import { getMatches, countMatches } from "@/lib/db/matches";
import { parseCommonParams } from "@/lib/api/queryParams";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // ─── Validation query params communs ───────────────────────────────────
    const { pagination, dates, errors } = parseCommonParams(searchParams);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    // ─── Filtres métier ────────────────────────────────────────────────────
    const gameSlug = searchParams.get("game") ?? undefined;
    const teamSlug = searchParams.get("team") ?? undefined;
    const competitionSlug = searchParams.get("competition") ?? undefined;
    const tournamentSlug = searchParams.get("tournament") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const filters = {
      gameSlug,
      teamSlug,
      competitionSlug,
      tournamentSlug,
      status,
      from: dates.from,
      to: dates.to,
      limit: pagination.limit,
      offset: pagination.offset,
    };

    // ─── Requête BDD ───────────────────────────────────────────────────────
    const [rawMatches, total] = await Promise.all([
      getMatches(filters),
      countMatches(filters),
    ]);

    // ─── DTO ───────────────────────────────────────────────────────────────
    const matches = rawMatches.map((m) => ({
      id: m.id,
      providerId: m.providerId,
      name: m.name,
      status: m.status,
      scheduledAt: m.scheduledAt?.toISOString() ?? null,
      game: m.game,
      tournament: m.tournament,
      teams: m.teams.map((t) => ({
        id: t.team.id,
        name: t.team.name,
        slug: t.team.slug,
        imageUrl: t.team.imageUrl,
        score: t.score,
        isWinner: t.isWinner,
      })),
    }));

    return NextResponse.json({
      ok: true,
      total,
      count: matches.length,
      limit: pagination.limit,
      offset: pagination.offset,
      matches,
    });
  } catch (err) {
    console.error("[GET /api/matches]", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
