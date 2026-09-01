import type { ListSummary } from "@tribuna/shared";
import { ListVideo } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export function ListCard({ list }: { list: ListSummary }) {
  return (
    <Link href={`/lists/${list.id}`}>
      <Card className="h-full p-4 transition-colors hover:border-primary/50">
        <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-secondary">
          <ListVideo className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="truncate font-medium">{list.name}</p>
        {list.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{list.description}</p>}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>por @{list.author?.username}</span>
          <span>
            {list.matchesCount} {list.matchesCount === 1 ? "partida" : "partidas"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
