import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas" });

export const metadata: Metadata = {
  metadataBase: new URL("https://tribuna-web.vercel.app"),
  title: "Tribuna",
  description: "Descubra partidas, avalie jogos, escreva reviews e acompanhe seu diário de futebol.",
  openGraph: {
    title: "Tribuna",
    description: "Descubra partidas, avalie jogos, escreva reviews e acompanhe seu diário de futebol.",
    images: [{ url: "/link.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tribuna",
    description: "Descubra partidas, avalie jogos, escreva reviews e acompanhe seu diário de futebol.",
    images: ["/link.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${bebas.variable}`}>
      <body className="min-h-screen bg-background font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
