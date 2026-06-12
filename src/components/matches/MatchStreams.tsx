import { Tv2, Play, ExternalLink } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type StreamEntry = {
  raw_url?: string | null;
  language?: string | null;
  main?: boolean;
  official?: boolean;
};

export type MatchStreamsProps = {
  /** Champ streams stocké en DB (Json?) */
  streams: unknown;
  /** rawJson complet du match pour fallback streams_list */
  rawJson: unknown;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrait une liste de StreamEntry depuis une valeur unknown. */
function extractStreams(value: unknown): StreamEntry[] {
  try {
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is StreamEntry =>
        typeof item === "object" && item !== null
    );
  } catch {
    return [];
  }
}

/** Détecte la plateforme depuis l'URL du stream. */
function detectPlatform(url: string): string {
  try {
    const lower = url.toLowerCase();
    if (lower.includes("twitch.tv")) return "Twitch";
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "YouTube";
    if (lower.includes("afreecatv.com")) return "AfreecaTV";
    if (lower.includes("bilibili.tv") || lower.includes("bilibili.com")) return "Bilibili";
    if (lower.includes("naver.com")) return "Naver";
    return "Stream";
  } catch {
    return "Stream";
  }
}

/** Icône par plateforme */
function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case "Twitch":  return <Tv2 size={13} />;
    case "YouTube": return <Play size={13} />;
    default:        return <ExternalLink size={13} />;
  }
}

/** Label affiché sur le badge de stream */
function streamLabel(entry: StreamEntry, platform: string): string {
  const parts: string[] = [platform];
  if (entry.language) parts.push(entry.language.toUpperCase());
  if (entry.official || entry.main) parts.push("Officiel");
  return parts.join(" · ");
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function MatchStreams({ streams, rawJson }: MatchStreamsProps) {
  // 1. Essayer d'abord les streams depuis la DB
  let entries = extractStreams(streams);

  // 2. Fallback sur rawJson.streams_list
  if (entries.length === 0) {
    try {
      if (typeof rawJson === "object" && rawJson !== null) {
        const r = rawJson as Record<string, unknown>;
        entries = extractStreams(r.streams_list);
      }
    } catch {
      // garde silencieuse
    }
  }

  // Filtrer les entrées sans URL
  const validEntries = entries.filter((e) => typeof e.raw_url === "string" && e.raw_url.length > 0);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6">
      <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-4">
        Streams
      </h2>

      {validEntries.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Aucun stream disponible pour ce match.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {validEntries.map((entry, i) => {
            const url = entry.raw_url as string;
            const platform = detectPlatform(url);
            const label = streamLabel(entry, platform);

            return (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                           text-white transition-colors hover:opacity-80"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <PlatformIcon platform={platform} />
                {label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
