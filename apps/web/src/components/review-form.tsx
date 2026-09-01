"use client";

import type { Review } from "@tribuna/shared";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/rating-stars";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";

interface ReviewFormProps {
  matchId: string;
  existingReview?: Review | null;
  initialRating?: number | null;
  onSaved: (review: Review) => void;
  onCancel?: () => void;
}

export function ReviewForm({ matchId, existingReview, initialRating, onSaved, onCancel }: ReviewFormProps) {
  const [body, setBody] = useState(existingReview?.body ?? "");
  const [rating, setRating] = useState<number | null>(initialRating ?? existingReview?.rating ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError("Escreva algo antes de publicar.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const review = existingReview
        ? await api.patch<Review>(`/reviews/${existingReview.id}`, { body, rating })
        : await api.post<Review>("/reviews", { matchId, body, rating });
      onSaved(review);
      if (!existingReview) setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar sua review.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Sua nota</span>
        <RatingStars value={rating} onChange={setRating} size={28} />
      </div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="O que você achou dessa partida?"
        maxLength={4000}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : existingReview ? "Salvar alterações" : "Publicar review"}
        </Button>
      </div>
    </form>
  );
}
