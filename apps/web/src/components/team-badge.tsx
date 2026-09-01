import type { Team } from "@tribuna/shared";
import Image from "next/image";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamBadgeProps {
  team: Team;
  size?: number;
  className?: string;
}

export function TeamBadge({ team, size = 32, className }: TeamBadgeProps) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary", className)}
      style={{ width: size, height: size }}
    >
      {team.crestUrl ? (
        <Image src={team.crestUrl} alt={team.name} width={size} height={size} className="object-contain" />
      ) : (
        <Shield className="text-muted-foreground" size={size * 0.55} />
      )}
    </div>
  );
}
