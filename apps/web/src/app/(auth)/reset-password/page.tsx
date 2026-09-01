"use client";

import { resetPasswordSchema } from "@tribuna/shared";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = resetPasswordSchema.safeParse({ token, newPassword });
    if (!parsed.success) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", parsed.data);
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Link inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <p className="text-sm text-destructive">Link de redefinição inválido.</p>;
  }

  if (done) {
    return <p className="text-sm text-primary">Senha redefinida! Redirecionando para o login...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nova senha</Label>
        <PasswordInput
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <Image src="/logo.png" alt="Tribuna" width={128} height={128} priority />
      <h1 className="mt-4 font-display text-3xl tracking-wide">Nova senha</h1>
      <div className="mt-8 flex w-full flex-col items-center">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
      <Link href="/login" className="mt-6 text-sm text-muted-foreground hover:underline">
        Voltar para o login
      </Link>
    </div>
  );
}
