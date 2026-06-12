import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gamepad2 } from "lucide-react";
import FollowButton from "@/components/ui/FollowButton";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TeamHeaderProps = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  game: { slug: string; name: string; imageUrl: string | null };
  totalMatches: number;
};

// ─── Composant ───────────────────────────────────────────────────────────────

export default function TeamHeader({
  id,
  name,
  slug,
  imageUrl,
  game,
  totalMatches,
}: TeamHeaderProps) {
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
      <div className="flex items-start justify-between gap-4">
        {/* Logo + infos */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div
            className="w-18 h-18 shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              width: 72,
              height: 72,
              backgroundColor: "var(--surface-2)",
            }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                width={72}
                height={72}
                className="object-contain"
              />
            ) : (
              <span
                className="text-2xl font-black"
                style={{ color: "var(--muted)" }}
              >
                {initials}
              </span>
            )}
          </div>

          {/* Nom + jeu + compteur */}
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight mb-1">
              {name}
            </h1>
            <div className="flex items-center gap-1.5 mb-2">
              <Gamepad2 size={13} style={{ color: "var(--muted)" }} />
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {game.name}
              </span>
            </div>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {totalMatches} match{totalMatches !== 1 ? "s" : ""} connus
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <FollowButton type="team" id={id} slug={slug} name={name} />
        </div>
      </div>

      {/* Lien vers tous les matchs */}
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <Link
          href={`/matches?team=${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "var(--primary)" }}
        >
          Voir tous les matchs
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
