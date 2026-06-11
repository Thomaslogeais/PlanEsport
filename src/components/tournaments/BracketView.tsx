/**
 * Visualisation du bracket d'un tournoi
 * TODO (Étape 6) : implémenter le rendu du bracket depuis rawJson
 */
interface BracketViewProps {
  rawJson: Record<string, unknown>;
}

export function BracketView({ rawJson: _rawJson }: BracketViewProps) {
  return (
    <div className="p-8 text-center rounded-lg bg-[var(--surface)] border border-[var(--border)]">
      <p className="text-[var(--muted)] text-sm">
        Bracket — à implémenter (Étape 6)
      </p>
    </div>
  );
}
