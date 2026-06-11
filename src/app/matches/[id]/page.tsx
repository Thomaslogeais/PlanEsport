import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getMatchById } from "@/lib/db/matches";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils/date";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = await getMatchById(id);
  return { title: m ? (m.name ?? "Match") : "Introuvable" };
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;
  const m = await getMatchById(id);
  if (!m) notFound();

  const streams = Array.isArray(m.streams) ? m.streams as { raw_url?: string; language?: string; main?: boolean }[] : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="text-sm text-[var(--muted)] mb-6">
        <Link href="/matches" className="hover:text-white transition-colors">Matchs</Link>
        {" / "}
        <span className="text-white">{m.name ?? "Match"}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">{m.name ?? "Match sans titre"}</h1>
          <p className="text-sm text-[var(--muted)]">{formatDateTime(m.scheduledAt?.toISOString())}</p>
        </div>
        <StatusBadge status={m.status} />
      </div>

      {/* Context */}
      <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] mb-6 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[var(--muted)] text-xs mb-1">Jeu</p>
            <p className="text-white">{m.game.name}</p>
          </div>
          <div>
            <p className="text-[var(--muted)] text-xs mb-1">Compétition</p>
            <p className="text-white">{m.tournament.competition.name}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[var(--muted)] text-xs mb-1">Tournoi</p>
            <Link href={`/tournaments/${m.tournament.slug}`}
              className="text-[var(--primary)] hover:underline">
              {m.tournament.name}
            </Link>
          </div>
        </div>
      </div>

      {/* Teams & Scores */}
      {m.teams.length === 2 && (() => {
        const [t1, t2] = m.teams;
        return (
          <div className="p-6 rounded-lg bg-[var(--surface)] border border-[var(--border)] mb-6">
            <div className="flex items-center justify-around gap-4">
              {[t1, t2].map((t) => (
                <div key={t.team.id} className={`flex flex-col items-center gap-2 text-center ${t.isWinner ? "opacity-100" : "opacity-70"}`}>
                  {t.team.imageUrl ? (
                    <Image src={t.team.imageUrl} alt={t.team.name} width={48} height={48}
                      className="rounded object-contain bg-zinc-800" />
                  ) : (
                    <span className="w-12 h-12 rounded bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300">
                      {t.team.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <p className={`text-sm font-semibold ${t.isWinner ? "text-white" : "text-[var(--muted)]"}`}>{t.team.name}</p>
                  {t.isWinner && <span className="text-yellow-400 text-xs">🏆 Vainqueur</span>}
                </div>
              ))}
            </div>
            {(t1.score !== null || t2.score !== null) && (
              <div className="text-center mt-4">
                <span className="text-3xl font-bold text-white">
                  {t1.score ?? "—"} <span className="text-[var(--muted)] text-xl">—</span> {t2.score ?? "—"}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Streams */}
      {streams.length > 0 && (
        <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
          <h2 className="text-sm font-semibold text-white mb-3">Streams</h2>
          <div className="flex flex-wrap gap-2">
            {streams.map((s, i) => s.raw_url && (
              <a key={i} href={s.raw_url} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-sm text-white transition-colors">
                {s.main ? "🔴 Officiel" : s.language?.toUpperCase() ?? "Stream"}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
