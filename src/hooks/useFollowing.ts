"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook de gestion des suivis utilisateur (localStorage MVP)
 * Stocke les équipes et compétitions suivies localement
 *
 * TODO (Étape auth) : remplacer par un appel API avec User + FollowPreference en BDD
 */

export type FollowableEntity = {
  type: "team" | "competition" | "game" | "tournament";
  id: string;
  name: string;
  slug: string;
  gameSlug?: string;
};

const STORAGE_KEY = "matchpulse:following";

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
  const [following, setFollowing] = useState<FollowableEntity[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setFollowing(loadFromStorage());
    setIsHydrated(true);
  }, []);

  const isFollowing = useCallback(
    (type: FollowableEntity["type"], id: string): boolean => {
      return following.some((f) => f.type === type && f.id === id);
    },
    [following]
  );

  const follow = useCallback((entity: FollowableEntity): void => {
    setFollowing((prev) => {
      const exists = prev.some((f) => f.type === entity.type && f.id === entity.id);
      if (exists) return prev;
      const next = [...prev, entity];
      saveToStorage(next);
      return next;
    });
  }, []);

  const unfollow = useCallback(
    (type: FollowableEntity["type"], id: string): void => {
      setFollowing((prev) => {
        const next = prev.filter((f) => !(f.type === type && f.id === id));
        saveToStorage(next);
        return next;
      });
    },
    []
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

  const followedTeams = following.filter((f) => f.type === "team");
  const followedCompetitions = following.filter((f) => f.type === "competition");

  return {
    following,
    followedTeams,
    followedCompetitions,
    isFollowing,
    follow,
    unfollow,
    toggle,
    isHydrated,
  };
}
