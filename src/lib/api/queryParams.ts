/**
 * Helpers partagés pour parser et valider les query params communs
 * Utilisé par toutes les routes API internes
 */

export type PaginationParams = {
  limit: number;
  offset: number;
};

export type DateRangeParams = {
  from: Date | null;
  to: Date | null;
};

export type QueryParamError = {
  field: string;
  message: string;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Parse et clamp limit + offset depuis une URLSearchParams.
 * - limit  : default 50, max 100
 * - offset : default 0
 */
export function parsePagination(params: URLSearchParams): {
  pagination: PaginationParams;
  errors: QueryParamError[];
} {
  const errors: QueryParamError[] = [];

  // limit
  let limit = DEFAULT_LIMIT;
  const rawLimit = params.get("limit");
  if (rawLimit !== null) {
    const parsed = parseInt(rawLimit, 10);
    if (isNaN(parsed) || parsed < 1) {
      errors.push({ field: "limit", message: "Doit être un entier >= 1" });
    } else {
      limit = Math.min(parsed, MAX_LIMIT);
    }
  }

  // offset
  let offset = 0;
  const rawOffset = params.get("offset");
  if (rawOffset !== null) {
    const parsed = parseInt(rawOffset, 10);
    if (isNaN(parsed) || parsed < 0) {
      errors.push({ field: "offset", message: "Doit être un entier >= 0" });
    } else {
      offset = parsed;
    }
  }

  return { pagination: { limit, offset }, errors };
}

/**
 * Parse les dates `from` et `to` depuis une URLSearchParams.
 * Retourne une erreur si le format est invalide.
 */
export function parseDateRange(params: URLSearchParams): {
  dates: DateRangeParams;
  errors: QueryParamError[];
} {
  const errors: QueryParamError[] = [];

  let from: Date | null = null;
  const rawFrom = params.get("from");
  if (rawFrom) {
    const d = new Date(rawFrom);
    if (isNaN(d.getTime())) {
      errors.push({ field: "from", message: `Date invalide : '${rawFrom}'. Utilisez le format ISO (ex: 2026-06-01)` });
    } else {
      from = d;
    }
  }

  let to: Date | null = null;
  const rawTo = params.get("to");
  if (rawTo) {
    const d = new Date(rawTo);
    if (isNaN(d.getTime())) {
      errors.push({ field: "to", message: `Date invalide : '${rawTo}'. Utilisez le format ISO (ex: 2026-06-30)` });
    } else {
      // Inclure tout le jour "to" → end of day
      d.setUTCHours(23, 59, 59, 999);
      to = d;
    }
  }

  return { dates: { from, to }, errors };
}

/**
 * Parse tous les query params communs en une seule passe.
 * Retourne les erreurs combinées.
 */
export function parseCommonParams(params: URLSearchParams): {
  pagination: PaginationParams;
  dates: DateRangeParams;
  errors: QueryParamError[];
} {
  const { pagination, errors: pErrors } = parsePagination(params);
  const { dates, errors: dErrors } = parseDateRange(params);
  return { pagination, dates, errors: [...pErrors, ...dErrors] };
}
