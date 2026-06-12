"use client";

/**
 * BracketViewer — Affichage robuste du bracket d'un tournoi
 *
 * Stratégies de parsing (la structure PandaScore est variable) :
 *   1. Array de matchs PS (pattern détecté via champ "opponents" / "scheduled_at")
 *      → grouper par round extrait du champ `name`, afficher en colonnes
 *   2. Array de rounds explicites (champ `matches` ou `games`)
 *      → afficher en colonnes directement
 *   3. Objet reconnu (groups, rounds, bracket, matches)
 *      → rendu structuré
 *   4. Données présentes mais non exploitables → message "données disponibles"
 *   5. Vide → EmptyState
 *
 * Sécurité :
 *   - Zéro crash — toutes les erreurs attrapées
 *   - rawJson jamais affiché en production
 *   - <details> debug uniquement en development
 */

import { useState } from "react";

// ─── Types internes ───────────────────────────────────────────────────────────

type BracketOpponent = {
  opponent?: { name?: string; acronym?: string } | null;
  score?: number | null;
  winner?: boolean;
};

type BracketMatch = {
  id?: number | string;
  name?: string;
  status?: string;
  opponents?: BracketOpponent[];
  results?: Array<{ score?: number; team_id?: number }>;
  winner?: { name?: string; acronym?: string } | null;
  scheduled_at?: string | null;
};

type RoundGroup = {
  label: string;
  matches: BracketMatch[];
};

type ParsedBracket =
  | { type: "rounds"; rounds: RoundGroup[] }
  | { type: "raw_summary"; keyCount: number; topKeys: string[] }
  | { type: "empty" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrait le numéro de round depuis le nom d'un match PandaScore.
 * Ex : "Upper bracket round 1 match 4: TBD vs TBD" → "Upper bracket round 1"
 *      "Semi Final: T1 vs Gen.G" → "Semi Final"
 */
function extractRoundLabel(name: string | undefined): string {
  if (!name) return "Round";

  // "Upper/Lower bracket round N ..."
  const bracketRound = name.match(/^((?:upper|lower)\s+bracket\s+round\s+\d+)/i);
  if (bracketRound) return capitalizeFirst(bracketRound[1]);

  // "Grand Final"
  if (/grand\s+final/i.test(name)) return "Grand Final";

  // "Semi[ -]?[Ff]inal"
  if (/semi.?final/i.test(name)) return "Semi Final";

  // "Quarter[ -]?[Ff]inal"
  if (/quarter.?final/i.test(name)) return "Quarter Final";

  // "Final" seul
  if (/^final/i.test(name)) return "Final";

  // "Round N"
  const roundMatch = name.match(/round\s+(\d+)/i);
  if (roundMatch) return `Round ${roundMatch[1]}`;

  // "Match N: ..." → garder juste avant le colon
  const colonIdx = name.indexOf(":");
  if (colonIdx > 0 && colonIdx < 40) return name.slice(0, colonIdx).trim();

  return "Round";
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Détecte si un item d'array ressemble à un match PandaScore.
 * Un match PS a "opponents" (tableau) ou "scheduled_at" ou "winner_type".
 */
function isPSMatch(item: unknown): item is Record<string, unknown> {
  if (typeof item !== "object" || item === null) return false;
  const r = item as Record<string, unknown>;
  return (
    Array.isArray(r.opponents) ||
    "scheduled_at" in r ||
    "winner_type" in r
  );
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

function parseBracket(rawJson: Record<string, unknown>): ParsedBracket {
  try {
    // ── Cas 1 : Array de matchs PS ──────────────────────────────────────────
    if (Array.isArray(rawJson)) {
      const arr = rawJson as unknown[];
      if (arr.length === 0) return { type: "empty" };

      // Détecter si les items sont des matchs PS
      if (arr.some(isPSMatch)) {
        const roundMap = new Map<string, BracketMatch[]>();

        for (const item of arr) {
          const r = item as Record<string, unknown>;
          const label = extractRoundLabel(r.name as string | undefined);

          const match: BracketMatch = {
            id: r.id as number,
            name: r.name as string | undefined,
            status: r.status as string | undefined,
            scheduled_at: r.scheduled_at as string | null | undefined,
            opponents: Array.isArray(r.opponents)
              ? (r.opponents as BracketOpponent[])
              : [],
            winner: r.winner as { name?: string; acronym?: string } | null,
          };

          if (!roundMap.has(label)) roundMap.set(label, []);
          roundMap.get(label)!.push(match);
        }

        const rounds: RoundGroup[] = [];
        for (const [label, matches] of roundMap) {
          rounds.push({ label, matches });
        }

        if (rounds.length > 0) return { type: "rounds", rounds };
      }

      // ── Cas 2 : Array de rounds explicites ──────────────────────────────
      const rounds: RoundGroup[] = arr.map((item, i) => {
        if (!isPSMatch(item) && typeof item === "object" && item !== null) {
          const r = item as Record<string, unknown>;
          const matchList: BracketMatch[] = Array.isArray(r.matches)
            ? (r.matches as BracketMatch[])
            : Array.isArray(r.games)
            ? (r.games as BracketMatch[])
            : [];
          return {
            label: (r.name as string) ?? `Round ${i + 1}`,
            matches: matchList,
          };
        }
        return { label: `Round ${i + 1}`, matches: [] };
      });

      if (rounds.some((r) => r.matches.length > 0)) {
        return { type: "rounds", rounds };
      }
    }

    // ── Cas 3 : Objet avec clés reconnues ───────────────────────────────────
    if (typeof rawJson === "object" && !Array.isArray(rawJson)) {
      const keys = Object.keys(rawJson);
      if (keys.length === 0) return { type: "empty" };

      for (const key of ["rounds", "bracket", "matches", "groups", "stages"]) {
        const value = rawJson[key];
        if (Array.isArray(value) && value.length > 0) {
          const rounds: RoundGroup[] = (value as unknown[]).map((item, i) => {
            if (typeof item !== "object" || item === null) {
              return { label: `${key} ${i + 1}`, matches: [] };
            }
            const r = item as Record<string, unknown>;
            return {
              label: (r.name as string) ?? `${key} ${i + 1}`,
              matches: Array.isArray(r.matches) ? (r.matches as BracketMatch[]) : [],
            };
          });
          return { type: "rounds", rounds };
        }
      }

      return { type: "raw_summary", keyCount: keys.length, topKeys: keys.slice(0, 6) };
    }

    return { type: "empty" };
  } catch {
    return { type: "empty" };
  }
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

/** Couleur du badge statut */
function statusColor(status: string | undefined): string {
  switch (status) {
    case "running":  return "text-red-400";
    case "finished": return "text-green-400";
    default:         return "text-[var(--muted)]";
  }
}

/** Label lisible du statut */
function statusLabel(status: string | undefined): string | null {
  switch (status) {
    case "running":  return "En cours";
    case "finished": return "Terminé";
    case "not_started": return null; // ne pas afficher
    default: return null;
  }
}

function MatchBlock({ match }: { match: BracketMatch }) {
  const opponents = match.opponents ?? [];
  const hasOpponents = opponents.some((o) => o.opponent?.name || o.opponent?.acronym);
  const label = statusLabel(match.status);

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg)] p-2 min-w-[150px] text-xs">
      {/* Statut visible uniquement si running/finished */}
      {label && (
        <p className={`text-[10px] mb-1 font-medium ${statusColor(match.status)}`}>
          {label}
        </p>
      )}
      {/* Équipes */}
      {hasOpponents ? (
        opponents.map((opp, i) => (
          <div
            key={i}
            className={`flex items-center justify-between gap-2 py-0.5 ${
              opp.winner ? "text-white font-semibold" : "text-[var(--muted)]"
            }`}
          >
            <span className="truncate max-w-[100px]">
              {opp.opponent?.acronym ?? opp.opponent?.name ?? "À déterminer"}
            </span>
            {opp.score != null && (
              <span className={`shrink-0 font-mono text-[11px] ${opp.winner ? "text-white" : ""}`}>
                {opp.score}
              </span>
            )}
          </div>
        ))
      ) : (
        <>
          <div className="text-[var(--muted)] py-0.5 italic text-[11px]">À déterminer</div>
          <div className="text-[var(--muted)] py-0.5 italic text-[11px]">À déterminer</div>
        </>
      )}
      {/* Date */}
      {match.scheduled_at && (
        <p className="text-[9px] text-[var(--muted)] mt-1.5 border-t border-[var(--border)] pt-1">
          {new Date(match.scheduled_at).toLocaleDateString("fr-FR", {
            weekday: "short", day: "numeric", month: "short",
          })}
        </p>
      )}
    </div>
  );
}

function RoundsView({ rounds }: { rounds: RoundGroup[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 pb-2 pt-1" style={{ minWidth: "max-content" }}>
        {rounds.map((round, ri) => (
          <div key={ri} className="flex flex-col gap-2 min-w-[160px]">
            <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide text-center mb-1">
              {round.label}
            </p>
            {round.matches.length > 0 ? (
              round.matches.map((match, mi) => (
                <MatchBlock key={mi} match={match} />
              ))
            ) : (
              <div className="rounded border border-dashed border-[var(--border)] p-2 text-center text-[var(--muted)] text-xs">
                —
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface BracketViewerProps {
  rawJson: Record<string, unknown>;
  updatedAt?: string;
}

export function BracketViewer({ rawJson, updatedAt }: BracketViewerProps) {
  const isDev = process.env.NODE_ENV !== "production";
  const [showDebug, setShowDebug] = useState(false);
  const parsed = parseBracket(rawJson);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-white">Bracket</h3>
        {updatedAt && (
          <span className="text-[10px] text-[var(--muted)]">
            Mis à jour le {new Date(updatedAt).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4">
        {parsed.type === "rounds" && <RoundsView rounds={parsed.rounds} />}

        {parsed.type === "raw_summary" && (
          <div className="text-center py-6">
            <p className="text-sm text-white mb-1">📊 Données bracket disponibles</p>
            <p className="text-xs text-[var(--muted)] mb-2">
              Structure non encore prise en charge ({parsed.keyCount} entrées).
            </p>
            <p className="text-[10px] text-[var(--muted)]">
              Clés : {parsed.topKeys.join(", ")}
              {parsed.keyCount > 6 ? "…" : ""}
            </p>
          </div>
        )}

        {parsed.type === "empty" && (
          <div className="text-center py-6">
            <p className="text-sm text-[var(--muted)]">
              Bracket non disponible pour ce tournoi.
            </p>
          </div>
        )}

        {/* Debug JSON — dev uniquement */}
        {isDev && (
          <details
            open={showDebug}
            onToggle={(e) => setShowDebug((e.target as HTMLDetailsElement).open)}
            className="mt-4"
          >
            <summary className="text-[10px] text-[var(--muted)] cursor-pointer hover:text-white transition-colors select-none">
              {showDebug ? "▾" : "▸"} Debug JSON brut (dev uniquement)
            </summary>
            <pre className="mt-2 text-[10px] text-[var(--muted)] bg-[var(--bg)] rounded p-3 overflow-auto max-h-64 leading-relaxed">
              {JSON.stringify(rawJson, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
