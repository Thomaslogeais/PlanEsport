// ─── Types ───────────────────────────────────────────────────────────────────

export type TeamStatsProps = {
  total: number;
  wins: number;
  losses: number;
  upcoming: number;
  finished: number;
  winrate: number | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function winrateColor(winrate: number): string {
  if (winrate >= 60) return "#4ade80"; // vert
  if (winrate >= 40) return "#fbbf24"; // jaune
  return "#f87171";                    // rouge
}

// ─── Sous-composant stat ──────────────────────────────────────────────────────

function StatCell({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 px-3 py-3"
      style={{ borderRight: "1px solid var(--border)" }}
    >
      <span
        className="text-xl font-black tabular-nums"
        style={{ color: color ?? "var(--text)" }}
      >
        {value}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {label}
      </span>
    </div>
  );
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function TeamStats({
  total,
  wins,
  losses,
  upcoming,
  finished,
  winrate,
}: TeamStatsProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] mb-6 overflow-hidden">
      <div className="px-4 pt-3 pb-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Statistiques
        </h2>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(6, 1fr)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <StatCell value={total}    label="Total" />
        <StatCell value={upcoming} label="À venir" />
        <StatCell value={finished} label="Terminés" />
        <StatCell value={wins}     label="Victoires" color="#4ade80" />
        <StatCell value={losses}   label="Défaites"  color="#f87171" />
        <StatCell
          value={winrate !== null ? `${winrate}%` : "—"}
          label="Winrate"
          color={winrate !== null ? winrateColor(winrate) : undefined}
        />
      </div>
    </div>
  );
}
