import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils/date";

export type TournamentCardDTO = {
  id: string; name: string; slug: string; status: string;
  imageUrl: string | null; startDate: string | null; endDate: string | null;
  competition: { id: string; slug: string; name: string; imageUrl?: string | null; game: { slug: string; name: string } };
};

export default function TournamentCard({ tournament: t }: { tournament: TournamentCardDTO }) {
  return (
    <Link href={`/tournaments/${t.slug}`}
      className="block p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-xs text-[var(--muted)] mb-1">{t.competition.game.name} · {t.competition.name}</p>
          <h3 className="font-semibold text-white text-sm truncate">{t.name}</h3>
        </div>
        <StatusBadge status={t.status} className="shrink-0" />
      </div>
      <p className="text-xs text-[var(--muted)] mt-3">
        {formatDate(t.startDate)} — {formatDate(t.endDate)}
      </p>
    </Link>
  );
}
