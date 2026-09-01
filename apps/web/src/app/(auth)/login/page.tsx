"use client";

import { loginSchema } from "@tribuna/shared";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HexagonGallery } from "@/components/hexagon-gallery";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Verifique seu e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/login", parsed.data);
      await refresh();
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-4 py-16">
      <HexagonGallery />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/70 to-black" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Image src="/logo.png" alt="Tribuna" width={140} height={140} priority />

        <h1 className="mt-6 font-display text-3xl tracking-wide">Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Faça login para continuar</p>

        <form onSubmit={handleSubmit} className="mt-8 w-full space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
                <Link href="/forgot-password">Esqueceu a senha?</Link>
              </Button>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Login"}
          </Button>
          <Button type="button" variant="outline" className="w-full" asChild>
            <Link href="/forgot-password">Esqueci minha senha</Link>
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
