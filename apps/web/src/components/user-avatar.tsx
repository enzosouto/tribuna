import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  user: { name: string; avatarUrl?: string | null };
  size?: number;
  className?: string;
}

export function UserAvatar({ user, size = 40, className }: UserAvatarProps) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <Avatar style={{ width: size, height: size }} className={className}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
