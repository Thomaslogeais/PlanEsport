/**
 * Types internes normalisés pour les équipes
 */

export type Team = {
  id: string;
  providerName: string;
  providerId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  game: {
    id: string;
    slug: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};
