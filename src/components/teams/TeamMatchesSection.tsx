import MatchCard from "@/components/matches/MatchCard";
import EmptyState from "@/components/ui/EmptyState";
import type { MatchCardDTO } from "@/components/matches/MatchCard";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  title: string;
  matches: MatchCardDTO[];
  emptyTitle: string;
  emptyDescription?: string;
  limit?: number;
};

// ─── Composant ───────────────────────────────────────────────────────────────

export default function TeamMatchesSection({
  title,
  matches,
  emptyTitle,
  emptyDescription,
  limit,
}: Props) {
  const displayed = limit ? matches.slice(0, limit) : matches;

  return (
    <section className="mb-8">
      {/* Titre de section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">
          {title}
          {matches.length > 0 && (
            <span
              className="ml-2 text-xs font-normal"
              style={{ color: "var(--muted)" }}
            >
              ({matches.length})
            </span>
          )}
        </h2>
      </div>

      {/* Liste ou empty state */}
      {displayed.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {displayed.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </section>
  );
}
