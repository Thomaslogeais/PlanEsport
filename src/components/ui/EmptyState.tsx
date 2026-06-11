import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";
import Link from "next/link";

type Action = { label: string; href: string };

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: Action[];
};

export default function EmptyState({ title, description, icon: Icon = SearchX, actions }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: "var(--surface-2)", color: "var(--muted)" }}>
        <Icon size={22} />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>{title}</h3>
      {description && <p className="text-sm max-w-sm" style={{ color: "var(--muted)" }}>{description}</p>}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {actions.map((a) => (
            <Link key={a.href} href={a.href}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
