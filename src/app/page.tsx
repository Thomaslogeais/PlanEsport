import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getMatches } from "@/lib/db/matches";
import { getTeams } from "@/lib/db/teams";
import { prisma } from "@/lib/db/prisma";
import GlobalSearch from "@/components/explore/GlobalSearch";
import MatchCard from "@/components/matches/MatchCard";
import StatusBadge from "@/components/ui/StatusBadge";

// ─── Accès rapides ──────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: "Explorer",       icon: "🔍", href: "/explore",                   desc: "Tous les matchs" },
  { label: "Matchs du jour", icon: "📅", href: "/explore?period=today",       desc: "Aujourd'hui" },
  { label: "Live",           icon: "🔴", href: "/explore?status=running",     desc: "En ce moment" },
  { label: "À venir",        icon: "⏳", href: "/explore?status=not_started", desc: "Prochains matchs" },
  { label: "Équipes",        icon: "👥", href: "/teams",                      desc: "Toutes les équipes" },
  { label: "Tournois",       icon: "🏆", href: "/tournaments",                desc: "Toutes les compétitions" },
];

// ─── Helper DTO match ────────────────────────────────────────────────────────
function toMatchCard(m: Awaited<ReturnType<typeof getMatches>>[number]) {
  return {
    id: m.id, name: m.name, status: m.status,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    game: m.game, tournament: m.tournament,
    teams: m.teams.map((t) => ({
      id: t.team.id, name: t.team.name, slug: t.team.slug,
      imageUrl: t.team.imageUrl, score: t.score, isWinner: t.isWinner,
    })),
  };
}

export default async function HomePage() {
  const [liveMatches, upcomingMatches, topTeams, topCompetitions] = await Promise.all([
    getMatches({ status: "running",     limit: 3 }),
    getMatches({ status: "not_started", limit: 6, offset: 0 }),
    getTeams({ limit: 8 }),
    prisma.competition.findMany({
      include: {
        game: { select: { slug: true, name: true } },
        _count: { select: { tournaments: true } },
      },
      orderBy: { tournaments: { _count: "desc" } },
      take: 6,
    }),
  ]);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-zinc-900 to-[var(--background)] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Tous tes matchs esport<br />
            <span className="text-[var(--primary)]">préférés au même endroit</span>
          </h1>
          <p className="text-[var(--muted)] text-sm sm:text-base mb-8 max-w-2xl mx-auto">
            Suis tes jeux, équipes et compétitions, retrouve les streams, scores, brackets
            et calendriers en quelques clics.
          </p>
          <div className="max-w-xl mx-auto">
            <Suspense>
              <GlobalSearch placeholder="Rechercher une équipe, compétition, tournoi…" />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── ACCÈS RAPIDES ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors text-center">
              <span className="text-2xl">{link.icon}</span>
              <p className="text-xs font-medium text-white">{link.label}</p>
              <p className="text-xs text-[var(--muted)] hidden sm:block">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">

        {/* ── MATCHS LIVE ──────────────────────────────────────────────────── */}
        {liveMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                En direct ({liveMatches.length})
              </h2>
              <Link href="/explore?status=running" className="text-sm text-[var(--primary)] hover:underline">Voir tout →</Link>
            </div>
            <div className="flex flex-col gap-3">
              {liveMatches.map((m) => <MatchCard key={m.id} match={toMatchCard(m)} />)}
            </div>
          </section>
        )}

        {/* ── MATCHS À VENIR ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">⏳ Prochains matchs</h2>
            <Link href="/explore?status=not_started" className="text-sm text-[var(--primary)] hover:underline">Voir tout →</Link>
          </div>
          {upcomingMatches.length === 0 ? (
            <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-center">
              <p className="text-[var(--muted)] text-sm">Aucun match à venir pour l&apos;instant.</p>
              <p className="text-[var(--muted)] text-xs mt-1">
                Lancez une{" "}
                <Link href="/api/sync/pandascore?game=league-of-legends" className="text-[var(--primary)] hover:underline">synchronisation</Link>
                {" "}pour mettre à jour les données.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingMatches.map((m) => <MatchCard key={m.id} match={toMatchCard(m)} />)}
            </div>
          )}
        </section>

        {/* ── COMPÉTITIONS POPULAIRES ──────────────────────────────────────── */}
        {topCompetitions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">🏆 Compétitions populaires</h2>
              <Link href="/tournaments" className="text-sm text-[var(--primary)] hover:underline">Voir tout →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {topCompetitions.map((c) => {
                const initials = c.name.slice(0, 3).toUpperCase();
                return (
                  <Link key={c.id} href={`/explore?competition=${c.slug}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
                    {c.imageUrl ? (
                      <Image src={c.imageUrl} alt={c.name} width={32} height={32}
                        className="rounded object-contain bg-zinc-800 shrink-0" />
                    ) : (
                      <span className="w-8 h-8 rounded bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">{initials}</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{c.name}</p>
                      <p className="text-xs text-[var(--muted)]">{c.game.name}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── ÉQUIPES POPULAIRES ────────────────────────────────────────────── */}
        {topTeams.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">👥 Équipes populaires</h2>
              <Link href="/teams" className="text-sm text-[var(--primary)] hover:underline">Voir tout →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {topTeams.map((t) => {
                const initials = t.name.slice(0, 2).toUpperCase();
                return (
                  <Link key={t.id} href={`/teams/${t.slug}`}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors text-center">
                    {t.imageUrl ? (
                      <Image src={t.imageUrl} alt={t.name} width={36} height={36}
                        className="rounded object-contain bg-zinc-800" />
                    ) : (
                      <span className="w-9 h-9 rounded bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">{initials}</span>
                    )}
                    <p className="text-xs font-medium text-white truncate w-full">{t.name}</p>
                    <StatusBadge status={t.game.slug} className="text-xs" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
