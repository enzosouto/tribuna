"use client";

import { listCreateSchema } from "@tribuna/shared";
import { Check, ListPlus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { api, fetcher } from "@/lib/api-client";

interface MyListItem {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  matchesCount: number;
  containsMatch: boolean;
}

export function AddToListButton({ matchId }: { matchId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data, mutate } = useSWR<MyListItem[]>(open ? `/lists/mine?matchId=${matchId}` : null, fetcher);

  function handleOpen() {
    if (!user) {
      router.push("/login");
      return;
    }
    setOpen(true);
  }

  async function toggle(list: MyListItem) {
    setPendingId(list.id);
    try {
      if (list.containsMatch) {
        await api.delete(`/lists/${list.id}/matches/${matchId}`);
      } else {
        await api.post(`/lists/${list.id}/matches`, { matchId });
      }
      await mutate();
    } finally {
      setPendingId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = listCreateSchema.safeParse({ name: newName, description: null });
    if (!parsed.success) {
      setError("Dê um nome para a lista.");
      return;
    }
    try {
      const list = await api.post<{ id: string }>("/lists", parsed.data);
      await api.post(`/lists/${list.id}/matches`, { matchId });
      setNewName("");
      setCreating(false);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a lista.");
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={handleOpen} className="gap-2">
        <ListPlus className="h-4 w-4" /> Adicionar à lista
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Adicionar à lista</DialogTitle>

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {data && data.length === 0 && !creating && (
              <p className="py-2 text-sm text-muted-foreground">Você ainda não tem nenhuma lista.</p>
            )}
            {data?.map((list) => (
              <button
                key={list.id}
                type="button"
                disabled={pendingId === list.id}
                onClick={() => toggle(list)}
                className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/50 disabled:opacity-50"
              >
                <span>
                  {list.name} <span className="text-muted-foreground">({list.matchesCount})</span>
                </span>
                {list.containsMatch && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>

          {creating ? (
            <form onSubmit={handleCreate} className="mt-3 flex gap-2">
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome da nova lista"
              />
              <Button type="submit" size="sm">
                Criar
              </Button>
            </form>
          ) : (
            <Button type="button" variant="ghost" size="sm" className="mt-3 gap-2" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Nova lista
            </Button>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
