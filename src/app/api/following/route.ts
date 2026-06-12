import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

// GET /api/following → liste des suivis de l'utilisateur connecté
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ followings: [] });
  }

  const followings = await prisma.userFollowing.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ followings });
}

// POST /api/following → ajouter un suivi
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { entityType, entityId, entityName, entitySlug, gameSlug } = body;

  if (!entityType || !entityId || !entityName || !entitySlug) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const following = await prisma.userFollowing.upsert({
    where: {
      userId_entityType_entityId: {
        userId: session.user.id,
        entityType,
        entityId,
      },
    },
    update: { entityName, entitySlug, gameSlug },
    create: {
      userId: session.user.id,
      entityType,
      entityId,
      entityName,
      entitySlug,
      gameSlug,
    },
  });

  return NextResponse.json({ following });
}

// DELETE /api/following → supprimer un suivi
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  await prisma.userFollowing.deleteMany({
    where: { userId: session.user.id, entityType, entityId },
  });

  return NextResponse.json({ success: true });
}
