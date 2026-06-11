"use client";
import { useRouter, usePathname } from "next/navigation";

type Props = {
  current: { game?: string; status?: string; team?: string };
};

const GAMES = [
  { slug: "league-of-legends", name: "League of Legends" },
  { slug: "valorant", name: "Valorant" },
  { slug: "rocket-league", name: "Rocket League" },
];
const STATUSES = [
  { value: "not_started", label: "À venir" },
  { value: "running", label: "En cours" },
  { value: "finished", label: "Terminé" },
];

const selectCls = "bg-[var(--surface)] border border-[var(--border)] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[var(--primary)] cursor-pointer";

export default function MatchFilters({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (current.game && key !== "game") params.set("game", current.game);
    if (current.status && key !== "status") params.set("status", current.status);
    if (current.team && key !== "team") params.set("team", current.team);
    if (value) params.set(key, value);
    params.delete("offset");
    router.push(`${pathname}?${params.toString()}`);
  };

  const reset = () => router.push(pathname);

  const hasFilters = !!(current.game || current.status || current.team);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <select value={current.game ?? ""} onChange={(e) => update("game", e.target.value)} className={selectCls}>
        <option value="">Tous les jeux</option>
        {GAMES.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
      </select>
      <select value={current.status ?? ""} onChange={(e) => update("status", e.target.value)} className={selectCls}>
        <option value="">Tous les statuts</option>
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      {hasFilters && (
        <button onClick={reset} className="text-xs text-[var(--muted)] hover:text-white underline transition-colors">
          Réinitialiser
        </button>
      )}
    </div>
  );
}
