import type { Competition } from "@tribuna/shared";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export function CompetitionCard({ competition }: { competition: Competition }) {
  return (
    <Link href={`/explore?competitionId=${competition.id}`}>
      <Card className="flex items-center gap-3 p-4 transition-colors hover:border-primary/50">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{competition.name}</p>
          {competition.country && <p className="truncate text-xs text-muted-foreground">{competition.country}</p>}
        </div>
      </Card>
    </Link>
  );
}
