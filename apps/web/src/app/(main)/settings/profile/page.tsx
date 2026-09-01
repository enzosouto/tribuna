"use client";

import { changePasswordSchema, updateProfileSchema } from "@tribuna/shared";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/avatar-upload";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api-client";

export default function SettingsProfilePage() {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", username: "", bio: "", avatarUrl: "" });
  const [profileMsg, setProfileMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        username: user.username,
        bio: user.bio ?? "",
        avatarUrl: user.avatarUrl ?? "",
      });
    }
  }, [user]);

  if (!user) return null;

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    const parsed = updateProfileSchema.safeParse({
      name: form.name,
      username: form.username,
      bio: form.bio.trim() ? form.bio.trim() : null,
      avatarUrl: form.avatarUrl.trim() ? form.avatarUrl.trim() : null,
    });
    if (!parsed.success) {
      setProfileMsg({ type: "error", text: parsed.error.issues[0]?.message ?? "Dados inválidos." });
      return;
    }
    setSavingProfile(true);
    try {
      await api.patch("/users/me", parsed.data);
      await refresh();
      setProfileMsg({ type: "success", text: "Perfil atualizado!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err instanceof ApiError ? err.message : "Erro ao salvar." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    const parsed = changePasswordSchema.safeParse(passwordForm);
    if (!parsed.success) {
      setPasswordMsg({ type: "error", text: "A nova senha deve ter pelo menos 8 caracteres." });
      return;
    }
    setSavingPassword(true);
    try {
      await api.post("/users/me/password", parsed.data);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordMsg({ type: "success", text: "Senha alterada!" });
    } catch (err) {
      setPasswordMsg({ type: "error", text: err instanceof ApiError ? err.message : "Erro ao alterar senha." });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="container max-w-2xl space-y-10 py-8">
      <div>
        <h1 className="font-display text-3xl tracking-wide">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie seu perfil e sua conta.</p>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex justify-center">
          <AvatarUpload
            name={form.name || user.name}
            value={form.avatarUrl || null}
            onChange={(url) => setForm((f) => ({ ...f, avatarUrl: url ?? "" }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Usuário</Label>
          <Input
            id="username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            maxLength={280}
          />
        </div>
        {profileMsg && (
          <p className={`text-sm ${profileMsg.type === "error" ? "text-destructive" : "text-primary"}`}>
            {profileMsg.text}
          </p>
        )}
        <Button type="submit" disabled={savingProfile}>
          {savingProfile ? "Salvando..." : "Salvar perfil"}
        </Button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl tracking-wide">Alterar senha</h2>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Senha atual</Label>
          <Input
            id="currentPassword"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nova senha</Label>
          <Input
            id="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
          />
        </div>
        {passwordMsg && (
          <p className={`text-sm ${passwordMsg.type === "error" ? "text-destructive" : "text-primary"}`}>
            {passwordMsg.text}
          </p>
        )}
        <Button type="submit" disabled={savingPassword}>
          {savingPassword ? "Salvando..." : "Alterar senha"}
        </Button>
      </form>
    </div>
  );
}
