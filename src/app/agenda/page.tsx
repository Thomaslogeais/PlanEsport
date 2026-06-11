"use client";

import { useEffect, useState } from "react";
import { Users, Trophy, Calendar, Star } from "lucide-react";
import { useFollowing } from "@/hooks/useFollowing";
import MatchCard, { type MatchCardDTO } from "@/components/matches/MatchCard";
import EmptyState from "@/components/ui/EmptyState";
import FollowButton from "@/components/ui/FollowButton";

export default function AgendaPage() {
  const { following, followedTeams, followedCompetitions, isHydrated } = useFollowing();
  const [matches, setMatches] = useState<MatchCardDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    const allFollowed = following.filter((f) => f.type === "team" || f.type === "competition");
    if (allFollowed.length === 0) return;

    setLoading(true);
    Promise.all(
      allFollowed.slice(0, 8).map((f) => {
        const param = f.type === "team" ? `team=${f.slug}` : `competition=${f.slug}`;
        return fetch(`/api/matches?${param}&limit=10`)
          .then((r) => r.json())
          .then((d) => (d.matches ?? []) as MatchCardDTO[])
          .catch(() => [] as MatchCardDTO[]);
      })
    ).then((results) => {
      const seen = new Set<string>();
      const unique = results.flat().filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id); return true;
      });
      unique.sort((a, b) => {
        if (!a.scheduledAt) return 1;
        if (!b.scheduledAt) return -1;
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      });
      setMatches(unique);
      setLoading(false);
    });
  }, [isHydrated, following]);

  if (!isHydrated) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Mon Agenda</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Matchs des équipes et compétitions que vous suivez
          </p>
        </div>
        {following.length > 0 && (
          <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: "var(--surface-2)", color: "var(--muted)" }}>
            {following.length} suivi{following.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {following.length === 0 ? (
        <div>
          <EmptyState
            icon={Star}
            title="Votre agenda est vide"
            description="Suivez des équipes et compétitions pour retrouver leurs matchs ici automatiquement."
            actions={[
              { label: "Explorer les équipes", href: "/teams" },
              { label: "Explorer les compétitions", href: "/explore" },
            ]}
          />
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { Icon: Users, title: "Suivre une équipe", desc: "Tous les matchs de votre équipe", href: "/teams" },
              { Icon: Trophy, title: "Suivre une compétition", desc: "Tous les matchs d'un tournoi", href: "/explore" },
            ].map(({ Icon, title, desc, href }) => (
              <a key={href} href={href} className="flex items-start gap-3 p-4 rounded-xl transition-colors"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(124,58,237,0.1)", color: "var(--primary)" }}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{title}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Suivis actifs */}
          {(followedTeams.length > 0 || followedCompetitions.length > 0) && (
            <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-medium mb-3" style={{ color: "var(--muted)" }}>VOS SUIVIS</p>
              <div className="flex flex-wrap gap-2">
                {following.map((f) => (
                  <div key={`${f.type}-${f.id}`} className="flex items-center gap-1.5">
                    <FollowButton type={f.type as "team" | "competition"} id={f.id} slug={f.slug} name={f.name} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }} />
              ))}
            </div>
          )}

          {!loading && matches.length === 0 && (
            <EmptyState
              icon={Calendar}
              title="Aucun match pour l'instant"
              description="Les matchs de vos suivis apparaîtront ici dès qu'ils seront disponibles."
            />
          )}

          {!loading && matches.length > 0 && (
            <div className="flex flex-col gap-3">
              {matches.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
