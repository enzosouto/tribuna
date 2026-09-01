"use client";

import type { ListDetail, MatchSummary } from "@tribuna/shared";
import { Plus, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MatchCard } from "@/components/match-card";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/states";
import { useAuth } from "@/lib/auth-context";
import { api, fetcher } from "@/lib/api-client";
import { formatDateShort } from "@/lib/utils";

function AddMatchDialog({ listId, onAdded }: { listId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data } = useSWR<{ matches: MatchSummary[] }>(
    q.trim().length > 1 ? `/search?q=${encodeURIComponent(q.trim())}` : null,
    fetcher,
  );

  async function add(matchId: string) {
    await api.post(`/lists/${listId}/matches`, { matchId });
    onAdded();
    setOpen(false);
    setQ("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar partida
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Adicionar partida</DialogTitle>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar partida por time..." autoFocus />
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
          {data?.matches.map((m) => (
            <button
              key={m.id}
              onClick={() => add(m.id)}
              className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-left text-sm hover:border-primary/50"
            >
              <span>
                {m.homeTeam.shortName ?? m.homeTeam.name} × {m.awayTeam.shortName ?? m.awayTeam.name}
              </span>
              <span className="text-xs text-muted-foreground">{formatDateShort(m.dateTime)}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ListDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: list, error, isLoading, mutate } = useSWR<ListDetail>(`/lists/${params.id}`, fetcher);

  if (isLoading) {
    return (
      <div className="container py-10">
        <GridSkeleton />
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="container py-10">
        <ErrorState message="Lista não encontrada." />
      </div>
    );
  }

  const isOwner = user?.id === list.author?.id;

  async function handleDeleteList() {
    if (!confirm("Excluir esta lista? Essa ação não pode ser desfeita.")) return;
    await api.delete(`/lists/${list!.id}`);
    router.push("/lists");
  }

  async function handleRemoveMatch(matchId: string) {
    await api.delete(`/lists/${list!.id}/matches/${matchId}`);
    mutate();
  }

  return (
    <div className="container space-y-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide">{list.name}</h1>
          {list.description && <p className="mt-1 max-w-xl text-sm text-muted-foreground">{list.description}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            por @{list.author?.username} · {list.matchesCount} {list.matchesCount === 1 ? "partida" : "partidas"}
          </p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <AddMatchDialog listId={list.id} onAdded={mutate} />
            <Button variant="destructive" size="sm" onClick={handleDeleteList} className="gap-2">
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </div>
        )}
      </div>

      {list.matches.length === 0 && (
        <EmptyState title="Nenhuma partida nesta lista" description={isOwner ? "Use o botão acima para adicionar partidas." : undefined} />
      )}

      {list.matches.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.matches.map((m) => (
            <div key={m.id} className="relative">
              <MatchCard match={m} />
              {isOwner && (
                <button
                  onClick={() => handleRemoveMatch(m.id)}
                  className="absolute right-3 top-3 rounded-full bg-black/70 p-1.5 text-white hover:bg-destructive"
                  aria-label="Remover da lista"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
