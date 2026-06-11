/**
 * Helper de conversion période → plage de dates UTC
 *
 * Les matchs sont stockés en UTC. Ce helper produit des bornes UTC.
 * TODO: prendre en compte la timezone utilisateur (Europe/Paris, navigateur, profil)
 *       pour éviter que "aujourd'hui" soit décalé pour les utilisateurs non-UTC.
 */

export type Period = "today" | "tomorrow" | "this-week" | "weekend" | "this-month";

export const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui",
  tomorrow: "Demain",
  "this-week": "Cette semaine",
  weekend: "Ce week-end",
  "this-month": "Ce mois-ci",
};

export function periodToRange(period: string): { from: Date; to: Date } | null {
  const now = new Date();

  // Début de journée UTC
  const startOfDay = (d: Date) => {
    const r = new Date(d);
    r.setUTCHours(0, 0, 0, 0);
    return r;
  };

  // Fin de journée UTC
  const endOfDay = (d: Date) => {
    const r = new Date(d);
    r.setUTCHours(23, 59, 59, 999);
    return r;
  };

  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setUTCDate(r.getUTCDate() + n);
    return r;
  };

  switch (period as Period) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };

    case "tomorrow": {
      const tomorrow = addDays(now, 1);
      return { from: startOfDay(tomorrow), to: endOfDay(tomorrow) };
    }

    case "this-week": {
      // Lundi de la semaine courante
      const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon...
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = addDays(now, daysToMonday);
      const sunday = addDays(monday, 6);
      return { from: startOfDay(monday), to: endOfDay(sunday) };
    }

    case "weekend": {
      const dayOfWeek = now.getUTCDay();
      const daysToSaturday = dayOfWeek === 0 ? -1 : 6 - dayOfWeek;
      const saturday = addDays(now, daysToSaturday);
      const sunday = addDays(saturday, 1);
      return { from: startOfDay(saturday), to: endOfDay(sunday) };
    }

    case "this-month": {
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      return { from, to };
    }

    default:
      return null;
  }
}

/** Liste statique des périodes disponibles pour le frontend */
export const AVAILABLE_PERIODS = (Object.keys(PERIOD_LABELS) as Period[]).map((p) => ({
  value: p,
  label: PERIOD_LABELS[p],
}));
