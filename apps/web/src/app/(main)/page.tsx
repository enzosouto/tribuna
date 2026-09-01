"use client";

import type { MatchSummary, PaginatedResult, Review } from "@tribuna/shared";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { FootballBackground } from "@/components/football-background";
import { MatchCard } from "@/components/match-card";
import { ReviewCard } from "@/components/review-card";
import { SectionHeader } from "@/components/section-header";
import { EmptyState, GridSkeleton } from "@/components/states";
import { useAuth } from "@/lib/auth-context";
import { fetcher } from "@/lib/api-client";

const INTRO_DURATION_MS = 2600;

function SplashIntro() {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.55 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-4"
      >
        <Image src="/logo.png" alt="Tribuna" width={260} height={260} priority />
      </motion.div>
    </motion.div>
  );
}

function MatchesSection({ title, query, href }: { title: string; query: string; href: string }) {
  const { data, isLoading } = useSWR<PaginatedResult<MatchSummary>>(`/matches?${query}`, fetcher);
  return (
    <section>
      <SectionHeader title={title} href={href} />
      {isLoading && <GridSkeleton count={3} className="grid grid-cols-1 gap-4 sm:grid-cols-3" />}
      {data && data.items.length === 0 && <EmptyState title="Nenhuma partida encontrada" />}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {data.items.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewsSection({ title, query }: { title: string; query: string }) {
  const { data, isLoading } = useSWR<PaginatedResult<Review>>(`/reviews?${query}`, fetcher);
  return (
    <section>
      <SectionHeader title={title} />
      {isLoading && <GridSkeleton count={2} className="space-y-4" />}
      {data && data.items.length === 0 && (
        <EmptyState title="Nada por aqui ainda" description="As reviews aparecerão conforme a comunidade avaliar partidas." />
      )}
      {data && data.items.length > 0 && (
        <div className="rounded-2xl border border-border bg-card px-5">
          {data.items.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setShowIntro(false), INTRO_DURATION_MS);
    return () => clearTimeout(timeout);
  }, []);

  if (isLoading) return null;

  if (!user) {
    const container = {
      hidden: {},
      show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
    };
    const item = {
      hidden: { opacity: 0, y: 16 },
      show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
    };

    return (
      <>
        <AnimatePresence>{showIntro && <SplashIntro />}</AnimatePresence>

        <FootballBackground
          src="/images/splash.jpg"
          objectPosition="50% 40%"
          overlayOpacity={0.35}
          className="flex min-h-screen items-center justify-center px-4 text-center"
          priority
        >
          <motion.div
            className="flex flex-col items-center gap-6"
            variants={container}
            initial="hidden"
            animate={showIntro ? "hidden" : "show"}
          >
            <motion.div variants={item}>
              <Image src="/logo.png" alt="Tribuna" width={180} height={180} priority />
            </motion.div>
            <motion.p variants={item} className="max-w-md text-balance text-xl text-foreground/90 sm:text-2xl">
              Dê uma nota para seus jogos, veja opinião dos outros e compartilhe.
            </motion.p>
            <motion.div variants={item}>
              <Button size="lg" asChild>
                <Link href="/login">Começar</Link>
              </Button>
            </motion.div>
          </motion.div>
        </FootballBackground>
      </>
    );
  }

  return (
    <div className="container space-y-10 py-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide">
          Fala, <span className="text-primary">{user.name.split(" ")[0]}</span>
        </h1>
        <p className="text-sm text-muted-foreground">Veja o que rolou no mundo do futebol.</p>
      </div>
      <ReviewsSection title="Atividade de quem você segue" query="feed=following&pageSize=6" />
      <MatchesSection title="Partidas populares" query="sort=popular&pageSize=3" href="/explore" />
      <MatchesSection title="Avaliadas recentemente" query="sort=recent&status=FINISHED&pageSize=3" href="/explore" />
      <ReviewsSection title="Reviews recentes" query="pageSize=5" />
    </div>
  );
}
