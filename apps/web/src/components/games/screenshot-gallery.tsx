"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "radix-ui";

interface ScreenshotGalleryProps {
  screenshots: Array<{ url?: string | null; thumbnailUrl?: string | null }>;
  gameName: string;
}

export function ScreenshotGallery({
  screenshots,
  gameName,
}: ScreenshotGalleryProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

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

  // Keep the active thumbnail in view as the user navigates.
  // Skip the initial mount and scroll only the strip horizontally — otherwise
  // scrollIntoView would scroll the whole page down to reveal the thumbnails.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const strip = stripRef.current;
    const thumb = thumbRefs.current[currentIndex];
    if (!strip || !thumb) return;
    const target =
      thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2;
    strip.scrollTo({ left: target, behavior: "smooth" });
  }, [currentIndex]);

  const scrollStrip = (direction: -1 | 1) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const current = screenshots[currentIndex];
  const currentUrl = current?.url || current?.thumbnailUrl || "";

  if (screenshots.length === 0) return null;

  return (
    <>
      <div className="space-y-3">
        {/* Main preview */}
        <button
          type="button"
          className="group relative aspect-video w-full overflow-hidden rounded-lg bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setOpen(true)}
        >
          <Image
            src={currentUrl}
            alt={`${gameName} screenshot ${currentIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 800px"
            priority
          />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />

          {screenshots.length > 1 && (
            <>
              <span
                role="button"
                tabIndex={0}
                aria-label="Previous screenshot"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    prev();
                  }
                }}
              >
                <ChevronLeft className="size-5" />
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-label="Next screenshot"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    next();
                  }
                }}
              >
                <ChevronRight className="size-5" />
              </span>
              <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                {currentIndex + 1} / {screenshots.length}
              </span>
            </>
          )}
        </button>

        {/* Thumbnail strip */}
        {screenshots.length > 1 && (
          <div className="relative">
            <div
              ref={stripRef}
              className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {screenshots.map((s, i) => (
                <button
                  key={i}
                  ref={(el) => {
                    thumbRefs.current[i] = el;
                  }}
                  type="button"
                  aria-label={`Show screenshot ${i + 1}`}
                  aria-current={i === currentIndex}
                  className={`relative aspect-video h-20 shrink-0 overflow-hidden rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    i === currentIndex
                      ? "ring-2 ring-primary"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  onClick={() => setCurrentIndex(i)}
                >
                  <Image
                    src={s.thumbnailUrl || s.url || ""}
                    alt={`${gameName} thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                </button>
              ))}
            </div>

            {/* Strip scroll buttons (desktop) */}
            <button
              type="button"
              aria-label="Scroll thumbnails left"
              className="absolute left-0 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow-md hover:bg-background md:block"
              onClick={() => scrollStrip(-1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll thumbnails right"
              className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow-md hover:bg-background md:block"
              onClick={() => scrollStrip(1)}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen lightbox */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full border-none bg-black/95 p-0 [&>button]:hidden">
          <VisuallyHidden.Root>
            <DialogTitle>
              {gameName} screenshot {currentIndex + 1}
            </DialogTitle>
          </VisuallyHidden.Root>

          <div className="relative flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 text-white hover:bg-white/20"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </Button>

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

            <div className="relative aspect-video w-full">
              <Image
                src={currentUrl}
                alt={`${gameName} screenshot ${currentIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>

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

            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              {currentIndex + 1} / {screenshots.length}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
