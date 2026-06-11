/**
 * Types internes normalisés pour les compétitions
 */

export type Competition = {
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
    imageUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
};
