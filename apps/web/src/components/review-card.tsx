"use client";

import type { Review } from "@tribuna/shared";
import { Heart, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RatingStars } from "@/components/rating-stars";
import { TeamBadge } from "@/components/team-badge";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { cn, formatDateShort } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDeleted?: (id: string) => void;
  showMatch?: boolean;
}

export function ReviewCard({ review, onEdit, onDeleted, showMatch = true }: ReviewCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(review.likedByViewer);
  const [likesCount, setLikesCount] = useState(review.likesCount);
  const isAuthor = user?.id === review.user.id;

  async function toggleLike() {
    if (!user) {
      router.push("/login");
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));
    try {
      if (next) await api.post(`/reviews/${review.id}/like`);
      else await api.delete(`/reviews/${review.id}/like`);
    } catch {
      setLiked(!next);
      setLikesCount((c) => c + (next ? -1 : 1));
    }
  }

  async function handleDelete() {
    await api.delete(`/reviews/${review.id}`);
    onDeleted?.(review.id);
  }

  return (
    <div className="flex gap-3 border-b border-border/60 py-5 last:border-0">
      <Link href={`/users/${review.user.username}`} className="shrink-0">
        <UserAvatar user={review.user} size={40} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <Link href={`/users/${review.user.username}`} className="font-medium hover:underline">
              {review.user.name}
            </Link>
            <span className="text-sm text-muted-foreground">@{review.user.username}</span>
            {review.rating != null && <RatingStars value={review.rating} readOnly size={13} />}
          </div>
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit?.(review)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {showMatch && (
          <Link
            href={`/matches/${review.match.id}`}
            className="mt-2 flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-xs transition-colors hover:border-primary/50"
          >
            <TeamBadge team={review.match.homeTeam} size={20} />
            <span className="min-w-0 truncate font-medium text-foreground">
              {review.match.homeTeam.shortName ?? review.match.homeTeam.name}
              {review.match.homeScore !== null && review.match.awayScore !== null
                ? ` ${review.match.homeScore} × ${review.match.awayScore} `
                : " × "}
              {review.match.awayTeam.shortName ?? review.match.awayTeam.name}
            </span>
            <TeamBadge team={review.match.awayTeam} size={20} />
            <span className="ml-auto shrink-0 truncate text-muted-foreground">{review.match.competition.name}</span>
          </Link>
        )}

        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{review.body}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{formatDateShort(review.createdAt)}</span>
          <button
            type="button"
            onClick={toggleLike}
            className={cn("flex items-center gap-1.5 transition-colors hover:text-primary", liked && "text-primary")}
          >
            <Heart className={cn("h-3.5 w-3.5", liked && "fill-primary")} />
            {likesCount > 0 && likesCount}
          </button>
        </div>
      </div>
    </div>
  );
}
