"use client";

import { useState } from "react";
import { Star, MessageSquare, Plus, Trash2, Edit3, CheckCircle2, ShieldCheck, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitReview, deleteReview } from "@/app/actions/reviews";
import { toast } from "sonner";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string | Date;
  userId: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface PackageReviewsProps {
  packageId: string;
  packageTitle: string;
  reviews: ReviewItem[];
  currentUser: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

const RATING_LABELS: Record<number, string> = {
  5: "Exceptional",
  4: "Very Good",
  3: "Average",
  2: "Disappointing",
  1: "Poor",
};

export function PackageReviews({
  packageId,
  packageTitle,
  reviews: initialReviews,
  currentUser,
}: PackageReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check if current user already submitted a review
  const existingUserReview = currentUser
    ? reviews.find((r) => r.userId === currentUser.id)
    : null;

  // Form states
  const [rating, setRating] = useState<number>(existingUserReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>(existingUserReview?.title || "");
  const [comment, setComment] = useState<string>(existingUserReview?.comment || "");

  const handleOpenDialog = () => {
    if (existingUserReview) {
      setRating(existingUserReview.rating);
      setTitle(existingUserReview.title || "");
      setComment(existingUserReview.comment || "");
    } else {
      setRating(5);
      setTitle("");
      setComment("");
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSubmitting(true);
    try {
      const res = await submitReview({
        packageId,
        rating,
        title,
        comment,
      });

      if (res.error) {
        toast.error(res.error);
      } else if (res.review) {
        toast.success(
          existingUserReview
            ? "Your review has been updated!"
            : "Thank you! Your review has been published."
        );
        // Update local list
        setReviews((prev) => {
          const filtered = prev.filter((r) => r.userId !== currentUser.id);
          return [res.review as any, ...filtered];
        });
        setDialogOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    setDeletingId(reviewId);
    try {
      const res = await deleteReview(reviewId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Review deleted successfully.");
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  // Calculations
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : "5.0";

  // Rating breakdown (1 to 5)
  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.max(1, Math.min(5, Math.round(r.rating)));
    ratingCounts[star] = (ratingCounts[star] || 0) + 1;
  });

  const activeStar = hoverRating || rating;

  return (
    <div id="reviews" className="scroll-mt-24 space-y-6">
      {/* ── Main Reviews Card ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden sm:p-7 p-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Community Feedback
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
              Traveler Reviews &amp; Ratings
            </h2>
          </div>

          <div>
            {currentUser ? (
              <Button
                onClick={handleOpenDialog}
                size="sm"
                className="rounded-xl font-semibold gap-1.5 text-xs sm:text-sm cursor-pointer shadow-sm"
              >
                {existingUserReview ? (
                  <>
                    <Edit3 className="h-4 w-4" />
                    Edit Your Review
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Write a Review
                  </>
                )}
              </Button>
            ) : (
              <Link href={`/login?redirect=/packages/${packageId}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-semibold gap-1.5 text-xs sm:text-sm cursor-pointer border-slate-200"
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Sign In to Review
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid md:grid-cols-[220px_1fr] gap-8 py-6 border-b border-slate-100 items-center">
          {/* Big Score */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="text-5xl font-black font-display text-slate-900 tracking-tight">
              {avgRating}
            </span>
            <div className="flex items-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(Number(avgRating))
                      ? "fill-amber-400 text-amber-500"
                      : "text-slate-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Based on {totalReviews} verified {totalReviews === 1 ? "review" : "reviews"}
            </span>
          </div>

          {/* Distribution Bars */}
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingCounts[star] || 0;
              const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 text-slate-600 font-semibold shrink-0">
                    <span>{star}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                  </div>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-slate-400 font-medium shrink-0">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Reviews List ── */}
        <div className="pt-6 space-y-4">
          {reviews.length > 0 ? (
            reviews.map((rev) => {
              const isAuthor = currentUser?.id === rev.userId;
              const isAdmin = currentUser?.role === "ADMIN";

              return (
                <div
                  key={rev.id}
                  className="p-5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all space-y-3"
                >
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {rev.user?.image ? (
                        <img
                          src={rev.user.image}
                          alt={rev.user.name || "Traveler"}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                          {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : "T"}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {rev.user?.name || "Verified Traveler"}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            Verified Traveler
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDate(new Date(rev.createdAt))}
                        </span>
                      </div>
                    </div>

                    {/* Actions if author or admin */}
                    <div className="flex items-center gap-2">
                      {isAuthor && (
                        <button
                          type="button"
                          onClick={handleOpenDialog}
                          className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                      )}
                      {(isAuthor || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(rev.id)}
                          disabled={deletingId === rev.id}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-700 cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= rev.rating
                            ? "fill-amber-400 text-amber-500"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1.5">
                      {RATING_LABELS[rev.rating] || `${rev.rating} Stars`}
                    </span>
                  </div>

                  {/* Review Content */}
                  {rev.title && (
                    <h5 className="font-bold text-sm text-slate-900 leading-snug">
                      {rev.title}
                    </h5>
                  )}
                  {rev.comment && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {rev.comment}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No Reviews Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Be the first traveler to share your feedback and experience about {packageTitle}.
              </p>
              {currentUser && (
                <Button
                  onClick={handleOpenDialog}
                  size="sm"
                  variant="outline"
                  className="mt-2 text-xs rounded-xl cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Leave First Review
                </Button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── Write / Edit Review Modal Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-slate-900">
              {existingUserReview ? "Edit Your Review" : "Write a Review"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Share your genuine feedback on {packageTitle}. Verified reviews help fellow travelers make informed choices.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Star Rating Picker */}
            <div className="space-y-1.5 text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Overall Rating
              </label>
              <div className="flex items-center justify-center gap-2 my-1">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        starVal <= activeStar
                          ? "fill-amber-400 text-amber-500"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-primary block">
                {RATING_LABELS[activeStar] || `${activeStar} Stars`}
              </span>
            </div>

            {/* Title Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Review Headline
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unforgettable family experience!"
                className="h-10 text-sm bg-slate-50/50 border-slate-200 rounded-xl"
                maxLength={80}
              />
            </div>

            {/* Comment Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Your Feedback
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about the itinerary, tour guide, hotel stays, transport, or advice for travelers..."
                rows={4}
                className="text-sm bg-slate-50/50 border-slate-200 rounded-xl resize-none"
                maxLength={1000}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl text-xs cursor-pointer border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl text-xs font-bold cursor-pointer bg-primary text-white"
              >
                {submitting ? "Publishing..." : existingUserReview ? "Update Review" : "Publish Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
