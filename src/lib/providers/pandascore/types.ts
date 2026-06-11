/**
 * Types bruts de l'API PandaScore
 * Représentent les structures JSON retournées par l'API, sans transformation.
 * Ces types peuvent être partiels — seuls les champs utiles au MVP sont typés.
 *
 * Ref : https://developers.pandascore.co/reference
 */

// ─── Jeu / Videogame ──────────────────────────────────────────────────────────

export type PSVideogame = {
  id: number;
  name: string;
  slug: string;
};

// ─── Ligue ────────────────────────────────────────────────────────────────────
// Correspond à Competition dans notre modèle interne (LEC, VCT EMEA, RLCS…)

export type PSLeague = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  url: string | null;
  videogame: PSVideogame;
};

// ─── Série ────────────────────────────────────────────────────────────────────
// Édition d'une ligue (LEC Summer 2026, VCT EMEA Stage 1…)
// Correspond à Tournament dans notre modèle interne

export type PSSerie = {
  id: number;
  name: string;
  full_name: string | null;
  slug: string;
  begin_at: string | null;
  end_at: string | null;
  status: string;
  year: number | null;
  season: string | null;
  league_id: number;
  league: PSLeague;
  videogame: PSVideogame;
};

// ─── Tournoi ──────────────────────────────────────────────────────────────────
// Phase / groupe d'une série (Group Stage, Playoffs…)
// Utilisé pour les brackets

export type PSTournament = {
  id: number;
  name: string;
  slug: string;
  begin_at: string | null;
  end_at: string | null;
  status: string;
  serie_id: number;
  serie: PSSerie;
  league_id: number;
  league: PSLeague;
  videogame: PSVideogame;
  prizepool: string | null;
};

// ─── Équipe ───────────────────────────────────────────────────────────────────

export type PSTeam = {
  id: number;
  name: string;
  slug: string;
  acronym: string | null;
  image_url: string | null;
  location: string | null;
};

// ─── Joueur (pour les jeux individuels) ──────────────────────────────────────

export type PSPlayer = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
};

// ─── Opponent ─────────────────────────────────────────────────────────────────
// Un adversaire dans un match — peut être une équipe ou un joueur

export type PSOpponent =
  | { type: "Team"; opponent: PSTeam }
  | { type: "Player"; opponent: PSPlayer };

// ─── Résultat d'un match ──────────────────────────────────────────────────────

export type PSMatchResult = {
  team_id: number;
  score: number;
};

// ─── Stream ───────────────────────────────────────────────────────────────────

export type PSStream = {
  language: string;
  main: boolean;
  official: boolean;
  raw_url: string;
};

// ─── Match ────────────────────────────────────────────────────────────────────

export type PSMatch = {
  id: number;
  name: string | null;
  slug: string;

  /** Statut : "not_started" | "running" | "finished" | "cancelled" */
  status: string;

  scheduled_at: string | null;
  begin_at: string | null;
  end_at: string | null;

  number_of_games: number;

  videogame: PSVideogame;
  league: PSLeague;
  league_id: number;
  serie: PSSerie;
  serie_id: number;
  tournament: PSTournament;
  tournament_id: number;

  opponents: PSOpponent[];
  results: PSMatchResult[] | null;
  winner: PSTeam | PSPlayer | null;
  winner_id: number | null;
  winner_type: "Team" | "Player" | null;

  streams_list: PSStream[];

  /** Données live si disponibles (peut être null) */
  live: {
    opens_at: string | null;
    supported: boolean;
    url: string | null;
  } | null;
};

// ─── Bracket ─────────────────────────────────────────────────────────────────
// Structure variable selon les jeux et les tournois
// Stocké en rawJson — pas de typage strict pour éviter les faux positifs

export type PSBracket = Record<string, unknown>;

// ─── Standings ────────────────────────────────────────────────────────────────
// Structure variable selon les jeux
// Ref: GET /tournaments/{id}/standings
// Note: la structure exacte peut varier selon le jeu (LoL, Valorant, RL)

export type PSStandingEntry = {
  team: PSTeam;
  rank: number;
  wins: number;
  losses: number;
  draws?: number;
};

export type PSStandings = PSStandingEntry[];

// ─── Pagination ───────────────────────────────────────────────────────────────
// PandaScore inclut le total des pages dans les headers X-Page et X-Total

export type PSPaginatedResponse<T> = {
  data: T[];
  /** Extrait du header X-Total */
  total?: number;
  /** Extrait du header X-Page */
  page?: number;
};
