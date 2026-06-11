"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, X, Gamepad2, Trophy, Users, Calendar, Zap } from "lucide-react";

type FacetItem  = { slug?: string; value?: string; id?: string; name: string; count: number; label?: string };
type FacetsData = {
  ok: boolean;
  games: (FacetItem & { slug: string; imageUrl?: string | null })[];
  competitions: (FacetItem & { id: string; slug: string; game?: { slug: string; name: string } })[];
  teams: (FacetItem & { id: string; slug: string })[];
  tournaments: (FacetItem & { id: string; slug: string; competition?: { slug: string; name: string } })[];
  statuses: { value: string; label: string; count: number }[];
  periods: { value: string; label: string }[];
};

// ── Pill simple ──────────────────────────────────────────────────────────────
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
      style={{
        backgroundColor: active ? "var(--primary)" : "var(--surface-2)",
        color: active ? "#fff" : "var(--muted-light)",
        border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
      }}
    >
      {label}
    </button>
  );
}

// ── Dropdown avec pills internes ─────────────────────────────────────────────
function FilterDropdown({
  icon: Icon,
  label,
  value,
  items,
  onSelect,
  onClear,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  items: { key: string; name: string }[];
  onSelect: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = !!value;
  const selected = items.find((i) => i.key === value);

  // Ferme au clic extérieur
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
        style={{
          backgroundColor: active ? "var(--primary)" : "var(--surface-2)",
          color: active ? "#fff" : "var(--muted-light)",
          border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
        }}
      >
        <Icon size={11} />
        {active ? selected?.name ?? label : label}
        {active ? (
          <span
            onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }}
            className="ml-0.5 rounded-full p-0.5 transition-colors"
            style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--muted)" }}
          >
            <X size={10} />
          </span>
        ) : (
          <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 z-50 rounded-xl p-3 min-w-[200px] max-w-[280px] max-h-[260px] overflow-y-auto shadow-lg"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => { onSelect(item.key); setOpen(false); }}
                className="px-2.5 py-1 rounded-full text-xs transition-all"
                style={{
                  backgroundColor: value === item.key ? "var(--primary)" : "var(--surface-2)",
                  color: value === item.key ? "#fff" : "var(--muted-light)",
                  border: `1px solid ${value === item.key ? "var(--primary)" : "var(--border)"}`,
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component principal ───────────────────────────────────────────────────────
export default function ExploreFilters() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const game        = searchParams.get("game")        ?? "";
  const competition = searchParams.get("competition") ?? "";
  const team        = searchParams.get("team")        ?? "";
  const tournament  = searchParams.get("tournament")  ?? "";
  const status      = searchParams.get("status")      ?? "";
  const period      = searchParams.get("period")      ?? "";

  const [facets, setFacets] = useState<FacetsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (game)        params.set("game", game);
    if (competition) params.set("competition", competition);
    if (team)        params.set("team", team);
    if (tournament)  params.set("tournament", tournament);
    if (status)      params.set("status", status);
    if (period)      params.set("period", period);

    fetch(`/api/explore/facets?${params.toString()}`)
      .then((r) => r.json())
      .then((d: FacetsData) => setFacets(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [game, competition, team, tournament, status, period]);

  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("offset");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const reset = () => router.push(pathname);
  const hasFilters = !!(game || competition || team || tournament || status || period);

  // ── Skeleton ──
  if (loading && !facets) {
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {[80, 100, 70, 90, 80].map((w, i) => (
          <div key={i} className="h-7 rounded-full animate-pulse" style={{ width: w, backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }} />
        ))}
      </div>
    );
  }
  if (!facets) return null;

  const statusColors: Record<string, string> = {
    running:     "#ef4444",
    not_started: "#7c3aed",
    finished:    "#6b7280",
    canceled:    "#f59e0b",
  };

  return (
    <div className="mb-6 space-y-3">
      {/* ── Ligne 1 : Jeux + Statut + Période ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Jeux — pills directes */}
        {facets.games.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs mr-1" style={{ color: "var(--muted)" }}>Jeu</span>
            {facets.games.map((g) => (
              <Pill key={g.slug} label={g.name} active={game === g.slug}
                onClick={() => setFilter("game", game === g.slug ? "" : g.slug)} />
            ))}
          </div>
        )}

        <div className="w-px h-5 mx-1" style={{ backgroundColor: "var(--border)" }} />

        {/* Statut — pills avec couleur */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs mr-1" style={{ color: "var(--muted)" }}>Statut</span>
          {facets.statuses.map((s) => (
            <button key={s.value} onClick={() => setFilter("status", status === s.value ? "" : s.value)}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
              style={{
                backgroundColor: status === s.value ? (statusColors[s.value] ?? "var(--primary)") : "var(--surface-2)",
                color: status === s.value ? "#fff" : "var(--muted-light)",
                border: `1px solid ${status === s.value ? (statusColors[s.value] ?? "var(--primary)") : "var(--border)"}`,
              }}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: "var(--border)" }} />

        {/* Période — pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs mr-1" style={{ color: "var(--muted)" }}>Période</span>
          {facets.periods.map((p) => (
            <Pill key={p.value} label={p.label} active={period === p.value}
              onClick={() => setFilter("period", period === p.value ? "" : p.value)} />
          ))}
        </div>
      </div>

      {/* ── Ligne 2 : Dropdowns pour listes longues ──────────────────────── */}
      {(facets.competitions.length > 0 || facets.teams.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {facets.competitions.length > 0 && (
            <FilterDropdown
              icon={Trophy}
              label="Compétition"
              value={competition}
              items={facets.competitions.map((c) => ({ key: c.slug, name: c.name }))}
              onSelect={(v) => setFilter("competition", v)}
              onClear={() => setFilter("competition", "")}
            />
          )}
          {facets.teams.length > 0 && (
            <FilterDropdown
              icon={Users}
              label="Équipe"
              value={team}
              items={facets.teams.map((t) => ({ key: t.slug, name: t.name }))}
              onSelect={(v) => setFilter("team", v)}
              onClear={() => setFilter("team", "")}
            />
          )}
          {competition && facets.tournaments.length > 0 && (
            <FilterDropdown
              icon={Calendar}
              label="Tournoi"
              value={tournament}
              items={facets.tournaments.map((t) => ({ key: t.slug, name: t.name }))}
              onSelect={(v) => setFilter("tournament", v)}
              onClear={() => setFilter("tournament", "")}
            />
          )}
          {hasFilters && (
            <button onClick={reset}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors"
              style={{ color: "var(--muted)", border: "1px solid var(--border)" }}>
              <X size={10} />
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* ── Filtres actifs (badges) ───────────────────────────────────────── */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {game        && <ActiveBadge label={facets.games.find(g => g.slug === game)?.name ?? game} onRemove={() => setFilter("game", "")} />}
          {competition && <ActiveBadge label={facets.competitions.find(c => c.slug === competition)?.name ?? competition} onRemove={() => setFilter("competition", "")} />}
          {team        && <ActiveBadge label={facets.teams.find(t => t.slug === team)?.name ?? team} onRemove={() => setFilter("team", "")} />}
          {tournament  && <ActiveBadge label={facets.tournaments.find(t => t.slug === tournament)?.name ?? tournament} onRemove={() => setFilter("tournament", "")} />}
          {status      && <ActiveBadge label={facets.statuses.find(s => s.value === status)?.label ?? status} onRemove={() => setFilter("status", "")} />}
          {period      && <ActiveBadge label={facets.periods.find(p => p.value === period)?.label ?? period} onRemove={() => setFilter("period", "")} />}
        </div>
      )}
    </div>
  );
}

function ActiveBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: "rgba(124,58,237,0.15)", color: "var(--primary)", border: "1px solid rgba(124,58,237,0.3)" }}>
      {label}
      <button onClick={onRemove} className="ml-0.5 transition-opacity hover:opacity-100 opacity-60">
        <X size={10} />
      </button>
    </span>
  );
}
