"use client";

import { forgotPasswordSchema } from "@tribuna/shared";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ resetToken?: string }>("/auth/forgot-password", parsed.data);
      setSent(true);
      if (res.resetToken) {
        setResetLink(`/reset-password?token=${res.resetToken}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível processar o pedido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <Image src="/logo.png" alt="Tribuna" width={128} height={128} priority />
      <h1 className="mt-4 font-display text-3xl tracking-wide">Recuperar senha</h1>
      <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      {sent ? (
        <div className="mt-8 w-full max-w-sm space-y-3 text-center">
          <p className="text-sm text-foreground/90">
            Se esse e-mail estiver cadastrado, um link de redefinição foi gerado.
          </p>
          {resetLink && (
            <Link href={resetLink} className="block text-sm font-medium text-primary hover:underline">
              Ambiente de demonstração: abrir link de redefinição
            </Link>
          )}
          <Link href="/login" className="block text-sm text-muted-foreground hover:underline">
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link"}
          </Button>
        </form>
      )}
    </div>
  );
}
