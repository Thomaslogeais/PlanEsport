import Link from "next/link";
import Image from "next/image";
import { Clock, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils/date";

type Team = { id: string; name: string; slug: string; imageUrl: string | null; score: number | null; isWinner: boolean };

export type MatchCardDTO = {
  id: string;
  name: string | null;
  status: string;
  scheduledAt: string | null;
  game: { slug: string; name: string; imageUrl: string | null };
  tournament: {
    id: string; slug: string; name: string;
    competition: { id: string; slug: string; name: string; imageUrl: string | null };
  } | null;
  teams: Team[];
};

function TeamLogo({ team, reverse }: { team: Team; reverse?: boolean }) {
  const initials = team.name.slice(0, 2).toUpperCase();
  return (
    <div className={`flex items-center gap-2 flex-1 ${reverse ? "flex-row-reverse" : ""}`}>
      <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg overflow-hidden"
        style={{ backgroundColor: "var(--surface-2)" }}>
        {team.imageUrl ? (
          <Image src={team.imageUrl} alt={team.name} width={32} height={32} className="object-contain" />
        ) : (
          <span className="text-xs font-bold" style={{ color: "var(--muted)" }}>{initials}</span>
        )}
      </div>
      <span className="text-sm font-medium truncate max-w-[120px]"
        style={{ color: team.isWinner ? "var(--text)" : "var(--muted-light)", fontWeight: team.isWinner ? 600 : 400 }}>
        {team.name}
      </span>
    </div>
  );
}

const STATUS_ACCENT: Record<string, string> = {
  running:     "#ef4444",
  not_started: "#7c3aed",
  finished:    "transparent",
  canceled:    "#f59e0b",
};

export default function MatchCard({ match }: { match: MatchCardDTO }) {
  const [teamA, teamB] = match.teams;
  const accentColor = STATUS_ACCENT[match.status] ?? "transparent";

  return (
    <Link href={`/matches/${match.id}`}
      className="group block rounded-xl overflow-hidden transition-all hover:border-[var(--border-light)]"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex">
        <div className="w-0.5 shrink-0" style={{ backgroundColor: accentColor }} />
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              {match.tournament?.competition?.imageUrl && (
                <Image src={match.tournament.competition.imageUrl} alt={match.tournament.competition.name}
                  width={16} height={16} className="rounded object-contain shrink-0" />
              )}
              <span className="text-xs truncate" style={{ color: "var(--muted)" }}>
                {match.tournament?.competition?.name ?? "—"}
                {match.tournament && <span className="opacity-60 ml-1">· {match.tournament.name}</span>}
              </span>
            </div>
            <StatusBadge status={match.status} />
          </div>

          {/* Matchup */}
          <div className="flex items-center gap-3">
            {teamA ? <TeamLogo team={teamA} /> : <div className="flex-1 text-xs" style={{ color: "var(--muted)" }}>TBD</div>}
            <div className="flex items-center shrink-0 px-2">
              {match.status === "finished" && teamA && teamB ? (
                <>
                  <span className="text-lg font-bold tabular-nums w-5 text-right"
                    style={{ color: teamA.isWinner ? "var(--text)" : "var(--muted)" }}>{teamA.score ?? 0}</span>
                  <span className="text-xs font-bold mx-1" style={{ color: "var(--muted)" }}>–</span>
                  <span className="text-lg font-bold tabular-nums w-5 text-left"
                    style={{ color: teamB.isWinner ? "var(--text)" : "var(--muted)" }}>{teamB.score ?? 0}</span>
                </>
              ) : (
                <span className="text-xs font-semibold px-1" style={{ color: "var(--border-light)" }}>VS</span>
              )}
            </div>
            {teamB ? <TeamLogo team={teamB} reverse /> : <div className="flex-1 text-xs text-right" style={{ color: "var(--muted)" }}>TBD</div>}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
              <Clock size={11} />
              <span className="text-xs">{match.scheduledAt ? formatDateTime(match.scheduledAt) : "—"}</span>
              <span className="text-xs opacity-50 mx-1">·</span>
              <span className="text-xs">{match.game.name}</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--muted)" }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
