import type { MatchStatistic, Team } from "@tribuna/shared";
import { EmptyState } from "@/components/states";

type NumericStatKey = Exclude<keyof MatchStatistic, "id" | "matchId" | "teamId">;

const ROWS: { key: NumericStatKey; label: string }[] = [
  { key: "possession", label: "Posse de bola (%)" },
  { key: "shots", label: "Finalizações" },
  { key: "shotsOnTarget", label: "Finalizações no gol" },
  { key: "corners", label: "Escanteios" },
  { key: "fouls", label: "Faltas" },
  { key: "yellowCards", label: "Cartões amarelos" },
  { key: "redCards", label: "Cartões vermelhos" },
  { key: "offsides", label: "Impedimentos" },
];

export function MatchStatistics({
  statistics,
  homeTeam,
  awayTeam,
}: {
  statistics: MatchStatistic[];
  homeTeam: Team;
  awayTeam: Team;
}) {
  const home = statistics.find((s) => s.teamId === homeTeam.id);
  const away = statistics.find((s) => s.teamId === awayTeam.id);

  if (!home && !away) {
    return <EmptyState title="Sem estatísticas disponíveis" description="As estatísticas desta partida ainda não foram registradas." />;
  }

  return (
    <div className="space-y-4">
      {ROWS.map((row) => {
        const homeValue = home?.[row.key] ?? null;
        const awayValue = away?.[row.key] ?? null;
        const total = (homeValue ?? 0) + (awayValue ?? 0);
        const homePercent = total > 0 ? ((homeValue ?? 0) / total) * 100 : 50;

        return (
          <div key={row.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="w-10 font-medium">{homeValue ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="w-10 text-right font-medium">{awayValue ?? "—"}</span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="bg-primary" style={{ width: `${homePercent}%` }} />
              <div className="flex-1 bg-muted-foreground/40" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
