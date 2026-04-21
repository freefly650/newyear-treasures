"use client";

import type { Toy } from "@/lib/types";
import { getThumbnailUrl } from "@/lib/image-url";

interface ToyCardProps {
  toy: Toy;
  onEdit: (id: string) => void;
  onImageClick?: (imageUrl: string) => void;
}

const paintLabels: Record<string, string> = {
  amalhama: "Амальгама",
  farba: "Фарба",
};

export function ToyCard({ toy, onEdit, onImageClick }: ToyCardProps) {
  const thumbUrl = getThumbnailUrl(toy.imageUrl);
  const canOpenFull = toy.imageUrl && onImageClick;

  return (
    <article className="group relative rounded-2xl border border-blush/40 bg-white/90 p-4 shadow-sm transition hover:border-rose/50 hover:shadow-md sm:p-4">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream sm:h-24 sm:w-24">
          {toy.imageUrl ? (
            <button
              type="button"
              onClick={() => canOpenFull && onImageClick(toy.imageUrl!)}
              className={`h-full w-full ${canOpenFull ? "cursor-zoom-in" : ""}`}
              aria-label={`Відкрити повне фото: ${toy.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl ?? toy.imageUrl}
                alt={toy.name}
                className="h-full w-full object-cover"
              />
            </button>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-mauve/40 text-4xl">
              —
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-normal text-ink">
            {toy.name}
          </h3>
          {(toy.line || toy.factory || toy.year) && (
            <p className="mt-0.5 text-sm text-mauve">
              {[toy.line, toy.factory, toy.year].filter(Boolean).join(" · ")}
            </p>
          )}
          {(toy.paint || toy.rarity) && (
            <span className="mt-1 inline-block rounded-full bg-blush/50 px-2 py-0.5 text-xs text-mauve">
              {[toy.paint ? paintLabels[toy.paint] : null, toy.rarity].filter(Boolean).join(" · ")}
            </span>
          )}
          {toy.notes && (
            <p className="mt-2 line-clamp-2 text-sm text-ink/80">{toy.notes}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(toy.id)}
          className="min-h-[44px] min-w-[72px] rounded-xl border border-mauve/30 bg-white px-4 py-2 text-sm text-mauve touch-manipulation hover:bg-mauve/10 active:bg-mauve/20"
        >
          Редагувати
        </button>
      </div>
    </article>
  );
}
