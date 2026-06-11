"use client";

/**
 * Bouton "Suivre / Suivi" — localStorage uniquement, pas d'auth.
 *
 * TODO: À terme, ajouter un modèle Organization pour distinguer
 *   - Organization : Karmine Corp, Vitality, Gentle Mates
 *   - Team : KC LoL, KC Valorant, KC Blue…
 * Pour l'instant le suivi s'effectue par Team (slug individuel).
 */

import { Star, Check } from "lucide-react";
import { useFollowing } from "@/hooks/useFollowing";

type FollowType = "team" | "competition" | "game" | "tournament";

type Props = {
  type: FollowType;
  id: string;
  slug: string;
  name: string;
  size?: "sm" | "md";
};

export default function FollowButton({ type, id, slug, name, size = "md" }: Props) {
  const { isFollowing, toggle } = useFollowing();
  const followed = isFollowing(type, slug);

  const sm = size === "sm";
  return (
    <button
      onClick={() => toggle({ type, id, slug, name })}
      className={[
        "inline-flex items-center gap-1.5 rounded-lg font-medium transition-all",
        sm ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        followed
          ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)]/20"
          : "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
      ].join(" ")}
      aria-label={followed ? `Ne plus suivre ${name}` : `Suivre ${name}`}
    >
      {followed ? <Check size={sm ? 12 : 14} /> : <Star size={sm ? 12 : 14} />}
      {followed ? "Suivi" : "Suivre"}
    </button>
  );
}
