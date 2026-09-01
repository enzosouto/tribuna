import type { MatchLineupEntry, Team } from "@tribuna/shared";
import { EmptyState } from "@/components/states";
import { TeamBadge } from "@/components/team-badge";

function TeamLineup({ team, entries }: { team: Team; entries: MatchLineupEntry[] }) {
  const starters = entries.filter((e) => e.role === "STARTER");
  const subs = entries.filter((e) => e.role === "SUBSTITUTE");

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <TeamBadge team={team} size={28} />
        <span className="font-medium">{team.name}</span>
      </div>
      <ul className="space-y-1.5 text-sm">
        {starters.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <span className="w-6 text-muted-foreground">{p.shirtNumber ?? "-"}</span>
            <span>{p.playerName}</span>
            {p.position && <span className="text-xs text-muted-foreground">({p.position})</span>}
          </li>
        ))}
      </ul>
      {subs.length > 0 && (
        <>
          <p className="mb-1.5 mt-3 text-xs font-medium text-muted-foreground">Reservas</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {subs.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="w-6">{p.shirtNumber ?? "-"}</span>
                <span>{p.playerName}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function MatchLineups({
  lineups,
  homeTeam,
  awayTeam,
}: {
  lineups: MatchLineupEntry[];
  homeTeam: Team;
  awayTeam: Team;
}) {
  if (lineups.length === 0) {
    return <EmptyState title="Escalações indisponíveis" description="As escalações desta partida ainda não foram registradas." />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <TeamLineup team={homeTeam} entries={lineups.filter((l) => l.teamId === homeTeam.id)} />
      <TeamLineup team={awayTeam} entries={lineups.filter((l) => l.teamId === awayTeam.id)} />
    </div>
  );
}
