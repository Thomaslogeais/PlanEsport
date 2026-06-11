import { prisma } from "./prisma";

/**
 * Requêtes BDD pour les logs de synchronisation
 */

export type CreateSyncLogInput = {
  providerName: string;
  syncType: string;
  status: string;
  startedAt: Date;
  endedAt?: Date;
  message?: string;
  createdCount?: number;
  updatedCount?: number;
  errorCount?: number;
};

export async function createSyncLog(data: CreateSyncLogInput) {
  return prisma.syncLog.create({ data });
}

export async function updateSyncLog(
  id: string,
  data: Partial<Omit<CreateSyncLogInput, "providerName" | "syncType" | "startedAt">>
) {
  return prisma.syncLog.update({ where: { id }, data });
}

export async function getRecentSyncLogs(limit = 20) {
  return prisma.syncLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
