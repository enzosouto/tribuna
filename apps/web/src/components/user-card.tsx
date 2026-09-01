import type { UserPublic } from "@tribuna/shared";
import Link from "next/link";
import { FollowButton } from "@/components/follow-button";
import { UserAvatar } from "@/components/user-avatar";

export function UserCard({ user }: { user: UserPublic }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <Link href={`/users/${user.username}`} className="flex min-w-0 items-center gap-3">
        <UserAvatar user={user} size={44} />
        <div className="min-w-0">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </Link>
      {user.isFollowedByViewer !== undefined && !user.isViewer && (
        <FollowButton username={user.username} initialFollowing={!!user.isFollowedByViewer} size="sm" />
      )}
    </div>
  );
}
