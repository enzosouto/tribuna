"use client";

import { BookMarked, Compass, Home, ListChecks, ListVideo, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function MobileNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = [
    { href: "/", label: "Início", icon: Home },
    { href: "/explore", label: "Explorar", icon: Compass },
    { href: "/watchlist", label: "Watchlist", icon: BookMarked },
    { href: "/diary", label: "Diário", icon: ListVideo },
    { href: "/lists", label: "Listas", icon: ListChecks },
    { href: user ? `/users/${user.username}` : "/login", label: "Perfil", icon: UserIcon },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-black/95 backdrop-blur-md md:hidden">
      <div className="grid grid-cols-6">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-muted-foreground transition-colors",
                active && "text-primary",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
