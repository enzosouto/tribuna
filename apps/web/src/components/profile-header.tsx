import type { UserPublic } from "@tribuna/shared";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/follow-button";
import { UserAvatar } from "@/components/user-avatar";
import { formatDateShort, formatRating } from "@/lib/utils";

const STATS: { key: keyof UserPublic; label: string }[] = [
  { key: "matchesCount", label: "Partidas" },
  { key: "reviewsCount", label: "Reviews" },
  { key: "followersCount", label: "Seguidores" },
  { key: "followingCount", label: "Seguindo" },
];

export function ProfileHeader({ user }: { user: UserPublic }) {
  return (
    <div className="border-b border-border/60 pb-6">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size={84} />
          <div>
            <h1 className="font-display text-3xl tracking-wide">{user.name}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Entrou em {formatDateShort(user.createdAt)}
            </p>
          </div>
        </div>
        {user.isViewer ? (
          <Button variant="outline" asChild>
            <Link href="/settings/profile">Editar perfil</Link>
          </Button>
        ) : (
          <FollowButton username={user.username} initialFollowing={!!user.isFollowedByViewer} />
        )}
      </div>

      {user.bio && <p className="mt-4 max-w-xl text-sm text-foreground/90">{user.bio}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {STATS.map((stat) => (
          <div key={stat.key} className="rounded-xl border border-border/60 bg-card p-3 text-center">
            <p className="font-display text-2xl text-primary">{user[stat.key] as number}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
        <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
          <p className="font-display text-2xl text-primary">{formatRating(user.averageRating)}</p>
          <p className="text-xs text-muted-foreground">Média</p>
        </div>
      </div>
    </div>
  );
}
