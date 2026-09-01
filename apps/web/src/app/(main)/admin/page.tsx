"use client";

import { Ban, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/states";
import { useAuth } from "@/lib/auth-context";
import { api, fetcher } from "@/lib/api-client";
import { cn, formatDateShort } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "banned";
  avatarUrl: string | null;
  createdAt: string;
  matchesCount: number;
  reviewsCount: number;
}

interface AdminUsersResponse {
  items: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQ(input);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [input]);

  const query = new URLSearchParams({ page: String(page), pageSize: "25" });
  if (q.trim()) query.set("q", q.trim());

  const { data, error, isLoading, mutate } = useSWR<AdminUsersResponse>(
    user?.role === "admin" ? `/admin/users?${query.toString()}` : null,
    fetcher,
  );

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [authLoading, user, router]);

  async function handleDelete(target: AdminUser) {
    if (!confirm(`Excluir a conta de @${target.username}? Essa ação não pode ser desfeita.`)) return;
    await api.delete(`/admin/users/${target.id}`);
    mutate();
  }

  async function handleBanToggle(target: AdminUser) {
    if (target.status === "banned") {
      await api.post(`/admin/users/${target.id}/unban`);
    } else {
      if (!confirm(`Banir @${target.username}? A conta vai perder acesso imediatamente.`)) return;
      await api.post(`/admin/users/${target.id}/ban`);
    }
    mutate();
  }

  if (authLoading || !user || user.role !== "admin") return null;

  return (
    <div className="container space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Painel admin</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} ${data.total === 1 ? "conta cadastrada" : "contas cadastradas"}` : "Carregando contas..."}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar por nome, usuário ou e-mail..."
            className="pl-10"
          />
        </div>
      </div>

      {isLoading && <GridSkeleton count={1} className="h-64 w-full rounded-2xl" />}
      {error && <ErrorState message="Não foi possível carregar as contas." />}
      {data && data.items.length === 0 && (
        <EmptyState title="Nenhuma conta encontrada" description={q ? `Nada bateu com "${q}".` : undefined} />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-card text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Cargo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Partidas</th>
                  <th className="px-4 py-3 font-medium">Reviews</th>
                  <th className="px-4 py-3 font-medium">Entrou em</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={u} size={28} />
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                          admin
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">usuário</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          u.status === "banned" ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {u.status === "banned" ? "banido" : "ativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.matchesCount}</td>
                    <td className="px-4 py-3">{u.reviewsCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateShort(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      {u.id !== user.id && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBanToggle(u)}
                            className="gap-1"
                            title={u.status === "banned" ? "Desbanir" : "Banir"}
                          >
                            {u.status === "banned" ? (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(u)}
                            className="gap-1 text-destructive hover:text-destructive"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {data.page} de {data.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
