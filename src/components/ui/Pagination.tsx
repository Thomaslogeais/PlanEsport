import Link from "next/link";

type Props = {
  total: number;
  limit: number;
  offset: number;
  basePath: string;              // ex: "/matches"
  extraParams?: Record<string, string>; // filtres à conserver
};

export default function Pagination({ total, limit, offset, basePath, extraParams = {} }: Props) {
  if (total <= limit) return null;

  const buildHref = (newOffset: number) => {
    const params = new URLSearchParams({
      ...extraParams,
      limit: String(limit),
      offset: String(newOffset),
    });
    return `${basePath}?${params.toString()}`;
  };

  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;
  const current = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

  const linkCls = "px-4 py-2 rounded text-sm font-medium transition-colors";
  const activeCls = `${linkCls} bg-[var(--surface)] text-white hover:bg-[var(--surface-hover)] border border-[var(--border)]`;
  const disabledCls = `${linkCls} text-[var(--muted)] cursor-not-allowed`;

  return (
    <div className="flex items-center justify-between mt-8">
      <span className="text-sm text-[var(--muted)]">
        {offset + 1}–{Math.min(offset + limit, total)} sur {total}
      </span>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link href={buildHref(Math.max(0, offset - limit))} className={activeCls}>
            ← Précédent
          </Link>
        ) : (
          <span className={disabledCls}>← Précédent</span>
        )}
        <span className="text-sm text-[var(--muted)] px-2">
          {current} / {pages}
        </span>
        {hasNext ? (
          <Link href={buildHref(offset + limit)} className={activeCls}>
            Suivant →
          </Link>
        ) : (
          <span className={disabledCls}>Suivant →</span>
        )}
      </div>
    </div>
  );
}
