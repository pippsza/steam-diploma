"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "radix-ui";
import { useTranslations } from "next-intl";

const CHUNK_SIZE = 4;

interface ScreenshotGalleryProps {
  screenshots: Array<{ url?: string | null; thumbnailUrl?: string | null }>;
  gameName: string;
}

export function ScreenshotGallery({
  screenshots,
  gameName,
}: ScreenshotGalleryProps) {
  const t = useTranslations("games");
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : screenshots.length - 1));
  }, [screenshots.length]);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i < screenshots.length - 1 ? i + 1 : 0));
  }, [screenshots.length]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, prev, next]);

  const openAt = (index: number) => {
    setCurrentIndex(index);
    setOpen(true);
  };

  const currentScreenshot = screenshots[currentIndex];
  const currentUrl =
    currentScreenshot?.url || currentScreenshot?.thumbnailUrl || "";

  const visibleScreenshots = screenshots.slice(0, visibleCount);
  const hasMore = visibleCount < screenshots.length;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleScreenshots.map((s, i) => (
          <button
            key={i}
            type="button"
            className="group relative aspect-video overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openAt(i)}
          >
            <Image
              src={s.url || s.thumbnailUrl || ""}
              alt={`${gameName} screenshot ${i + 1}`}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
          </button>
        ))}
      </div>

      {hasMore && (
        <Button
          variant="outline"
          className="mt-3 w-full"
          onClick={() => setVisibleCount((c) => c + CHUNK_SIZE)}
        >
          {t("showMore")} ({screenshots.length - visibleCount})
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full border-none bg-black/95 p-0 [&>button]:hidden">
          <VisuallyHidden.Root>
            <DialogTitle>
              {gameName} screenshot {currentIndex + 1}
            </DialogTitle>
          </VisuallyHidden.Root>

          <div className="relative flex items-center  justify-center">
            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 text-white hover:bg-white/20"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </Button>

            {/* Previous */}
            {screenshots.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={prev}
              >
                <ChevronLeft className="size-6" />
              </Button>
            )}

            {/* Image */}
            <div className="relative aspect-video w-full">
              <Image
                src={currentUrl}
                alt={`${gameName} screenshot ${currentIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Next */}
            {screenshots.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={next}
              >
                <ChevronRight className="size-6" />
              </Button>
            )}

            {/* Counter */}
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              {currentIndex + 1} / {screenshots.length}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
