"use client";

import { registerSchema } from "@tribuna/shared";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/avatar-upload";
import { HexagonGallery } from "@/components/hexagon-gallery";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatarUrl: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse({
      ...form,
      avatarUrl: form.avatarUrl.trim() ? form.avatarUrl.trim() : null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados informados.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", parsed.data);
      await refresh();
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar sua conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-4 py-16">
      <HexagonGallery />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/70 to-black" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Image src="/logo.png" alt="Tribuna" width={120} height={120} priority />

        <h1 className="mt-4 font-display text-3xl tracking-wide">Criar conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre para a torcida</p>

        <form onSubmit={handleSubmit} className="mt-6 w-full space-y-3">
          <div className="flex justify-center pb-2">
            <AvatarUpload
              name={form.name}
              value={form.avatarUrl || null}
              onChange={(url) => update("avatarUrl", url ?? "")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => update("username", e.target.value.toLowerCase())}
              placeholder="seu_usuario"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <PasswordInput
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
