"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface FavoriteButtonProps {
  packageId: string;
  initialFavorited?: boolean;
  className?: string;
}

export function FavoriteButton({
  packageId,
  initialFavorited = false,
  className = "",
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      try {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId }),
        });

        if (response.status === 401) {
          toast.error("Please login to save packages to your favorites.");
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to update favorite");
        }

        const data = await response.json();
        setFavorited(data.favorited);

        if (data.favorited) {
          toast.success("Package added to favorites!");
        } else {
          toast.info("Package removed from favorites.");
        }
        router.refresh();
      } catch (err: any) {
        toast.error("Could not update favorites. Try again.");
      }
    });
  };

  return (
    <motion.div whileTap={{ scale: 0.85 }} className={className}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={isPending}
        className={`h-9 w-9 rounded-full cursor-pointer bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border shadow-sm transition-colors hover:bg-white dark:hover:bg-zinc-900 ${
          favorited
            ? "text-pink-500 border-pink-500/20"
            : "text-zinc-500 hover:text-pink-500 border-zinc-200/50 dark:border-zinc-800/50"
        }`}
      >
        <Heart
          className={`h-4.5 w-4.5 transition-transform ${
            favorited ? "fill-pink-500 scale-110" : ""
          }`}
        />
      </Button>
    </motion.div>
  );
}
