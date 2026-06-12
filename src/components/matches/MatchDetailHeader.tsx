import Image from "next/image";
import { Trophy } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils/date";

// ─── Types ───────────────────────────────────────────────────────────────────

type TeamSlot = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  score: number | null;
  isWinner: boolean;
};

export type MatchDetailHeaderProps = {
  name: string | null;
  status: string;
  scheduledAt: Date | null;
  teams: TeamSlot[];
  rawJson: unknown;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrait le BO depuis rawJson.number_of_games — guard strict */
function extractBO(rawJson: unknown): number | null {
  try {
    if (typeof rawJson !== "object" || rawJson === null) return null;
    const r = rawJson as Record<string, unknown>;
    const n = r.number_of_games;
    if (typeof n === "number" && n > 0) return n;
    return null;
  } catch {
    return null;
  }
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function TeamBlock({
  team,
  align,
}: {
  team: TeamSlot | null;
  align: "left" | "right";
}) {
  const isRight = align === "right";

  if (!team) {
    return (
      <div className={`flex-1 flex flex-col items-center gap-3 ${isRight ? "items-end" : "items-start"} sm:items-center`}>
        <div className="w-14 h-14 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
          <span className="text-lg font-bold text-[var(--muted)]">?</span>
        </div>
        <span className="text-sm text-[var(--muted)] italic">À déterminer</span>
      </div>
    );
  }

  const initials = team.name.slice(0, 2).toUpperCase();

  return (
    <div className={`flex-1 flex flex-col items-center gap-3`}>
      {/* Logo */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--surface-2)" }}>
        {team.imageUrl ? (
          <Image
            src={team.imageUrl}
            alt={team.name}
            width={56}
            height={56}
            className="object-contain"
          />
        ) : (
          <span className="text-lg font-bold" style={{ color: "var(--muted)" }}>
            {initials}
          </span>
        )}
      </div>

      {/* Nom */}
      <span
        className={`text-sm font-semibold text-center leading-tight ${team.isWinner ? "text-white" : "text-[var(--muted)]"}`}
      >
        {team.name}
      </span>

      {/* Badge vainqueur */}
      {team.isWinner && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
          <Trophy size={11} />
          Vainqueur
        </span>
      )}
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function MatchDetailHeader({
  name,
  status,
  scheduledAt,
  teams,
  rawJson,
}: MatchDetailHeaderProps) {
  const teamA = teams[0] ?? null;
  const teamB = teams[1] ?? null;
  const bo = extractBO(rawJson);

  const showScore =
    status === "finished" || status === "running";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden mb-6">
      {/* Bande colorée de statut */}
      <div
        className="h-1 w-full"
        style={{
          backgroundColor:
            status === "running"
              ? "#ef4444"
              : status === "not_started"
              ? "#7c3aed"
              : status === "finished"
              ? "var(--border)"
              : "var(--border)",
        }}
      />

      <div className="p-6">
        {/* Titre + statut */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-sm text-[var(--muted)] truncate">
            {name ?? "Match"}
          </h1>
          <StatusBadge status={status} />
        </div>

        {/* Matchup */}
        <div className="flex items-center gap-4">
          <TeamBlock team={teamA} align="left" />

          {/* Score central */}
          <div className="shrink-0 flex flex-col items-center gap-1 px-2">
            {showScore && teamA && teamB ? (
              <div className="flex items-center gap-1">
                <span
                  className="text-3xl font-black tabular-nums w-8 text-center"
                  style={{ color: teamA.isWinner ? "var(--text)" : "var(--muted)" }}
                >
                  {teamA.score ?? 0}
                </span>
                <span className="text-lg text-[var(--muted)] font-light">—</span>
                <span
                  className="text-3xl font-black tabular-nums w-8 text-center"
                  style={{ color: teamB.isWinner ? "var(--text)" : "var(--muted)" }}
                >
                  {teamB.score ?? 0}
                </span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-[var(--muted)]">VS</span>
            )}
            {bo && (
              <span className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wide">
                BO{bo}
              </span>
            )}
          </div>

          <TeamBlock team={teamB} align="right" />
        </div>

        {/* Date */}
        {scheduledAt && (
          <p className="text-xs text-center text-[var(--muted)] mt-5">
            {formatDateTime(scheduledAt.toISOString())}
          </p>
        )}
      </div>
    </div>
  );
}
