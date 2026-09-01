"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FootballBackgroundProps {
  src?: string;
  objectPosition?: string;
  fade?: "bottom" | "full";
  overlayOpacity?: number;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Stadium-at-night backdrop built entirely from CSS (floodlight glow + mowed-pitch
 * stripes + vignette). Pass `src` to use a real photograph instead when one is available.
 */
export function FootballBackground({
  src,
  objectPosition = "center",
  fade = "bottom",
  overlayOpacity = 0.55,
  priority,
  className,
  children,
}: FootballBackgroundProps) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-black", className)}>
      {src ? (
        <>
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={priority}
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition }}
            />
          </motion.div>
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 60% at 50% 0%, rgba(198,255,61,0.16) 0%, rgba(198,255,61,0.05) 35%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 42px)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(80% 80% at 50% 35%, transparent 0%, rgba(0,0,0,0.7) 100%)",
            }}
          />
        </>
      )}
      <div
        className={cn(
          "absolute inset-0",
          fade === "bottom"
            ? "bg-gradient-to-b from-transparent via-black/70 to-black"
            : "bg-gradient-to-b from-black/40 via-black/70 to-black",
        )}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
