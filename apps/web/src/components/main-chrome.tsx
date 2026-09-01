"use client";

import { usePathname } from "next/navigation";
import { MobileNavbar } from "@/components/mobile-navbar";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function MainChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Anonymous visitors landing on "/" get a bare, full-bleed splash screen — no nav chrome.
  const bareSplash = pathname === "/" && !isLoading && !user;

  return (
    <>
      {!bareSplash && <Navbar />}
      <main className={cn("min-h-screen", !bareSplash && "pb-24 pt-16 md:pb-16")}>{children}</main>
      {!bareSplash && <MobileNavbar />}
    </>
  );
}
