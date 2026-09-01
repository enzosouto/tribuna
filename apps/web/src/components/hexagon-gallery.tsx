"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface HexTile {
  src: string;
  position: string;
  top: string;
  left: string;
  size: number;
  delay: number;
}

const TILES: HexTile[] = [
  { src: "/images/hex-1.jpg", position: "50% 45%", top: "-4%", left: "8%", size: 260, delay: 0 },
  { src: "/images/hex-2.jpg", position: "50% 25%", top: "-8%", left: "56%", size: 240, delay: 0.08 },
  { src: "/images/hex-3.jpg", position: "50% 30%", top: "10%", left: "80%", size: 220, delay: 0.16 },
  { src: "/images/hex-4.jpg", position: "50% 35%", top: "30%", left: "-8%", size: 220, delay: 0.1 },
  { src: "/images/hex-5.jpg", position: "50% 20%", top: "58%", left: "78%", size: 240, delay: 0.2 },
  { src: "/images/hex-6.jpg", position: "50% 30%", top: "76%", left: "4%", size: 230, delay: 0.14 },
  { src: "/images/hex-1.jpg", position: "60% 55%", top: "80%", left: "48%", size: 200, delay: 0.24 },
];

const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

export function HexagonGallery() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* scaled down on small screens so the mosaic never overwhelms the form or causes overflow */}
      <div className="absolute inset-0 origin-center scale-[0.48] sm:scale-[0.75] md:scale-100">
        {TILES.map((tile, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: tile.delay, ease: "easeOut" }}
            className="absolute"
            style={{ top: tile.top, left: tile.left, width: tile.size, height: tile.size * 1.1 }}
          >
            <div className="relative h-full w-full" style={{ clipPath: HEX_CLIP }}>
              <Image
                src={tile.src}
                alt=""
                fill
                style={{ objectPosition: tile.position }}
                className="object-cover brightness-[0.55] saturate-[0.85]"
              />
              {/* normal (lighter) at the top, fading to fully dark at the bottom of each tile */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.9) 100%)",
                }}
              />
              <div className="absolute inset-0 border border-white/[0.06]" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
