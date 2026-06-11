/**
 * GET /api/matches/[id]
 * Retourne le détail complet d'un match.
 * rawJson inclus uniquement hors production.
 */

import { NextRequest, NextResponse } from "next/server";
import { getMatchById } from "@/lib/db/matches";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Paramètre 'id' manquant" },
        { status: 400 }
      );
    }

    const raw = await getMatchById(id);

    if (!raw) {
      return NextResponse.json(
        { ok: false, error: `Match introuvable : ${id}` },
        { status: 404 }
      );
    }

    // ─── DTO ─────────────────────────────────────────────────────────────
    const match = {
      id: raw.id,
      providerId: raw.providerId,
      providerName: raw.providerName,
      name: raw.name,
      status: raw.status,
      scheduledAt: raw.scheduledAt?.toISOString() ?? null,
      results: raw.results ?? null,
      streams: raw.streams ?? null,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
      game: raw.game,
      tournament: {
        ...raw.tournament,
        startDate: raw.tournament.startDate?.toISOString() ?? null,
        endDate: raw.tournament.endDate?.toISOString() ?? null,
      },
      teams: raw.teams.map((t) => ({
        id: t.team.id,
        name: t.team.name,
        slug: t.team.slug,
        imageUrl: t.team.imageUrl,
        score: t.score,
        isWinner: t.isWinner,
      })),
      // rawJson présent uniquement si la propriété existe (dev uniquement)
      ...("rawJson" in raw && { rawJson: raw.rawJson }),
    };

    return NextResponse.json({ ok: true, match });
  } catch (err) {
    console.error("[GET /api/matches/[id]]", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
