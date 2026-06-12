/**
 * GET /api/tournaments/[slug]/bracket
 * Retourne le bracket d'un tournoi identifié par son slug.
 *
 * Comportement :
 *   - 404 si le tournoi est introuvable
 *   - { ok: true, bracket: null }  si tournoi trouvé mais aucun bracket
 *   - { ok: true, bracket: {...} } si bracket présent
 *
 * Sécurité :
 *   - rawJson complet uniquement avec ?debug=1 en développement
 *   - En production, retourne une version résumée (sans rawJson)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const isDev = process.env.NODE_ENV !== "production";
    const { searchParams } = new URL(request.url);
    const debug = isDev && searchParams.get("debug") === "1";

    // ── Tournoi ──────────────────────────────────────────────────────────────
    const tournament = await prisma.tournament.findFirst({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        bracket: {
          select: {
            id: true,
            providerName: true,
            providerId: true,
            createdAt: true,
            updatedAt: true,
            rawJson: debug, // rawJson uniquement en mode debug dev
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { ok: false, error: `Tournoi introuvable : ${slug}` },
        { status: 404 }
      );
    }

    // ── Pas de bracket ────────────────────────────────────────────────────────
    if (!tournament.bracket) {
      return NextResponse.json({ ok: true, bracket: null });
    }

    // ── Bracket trouvé ────────────────────────────────────────────────────────
    const { bracket } = tournament;

    // Version résumée (prod) : infos meta uniquement
    const bracketResponse = {
      id: bracket.id,
      providerName: bracket.providerName,
      providerId: bracket.providerId,
      updatedAt: bracket.updatedAt.toISOString(),
      // rawJson exposé uniquement en dev avec ?debug=1
      ...(debug && bracket.rawJson ? { rawJson: bracket.rawJson } : {}),
    };

    return NextResponse.json({ ok: true, bracket: bracketResponse });
  } catch (err) {
    console.error("[GET /api/tournaments/[slug]/bracket]", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
