"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Star, CheckCircle } from "lucide-react";

interface ReviewFormProps {
  customerId?: string;
  reviewToken?: string;
  portal?: boolean;
}

export function ReviewForm({ customerId, reviewToken, portal }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/public/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, reviewToken, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle className="h-10 w-10 text-green-500" />
        <p className="font-medium text-slate-900">Thanks for your review!</p>
        {rating >= 4 && (
          <p className="text-sm text-slate-500">
            Mind sharing it on Google? It helps us a lot.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Your Rating *</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-7 w-7 ${
                  star <= (hovered || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-slate-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700" htmlFor="comment">
          Comments (optional)
        </label>
        <textarea
          id="comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          placeholder="Tell us about your experience..."
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading || rating === 0}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Review
      </Button>
    </form>
  );
}
