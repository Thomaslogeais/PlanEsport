"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type SearchResult = {
  type: "team" | "competition" | "tournament";
  id: string; slug: string; name: string;
  imageUrl: string | null; url: string;
  competition?: { slug: string; name: string };
};
type SearchResponse = {
  ok: boolean; query: string;
  teams: SearchResult[]; competitions: SearchResult[]; tournaments: SearchResult[];
};

const TYPE_LABELS = { team: "Équipes", competition: "Compétitions", tournament: "Tournois" };
const TYPE_ICONS  = { team: "👥", competition: "🏆", tournament: "📅" };

function ResultItem({ item, onSelect }: { item: SearchResult; onSelect: () => void }) {
  const initials = item.name.slice(0, 2).toUpperCase();
  return (
    <Link href={item.url} onClick={onSelect}
      className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--surface-hover)] transition-colors">
      {item.imageUrl ? (
        <Image src={item.imageUrl} alt={item.name} width={24} height={24}
          className="rounded object-contain bg-zinc-800 shrink-0" />
      ) : (
        <span className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-xs text-zinc-300 shrink-0">{initials}</span>
      )}
      <div className="min-w-0">
        <p className="text-sm text-white truncate">{item.name}</p>
        {item.competition && (
          <p className="text-xs text-[var(--muted)] truncate">{item.competition.name}</p>
        )}
      </div>
    </Link>
  );
}

type Props = {
  placeholder?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
};

export default function GlobalSearch({ placeholder = "Rechercher une équipe, compétition, tournoi…", autoFocus, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults(null); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json() as SearchResponse;
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = useCallback(() => {
    setOpen(false); setQuery(""); setResults(null);
    onNavigate?.();
  }, [onNavigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.length >= 2) {
      router.push(`/explore?q=${encodeURIComponent(query)}`);
      handleSelect();
    }
    if (e.key === "Escape") { setOpen(false); }
  };

  const hasResults = results && (results.teams.length > 0 || results.competitions.length > 0 || results.tournaments.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && results && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-white placeholder-[var(--muted)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] animate-pulse">...</span>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-[var(--muted)]">Aucun résultat pour « {query} »</p>
          ) : (
            <>
              {(["team", "competition", "tournament"] as const).map((type) => {
                const items = type === "team" ? results!.teams : type === "competition" ? results!.competitions : results!.tournaments;
                if (!items.length) return null;
                return (
                  <div key={type}>
                    <p className="px-4 py-1.5 text-xs font-semibold text-[var(--muted)] bg-zinc-900/50 sticky top-0">
                      {TYPE_ICONS[type]} {TYPE_LABELS[type]}
                    </p>
                    {items.map((item) => <ResultItem key={item.id} item={item} onSelect={handleSelect} />)}
                  </div>
                );
              })}
              <div className="border-t border-[var(--border)] px-4 py-2">
                <Link href={`/explore?q=${encodeURIComponent(query)}`} onClick={handleSelect}
                  className="text-xs text-[var(--primary)] hover:underline">
                  Voir tous les résultats pour « {query} » →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
