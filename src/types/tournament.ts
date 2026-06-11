/**
 * Types internes normalisés pour les tournois
 */

export type TournamentStatus = "not_started" | "ongoing" | "finished";

export type Tournament = {
  id: string;
  providerName: string;
  providerId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  status: TournamentStatus;
  competition: {
    id: string;
    slug: string;
    name: string;
    game: {
      id: string;
      slug: string;
      name: string;
    };
  };
  hasBracket: boolean;
  createdAt: string;
  updatedAt: string;
};
