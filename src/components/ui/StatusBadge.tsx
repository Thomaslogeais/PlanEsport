import { Radio, Clock, CheckCircle2, XCircle } from "lucide-react";

type Props = { status: string; className?: string };

const CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  running:     { label: "Live",     color: "#ef4444", bg: "rgba(239,68,68,0.12)",   Icon: Radio },
  not_started: { label: "À venir",  color: "#7c3aed", bg: "rgba(124,58,237,0.12)",  Icon: Clock },
  finished:    { label: "Terminé",  color: "#6b7280", bg: "rgba(107,114,128,0.12)", Icon: CheckCircle2 },
  canceled:    { label: "Annulé",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  Icon: XCircle },
};

export default function StatusBadge({ status, className = "" }: Props) {
  const cfg = CONFIG[status] ?? { label: status, color: "#6b7280", bg: "rgba(107,114,128,0.12)", Icon: Clock };
  const { label, color, bg, Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ color, backgroundColor: bg }}
    >
      <Icon size={10} className={status === "running" ? "animate-live" : ""} />
      {label}
    </span>
  );
}
