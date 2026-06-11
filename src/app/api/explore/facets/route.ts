/**
 * GET /api/explore/facets
 *
 * Retourne les options de filtres dynamiques depuis PostgreSQL.
 * Les options sont filtrées selon les filtres actifs passés en query params.
 *
 * Query params :
 *   game, competition, team, tournament, status, period, from, to
 *
 * Exemples :
 *   /api/explore/facets
 *   /api/explore/facets?game=league-of-legends
 *   /api/explore/facets?game=league-of-legends&competition=lck
 *   /api/explore/facets?status=not_started&period=this-week
 */

import { NextRequest, NextResponse } from "next/server";
import { getFacets } from "@/lib/db/facets";
import { periodToRange, AVAILABLE_PERIODS } from "@/lib/utils/period";

const STATUS_LABELS: Record<string, string> = {
  not_started: "À venir",
  running: "En cours",
  finished: "Terminé",
  canceled: "Annulé",
};

export async function GET(request: NextRequest) {
  try {
    const sp = new URL(request.url).searchParams;

    const gameSlug       = sp.get("game")        ?? undefined;
    const competitionSlug = sp.get("competition") ?? undefined;
    const teamSlug       = sp.get("team")         ?? undefined;
    const tournamentSlug = sp.get("tournament")   ?? undefined;
    const status         = sp.get("status")       ?? undefined;
    const period         = sp.get("period")       ?? undefined;
    const fromRaw        = sp.get("from")         ?? undefined;
    const toRaw          = sp.get("to")           ?? undefined;

    // Résoudre la plage de dates (period > from/to)
    let from: Date | null = null;
    let to: Date | null = null;

    if (period) {
      const range = periodToRange(period);
      if (range) { from = range.from; to = range.to; }
    } else {
      if (fromRaw) { const d = new Date(fromRaw); if (!isNaN(d.getTime())) from = d; }
      if (toRaw)   { const d = new Date(toRaw);   if (!isNaN(d.getTime())) to = d; }
    }

    const raw = await getFacets({ gameSlug, competitionSlug, teamSlug, tournamentSlug, status, from, to });

    // ── Formater la réponse ──────────────────────────────────────────────────

    const games = raw.games.map((g) => ({
      slug: g.slug,
      name: g.name,
      imageUrl: g.imageUrl,
      count: g._count.matches,
    }));

    const competitions = raw.competitions.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      imageUrl: c.imageUrl,
      game: c.game,
      count: c._count.tournaments, // proxy : nb de tournois
    }));

    const teams = raw.teams.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      imageUrl: t.imageUrl,
      count: t._count.matchTeams,
    }));

    const tournaments = raw.tournaments.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      imageUrl: t.imageUrl,
      competition: t.competition,
      count: t._count.matches,
    }));

    // Construire les statuts avec counts
    const statusCountMap: Record<string, number> = {};
    for (const row of raw.statusGroups) {
      statusCountMap[row.status] = row._count.id;
    }

    const statuses = Object.entries(STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
      count: statusCountMap[value] ?? 0,
    }));

    return NextResponse.json({
      ok: true,
      games,
      competitions,
      teams,
      tournaments,
      statuses,
      periods: AVAILABLE_PERIODS,
    });
  } catch (err) {
    console.error("[GET /api/explore/facets]", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
