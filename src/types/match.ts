/**
 * Types internes normalisés pour les matchs
 * Ces types représentent les données telles qu'elles sont stockées en BDD
 * et retournées par les routes API internes
 */

export type MatchStatus = "not_started" | "running" | "finished" | "canceled";

export type MatchTeamEntry = {
  teamId: string;
  teamName: string;
  teamSlug: string;
  teamImageUrl: string | null;
  isWinner: boolean;
  score: number | null;
};

export type Match = {
  id: string;
  providerName: string;
  providerId: string;
  name: string | null;
  scheduledAt: string | null; // ISO string pour la sérialisation JSON
  status: MatchStatus;
  game: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string | null;
  };
  tournament: {
    id: string;
    slug: string;
    name: string;
    competition: {
      id: string;
      slug: string;
      name: string;
    };
  };
  teams: MatchTeamEntry[];
  createdAt: string;
  updatedAt: string;
};
