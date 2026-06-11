/**
 * GET /api/tournaments/[slug]
 * Détail d'un tournoi avec ses matchs.
 * Bracket inclus si présent en base.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTournamentBySlug } from "@/lib/db/tournaments";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const raw = await getTournamentBySlug(slug);

    if (!raw) {
      return NextResponse.json(
        { ok: false, error: `Tournoi introuvable : ${slug}` },
        { status: 404 }
      );
    }

    const tournament = {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      status: raw.status,
      imageUrl: raw.imageUrl,
      startDate: raw.startDate?.toISOString() ?? null,
      endDate: raw.endDate?.toISOString() ?? null,
      competition: {
        id: raw.competition.id,
        slug: raw.competition.slug,
        name: raw.competition.name,
        imageUrl: raw.competition.imageUrl,
        game: raw.competition.game,
      },
      bracket: raw.bracket ?? null,
      matches: raw.matches.map((m) => ({
        id: m.id,
        providerId: m.providerId,
        name: m.name,
        status: m.status,
        scheduledAt: m.scheduledAt?.toISOString() ?? null,
        teams: m.teams.map((t) => ({
          id: t.team.id,
          name: t.team.name,
          slug: t.team.slug,
          imageUrl: t.team.imageUrl,
          score: t.score,
          isWinner: t.isWinner,
        })),
      })),
    };

    return NextResponse.json({ ok: true, tournament });
  } catch (err) {
    console.error("[GET /api/tournaments/[slug]]", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
