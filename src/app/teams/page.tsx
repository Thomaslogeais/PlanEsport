import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTeams } from "@/lib/db/teams";
import EmptyState from "@/components/ui/EmptyState";
import PillGroup from "@/components/ui/PillGroup";

export const metadata: Metadata = { title: "Équipes" };

const GAMES = [
  { value: "league-of-legends", label: "League of Legends" },
  { value: "valorant",          label: "Valorant" },
  { value: "rocket-league",     label: "Rocket League" },
];

type SP = Promise<{ game?: string; search?: string }>;

export default async function TeamsPage({ searchParams }: { searchParams: SP }) {
  const sp     = await searchParams;
  const game   = typeof sp.game   === "string" ? sp.game   : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;

  const raw = await getTeams({ gameSlug: game, search, limit: 100 });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Équipes</h1>
        <span className="text-sm text-[var(--muted)]">{raw.length} équipes</span>
      </div>

      {/* Pills multi-select */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
        <Suspense>
          <PillGroup paramKey="game" label="Jeu" options={GAMES} />
        </Suspense>
      </div>

      {raw.length === 0 ? (
        <EmptyState title="Aucune équipe trouvée" description="Essayez un autre filtre." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {raw.map((team) => {
            const initials = team.name.slice(0, 2).toUpperCase();
            return (
              <Link key={team.id} href={`/teams/${team.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors text-center">
                {team.imageUrl ? (
                  <Image src={team.imageUrl} alt={team.name} width={40} height={40}
                    className="rounded object-contain bg-zinc-800" />
                ) : (
                  <span className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">{initials}</span>
                )}
                <p className="text-sm font-medium text-white truncate w-full">{team.name}</p>
                <p className="text-xs text-[var(--muted)]">{team._count.matchTeams} matchs</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
