/**
 * Client HTTP PandaScore
 * ⚠️ Réservé au backend uniquement — ne jamais importer depuis un composant client
 *
 * Ref API : https://developers.pandascore.co/reference
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

export const PANDASCORE_BASE_URL = "https://api.pandascore.co";
export const PANDASCORE_PROVIDER_NAME = "pandascore" as const;

// ─── Mapping slug interne → slug PandaScore ───────────────────────────────────
// Les slugs internes (Game.slug en BDD) sont les slugs publics du site.
// Les slugs PandaScore sont spécifiques à ce provider — ils ne doivent jamais
// être stockés en BDD pour garantir l'extensibilité multi-provider.
export const PANDASCORE_GAME_SLUGS = {
  "league-of-legends": "lol",
  "valorant": "valorant",
  "rocket-league": "rl",
} as const;

export type PandaScoreGameSlug = keyof typeof PANDASCORE_GAME_SLUGS;

/**
 * Traduit un slug interne (Game.slug) en slug PandaScore pour les endpoints.
 * @throws Error si le jeu n'est pas supporté par PandaScore
 */
export function resolvePandaScoreSlug(gameSlug: string): string {
  const psSlug = PANDASCORE_GAME_SLUGS[gameSlug as PandaScoreGameSlug];
  if (!psSlug) {
    const supported = Object.keys(PANDASCORE_GAME_SLUGS).join(", ");
    throw new Error(
      `[PandaScore] Jeu non supporté : "${gameSlug}". Slugs supportés : ${supported}`
    );
  }
  return psSlug;
}

// ─── Construction des query params ────────────────────────────────────────────

export type PandaScorePaginationParams = {
  /** Numéro de page (1-based) */
  page?: number;
  /** Nombre d'éléments par page (max 100) */
  perPage?: number;
};

export type PandaScoreQueryParams = PandaScorePaginationParams & {
  /** Tri : "field" (asc) ou "-field" (desc). Ex: "-scheduled_at" */
  sort?: string;
  /** Filtres : clés au format "filter[field]" ou objet décomposé */
  filter?: Record<string, string | number | boolean>;
  /** Ranges : clés au format "range[field]" */
  range?: Record<string, string>;
};

/**
 * Construit un objet URLSearchParams depuis les options de requête PandaScore.
 * PandaScore accepte deux formats de pagination :
 *   - page[number] + page[size]  (format bracket)
 *   - page + per_page            (format flat)
 * On utilise le format bracket qui est le format officiel de la doc.
 */
export function buildQueryParams(
  params: PandaScoreQueryParams
): Record<string, string> {
  const result: Record<string, string> = {};

  if (params.page !== undefined) {
    result["page[number]"] = String(params.page);
  }
  if (params.perPage !== undefined) {
    result["page[size]"] = String(params.perPage);
  }
  if (params.sort !== undefined) {
    result["sort"] = params.sort;
  }
  if (params.filter) {
    for (const [key, value] of Object.entries(params.filter)) {
      // Accepte soit "filter[field]" directement, soit "field" (on wrappe)
      const paramKey = key.startsWith("filter[") ? key : `filter[${key}]`;
      result[paramKey] = String(value);
    }
  }
  if (params.range) {
    for (const [key, value] of Object.entries(params.range)) {
      const paramKey = key.startsWith("range[") ? key : `range[${key}]`;
      result[paramKey] = value;
    }
  }

  return result;
}

// ─── Statuts PandaScore ───────────────────────────────────────────────────────
// Isolés ici pour faciliter les corrections si l'API change.
// Ref: https://developers.pandascore.co/reference#tag/Matches/operation/get_matches

export const PS_MATCH_STATUS = {
  upcoming: "not_started",
  running: "running",
  finished: "finished",
  canceled: "cancelled",
} as const;

export const PS_TOURNAMENT_STATUS = {
  upcoming: "not_started",
  running: "running",
  finished: "finished",
} as const;

// ─── Client HTTP ──────────────────────────────────────────────────────────────

/**
 * Effectue un appel GET vers l'API PandaScore.
 *
 * @param path    Chemin relatif, ex: "/lol/matches" ou "/matches"
 * @param params  Query params optionnels (pagination, filtres, tri)
 *
 * ⚠️ Cette fonction ne doit jamais être importée côté client (components, hooks).
 *    Elle ne doit être appelée que depuis :
 *    - src/lib/providers/pandascore/
 *    - src/app/api/ (routes Next.js server-side)
 */
export async function requestPandaScore<T>(
  path: string,
  params?: PandaScoreQueryParams
): Promise<T> {
  const token = process.env.PANDASCORE_API_TOKEN;

  if (!token) {
    throw new Error(
      "[PandaScore] PANDASCORE_API_TOKEN est absent. " +
        "Renseignez-le dans .env.local et .env avant d'appeler l'API."
    );
  }

  const url = new URL(`${PANDASCORE_BASE_URL}${path}`);

  if (params) {
    const queryParams = buildQueryParams(params);
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    // Désactiver le cache Next.js — la fraîcheur est gérée par notre couche sync
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `[PandaScore] HTTP ${response.status} ${response.statusText} — ${path}` +
        (body ? `\n${body.slice(0, 200)}` : "")
    );
  }

  return response.json() as Promise<T>;
}
