import { NextResponse } from "next/server";

/**
 * GET /api/agenda
 * Retourne les matchs filtrés selon les équipes/compétitions suivies
 * Query params: teams (csv), competitions (csv), page, limit
 *
 * TODO (Étape 7) : implémenter la logique de filtrage de l'agenda
 */
export async function GET() {
  return NextResponse.json(
    { message: "Route /api/agenda — à implémenter (Étape 7)" },
    { status: 501 }
  );
}
