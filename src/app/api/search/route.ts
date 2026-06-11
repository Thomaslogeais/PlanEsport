/**
 * GET /api/search?q=
 *
 * Recherche globale dans Team, Competition, Tournament.
 * Résultats groupés par type avec lien de destination.
 *
 * Query params :
 *   q      - terme de recherche (min 2 caractères)
 *   limit  - par type, défaut 5, max 10
 *
 * Exemple :
 *   /api/search?q=karmine
 *   /api/search?q=lec&limit=8
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const sp = new URL(request.url).searchParams;
    const q = sp.get("q")?.trim() ?? "";
    const limitRaw = parseInt(sp.get("limit") ?? "5", 10);
    const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 5 : limitRaw), 10);

    if (q.length < 2) {
      return NextResponse.json({
        ok: true,
        query: q,
        teams: [],
        competitions: [],
        tournaments: [],
      });
    }

    const where = { name: { contains: q, mode: "insensitive" as const } };

    const [teams, competitions, tournaments] = await Promise.all([
      prisma.team.findMany({
        where,
        select: { id: true, slug: true, name: true, imageUrl: true },
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.competition.findMany({
        where,
        select: { id: true, slug: true, name: true, imageUrl: true },
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.tournament.findMany({
        where,
        select: {
          id: true, slug: true, name: true, imageUrl: true,
          competition: { select: { slug: true, name: true } },
        },
        take: limit,
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      query: q,
      teams: teams.map((t) => ({
        type: "team" as const,
        id: t.id, slug: t.slug, name: t.name, imageUrl: t.imageUrl,
        url: `/teams/${t.slug}`,
      })),
      competitions: competitions.map((c) => ({
        type: "competition" as const,
        id: c.id, slug: c.slug, name: c.name, imageUrl: c.imageUrl,
        url: `/competitions/${c.slug}`,
      })),
      tournaments: tournaments.map((t) => ({
        type: "tournament" as const,
        id: t.id, slug: t.slug, name: t.name, imageUrl: t.imageUrl,
        competition: t.competition,
        url: `/tournaments/${t.slug}`,
      })),
    });
  } catch (err) {
    console.error("[GET /api/search]", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
