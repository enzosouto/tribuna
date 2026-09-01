"use client";

import { listCreateSchema } from "@tribuna/shared";
import type { ListSummary } from "@tribuna/shared";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListCard } from "@/components/list-card";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/states";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, fetcher } from "@/lib/api-client";

function CreateListDialog() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    const parsed = listCreateSchema.safeParse({
      name,
      description: description.trim() ? description.trim() : null,
    });
    if (!parsed.success) {
      setError("Dê um nome para sua lista.");
      return;
    }
    setLoading(true);
    try {
      const list = await api.post<ListSummary>("/lists", parsed.data);
      setOpen(false);
      router.push(`/lists/${list.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a lista.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nova lista
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Criar lista</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="listName">Nome</Label>
            <Input id="listName" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listDescription">Descrição (opcional)</Label>
            <Textarea id="listDescription" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar lista"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ListsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data, error, isLoading } = useSWR<{ items: ListSummary[] }>(
    user ? `/lists?username=${user.username}&pageSize=30` : null,
    fetcher,
  );

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  if (authLoading || !user) return null;

  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Minhas listas</h1>
          <p className="text-sm text-muted-foreground">Coleções de partidas que você criou.</p>
        </div>
        <CreateListDialog />
      </div>

      {isLoading && <GridSkeleton />}
      {error && <ErrorState message="Não foi possível carregar suas listas." />}
      {data && data.items.length === 0 && (
        <EmptyState title="Você ainda não criou nenhuma lista" description="Crie sua primeira lista de partidas." />
      )}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((l) => (
            <ListCard key={l.id} list={l} />
          ))}
        </div>
      )}
    </div>
  );
}
