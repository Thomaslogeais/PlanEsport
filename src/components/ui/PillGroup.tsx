"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type PillOption = { value: string; label: string; color?: string };

// ── Pill atomique avec hover ─────────────────────────────────────────────────
export function Pill({
  label, active, color, onClick,
}: { label: string; active: boolean; color?: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: active ? (color ?? "var(--primary)") : hovered ? "var(--surface-hover)" : "var(--surface-2)",
        color:            active ? "#fff"                       : hovered ? "var(--text)"          : "var(--muted-light)",
        border: `1px solid ${active ? (color ?? "var(--primary)") : hovered ? "var(--primary)" : "var(--border)"}`,
        transition: "background-color 120ms, color 120ms, border-color 120ms",
      }}
    >
      {label}
    </button>
  );
}

// ── PillGroup — multi-sélection liée à un query param ───────────────────────
type Props = {
  paramKey: string;        // clé URL, ex: "game" ou "status"
  options: PillOption[];   // options disponibles
  label?: string;          // label affiché à gauche, ex: "Jeu"
};

export default function PillGroup({ paramKey, options, label }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const raw      = searchParams.get(paramKey) ?? "";
  const selected = raw ? raw.split(",").filter(Boolean) : [];

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    const params = new URLSearchParams(searchParams.toString());
    params.delete("offset");
    if (next.length === 0) params.delete(paramKey);
    else params.set(paramKey, next.join(","));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {label && (
        <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>
          {label}
        </span>
      )}
      {options.map((opt) => (
        <Pill
          key={opt.value}
          label={opt.label}
          active={selected.includes(opt.value)}
          color={opt.color}
          onClick={() => toggle(opt.value)}
        />
      ))}
    </div>
  );
}
