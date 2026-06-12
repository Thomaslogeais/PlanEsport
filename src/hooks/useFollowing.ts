"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

/**
 * Hook de gestion des suivis utilisateur.
 *
 * - Non connecté : localStorage uniquement (rétrocompat)
 * - Connecté     : API /api/following (BDD Neon)
 */

export type FollowableEntity = {
  type: "team" | "competition" | "game" | "tournament";
  id: string;
  name: string;
  slug: string;
  gameSlug?: string;
};

const STORAGE_KEY = "planesport:following";

function loadFromStorage(): FollowableEntity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FollowableEntity[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: FollowableEntity[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useFollowing() {
  const { data: session, status } = useSession();
  const isAuth = status === "authenticated";

  const [following, setFollowing] = useState<FollowableEntity[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Chargement initial
  useEffect(() => {
    if (status === "loading") return;

    if (isAuth) {
      // Charger depuis la BDD
      fetch("/api/following")
        .then((r) => r.json())
        .then((data) => {
          const items: FollowableEntity[] = (data.followings ?? []).map(
            (f: { entityType: string; entityId: string; entityName: string; entitySlug: string; gameSlug?: string }) => ({
              type: f.entityType as FollowableEntity["type"],
              id: f.entityId,
              name: f.entityName,
              slug: f.entitySlug,
              gameSlug: f.gameSlug ?? undefined,
            })
          );
          setFollowing(items);
          setIsHydrated(true);
        })
        .catch(() => setIsHydrated(true));
    } else {
      // Charger depuis localStorage
      setFollowing(loadFromStorage());
      setIsHydrated(true);
    }
  }, [status, isAuth]);

  const isFollowing = useCallback(
    (type: FollowableEntity["type"], id: string): boolean =>
      following.some((f) => f.type === type && f.id === id),
    [following]
  );

  const follow = useCallback(
    (entity: FollowableEntity): void => {
      const exists = following.some((f) => f.type === entity.type && f.id === entity.id);
      if (exists) return;

      const next = [...following, entity];
      setFollowing(next);

      if (isAuth) {
        fetch("/api/following", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: entity.type,
            entityId: entity.id,
            entityName: entity.name,
            entitySlug: entity.slug,
            gameSlug: entity.gameSlug,
          }),
        }).catch(console.error);
      } else {
        saveToStorage(next);
      }
    },
    [following, isAuth]
  );

  const unfollow = useCallback(
    (type: FollowableEntity["type"], id: string): void => {
      const next = following.filter((f) => !(f.type === type && f.id === id));
      setFollowing(next);

      if (isAuth) {
        fetch(`/api/following?entityType=${type}&entityId=${encodeURIComponent(id)}`, {
          method: "DELETE",
        }).catch(console.error);
      } else {
        saveToStorage(next);
      }
    },
    [following, isAuth]
  );

  const toggle = useCallback(
    (entity: FollowableEntity): void => {
      if (isFollowing(entity.type, entity.id)) {
        unfollow(entity.type, entity.id);
      } else {
        follow(entity);
      }
    },
    [isFollowing, follow, unfollow]
  );

  return {
    following,
    followedTeams: following.filter((f) => f.type === "team"),
    followedCompetitions: following.filter((f) => f.type === "competition"),
    isFollowing,
    follow,
    unfollow,
    toggle,
    isHydrated,
    isAuth,
    session,
  };
}
