import MatchCard, { type MatchCardDTO } from "./MatchCard";

type Props = { matches: MatchCardDTO[] };

export default function MatchList({ matches }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {matches.map((m) => <MatchCard key={m.id} match={m} />)}
    </div>
  );
}
