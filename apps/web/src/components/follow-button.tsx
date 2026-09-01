"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";

interface FollowButtonProps {
  username: string;
  initialFollowing: boolean;
  size?: "sm" | "default";
}

export function FollowButton({ username, initialFollowing, size = "default" }: FollowButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (user?.username === username) return null;

  async function toggle() {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      if (following) {
        await api.delete(`/follows/${username}`);
        setFollowing(false);
      } else {
        await api.post("/follows", { username });
        setFollowing(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={toggle}
      disabled={loading}
      variant={following ? "secondary" : "default"}
      size={size}
    >
      {following ? "Seguindo" : "Seguir"}
    </Button>
  );
}
