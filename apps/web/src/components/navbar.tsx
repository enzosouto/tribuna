"use client";

import { LogOut, Settings, Shield, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notification-bell";
import { SearchBar } from "@/components/search-bar";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/explore", label: "Explorar" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/diary", label: "Diário" },
  { href: "/lists", label: "Listas" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-black/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.png" alt="Tribuna" width={36} height={36} />
            <span className="font-display text-xl tracking-wide">Tribuna</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  pathname.startsWith(link.href) && "text-primary",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden flex-1 max-w-sm md:block">
          <SearchBar />
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && !user && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Criar conta</Link>
              </Button>
            </>
          )}
          {user && <NotificationBell />}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <UserAvatar user={user} size={36} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/users/${user.username}`}>
                    <UserIcon className="mr-2 h-4 w-4" /> Meu perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile">
                    <Settings className="mr-2 h-4 w-4" /> Configurações
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" /> Painel admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={async () => {
                    await logout();
                    window.location.href = "/";
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
