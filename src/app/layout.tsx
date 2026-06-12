import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AuthButton } from "@/components/ui/AuthButton";
import { Providers } from "@/components/ui/Providers";
import { auth } from "@/auth";
import { Search, Compass, Swords, Trophy, Users, Calendar } from "lucide-react";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "PlanEsport", template: "%s | PlanEsport" },
  description: "Votre calendrier esport personnalisé. Suivez vos jeux, équipes et compétitions préférés.",
  keywords: ["esport", "calendrier", "matchs", "lol", "valorant", "rocket league"],
};

const NAV = [
  { href: "/explore",     label: "Explorer",   Icon: Compass },
  { href: "/matches",     label: "Matchs",     Icon: Swords },
  { href: "/tournaments", label: "Tournois",   Icon: Trophy },
  { href: "/teams",       label: "Équipes",    Icon: Users },
  { href: "/agenda",      label: "Mon Agenda", Icon: Calendar },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
          <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <header style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                  <span className="text-lg font-bold" style={{ color: "var(--text)" }}>
                    Plan<span style={{ color: "var(--primary)" }}>Esport</span>
                  </span>
                </Link>

                {/* Nav desktop */}
                <nav className="hidden md:flex items-center gap-1">
                  {NAV.map(({ href, label, Icon }) => (
                    <Link key={href} href={href} className="nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors">
                      <Icon size={14} />
                      {label}
                    </Link>
                  ))}
                </nav>

                {/* Right actions */}
                <div className="flex items-center gap-2">
                  <Link href="/explore" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm"
                    style={{ color: "var(--muted)" }}>
                    <Search size={14} />
                  </Link>
                  <ThemeToggle />
                  <AuthButton user={session?.user} />
                </div>
              </div>
            </header>

            {/* ── Main ─────────────────────────────────────────────────── */}
            <main className="flex-1">{children}</main>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <footer className="py-6 mt-auto" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
              <div className="max-w-7xl mx-auto px-4 text-center text-xs" style={{ color: "var(--muted)" }}>
                <p>
                  PlanEsport — Données par{" "}
                  <a href="https://pandascore.co" target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--primary)" }} className="hover:underline">PandaScore</a>
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
