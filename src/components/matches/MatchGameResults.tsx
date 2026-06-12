import { CheckCircle2, Clock, XCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MatchGameResultsProps = {
  status: string;
  rawJson: unknown;
  /** Teams pour résoudre winner.id → nom d'équipe */
  teams: Array<{
    team: { id: string; name: string };
  }>;
};

type PSGame = {
  id?: number;
  position?: number;
  status?: string;
  winner?: { id?: number | null; type?: string } | null;
  forfeit?: boolean;
  begin_at?: string | null;
  end_at?: string | null;
  length?: number | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrait games depuis rawJson.games — guard strict */
function extractGames(rawJson: unknown): PSGame[] {
  try {
    if (typeof rawJson !== "object" || rawJson === null) return [];
    const r = rawJson as Record<string, unknown>;
    if (!Array.isArray(r.games)) return [];
    return r.games.filter(
      (item): item is PSGame =>
        typeof item === "object" && item !== null
    );
  } catch {
    return [];
  }
}

/** Convertit des secondes en "mm:ss" */
function formatDuration(seconds: number | null | undefined): string | null {
  if (typeof seconds !== "number" || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Trouve le nom d'une équipe depuis son ID PandaScore (number) */
function findTeamName(
  winnerId: number | null | undefined,
  teams: MatchGameResultsProps["teams"],
  rawJson: unknown
): string | null {
  if (!winnerId) return null;

  // Chercher l'ID PS dans les opponents du rawJson
  try {
    if (typeof rawJson === "object" && rawJson !== null) {
      const r = rawJson as Record<string, unknown>;
      if (Array.isArray(r.opponents)) {
        for (const opp of r.opponents) {
          if (typeof opp !== "object" || opp === null) continue;
          const o = opp as Record<string, unknown>;
          const inner = o.opponent as Record<string, unknown> | null;
          if (!inner) continue;
          if (inner.id === winnerId) {
            return (inner.acronym as string) ?? (inner.name as string) ?? null;
          }
        }
      }
    }
  } catch {
    // fallback
  }

  // Dernier recours : index position dans teams
  void teams; // teams non utilisées si rawJson résout
  return null;
}

// ─── Icône par statut ─────────────────────────────────────────────────────────

function GameStatusIcon({ status }: { status: string | undefined }) {
  switch (status) {
    case "finished":   return <CheckCircle2 size={13} className="text-green-400 shrink-0" />;
    case "running":    return <Clock size={13} className="text-red-400 shrink-0 animate-pulse" />;
    case "not_started":
    default:           return <Clock size={13} className="text-[var(--muted)] shrink-0" />;
  }
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function MatchGameResults({ status, rawJson, teams }: MatchGameResultsProps) {
  const games = extractGames(rawJson);

  // Fallback selon statut global
  if (games.length === 0) {
    if (status === "not_started") {
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
            Parties
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Les résultats détaillés seront disponibles après le début du match.
          </p>
        </div>
      );
    }
    if (status === "finished") {
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
            Parties
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Les résultats détaillés ne sont pas disponibles pour ce match.
          </p>
        </div>
      );
    }
    // running ou autre sans données
    return null;
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6">
      <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-4">
        Parties ({games.length})
      </h2>

      <div className="flex flex-col gap-2">
        {games.map((game, i) => {
          const position = game.position ?? i + 1;
          const gameStatus = game.status ?? "not_started";
          const winnerName = findTeamName(
            typeof game.winner?.id === "number" ? game.winner.id : null,
            teams,
            rawJson
          );
          const duration = formatDuration(game.length);
          const isForfeit = game.forfeit === true;

          return (
            <div
              key={game.id ?? i}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
            >
              {/* Numéro + icône */}
              <div className="flex items-center gap-2 shrink-0">
                <GameStatusIcon status={gameStatus} />
                <span className="text-[var(--muted)] text-xs font-medium w-14 shrink-0">
                  Partie {position}
                </span>
              </div>

              {/* Vainqueur */}
              <div className="flex-1 min-w-0">
                {gameStatus === "finished" ? (
                  isForfeit ? (
                    <span className="text-xs text-amber-400">Forfait</span>
                  ) : winnerName ? (
                    <span className="text-white font-medium text-xs truncate">{winnerName} gagne</span>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">Terminé</span>
                  )
                ) : gameStatus === "running" ? (
                  <span className="text-xs text-red-400 font-medium">En cours</span>
                ) : (
                  <span className="text-xs text-[var(--muted)]">—</span>
                )}
              </div>

              {/* Durée */}
              {duration && gameStatus === "finished" && (
                <div className="shrink-0 flex items-center gap-1">
                  <XCircle size={10} className="text-[var(--muted)]" style={{ display: "none" }} />
                  <span className="text-[10px] text-[var(--muted)]">
                    Durée : {duration}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
