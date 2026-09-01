"use client";

import type { Notification } from "@tribuna/shared";
import { Bell } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { api, fetcher } from "@/lib/api-client";
import { formatDateShort } from "@/lib/utils";

export function NotificationBell() {
  const { data: count, mutate: mutateCount } = useSWR<{ count: number }>(
    "/notifications/unread-count",
    fetcher,
    { refreshInterval: 30_000 },
  );
  const { data: list, mutate: mutateList } = useSWR<Notification[]>(
    "/notifications",
    fetcher,
  );

  const unread = count?.count ?? 0;

  async function handleOpenChange(open: boolean) {
    if (open && unread > 0) {
      await api.post("/notifications/read");
      await Promise.all([mutateCount({ count: 0 }), mutateList()]);
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger className="relative rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">Notificações</div>
        <div className="max-h-96 overflow-y-auto">
          {!list && <p className="px-4 py-6 text-center text-sm text-muted-foreground">Carregando...</p>}
          {list && list.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação ainda
            </p>
          )}
          {list?.map((n) => (
            <Link
              key={n.id}
              href={`/users/${n.actor.username}`}
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary"
            >
              <UserAvatar user={n.actor} size={36} />
              <span className="flex-1">
                <span className="font-medium">{n.actor.name}</span>{" "}
                <span className="text-muted-foreground">começou a seguir você</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDateShort(n.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
