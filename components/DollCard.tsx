"use client";

import type { Doll } from "@/lib/types";
import { getThumbnailUrl } from "@/lib/image-url";

interface DollCardProps {
  doll: Doll;
  onEdit: (id: string) => void;
  onImageClick?: (imageUrl: string) => void;
}

const paintLabels: Record<string, string> = {
  amalhama: "Амальгама",
  farba: "Фарба",
};

export function DollCard({ doll, onEdit, onImageClick }: DollCardProps) {
  const thumbUrl = getThumbnailUrl(doll.imageUrl);
  const canOpenFull = doll.imageUrl && onImageClick;

  return (
    <article className="group relative rounded-2xl border border-blush/40 bg-white/90 p-4 shadow-sm transition hover:border-rose/50 hover:shadow-md sm:p-4">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream sm:h-24 sm:w-24">
          {doll.imageUrl ? (
            <button
              type="button"
              onClick={() => canOpenFull && onImageClick(doll.imageUrl!)}
              className={`h-full w-full ${canOpenFull ? "cursor-zoom-in" : ""}`}
              aria-label={`Відкрити повне фото: ${doll.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl ?? doll.imageUrl}
                alt={doll.name}
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
            {doll.name}
          </h3>
          {(doll.line || doll.factory || doll.year) && (
            <p className="mt-0.5 text-sm text-mauve">
              {[doll.line, doll.factory, doll.year].filter(Boolean).join(" · ")}
            </p>
          )}
          {(doll.paint || doll.rarity) && (
            <span className="mt-1 inline-block rounded-full bg-blush/50 px-2 py-0.5 text-xs text-mauve">
              {[doll.paint ? paintLabels[doll.paint] : null, doll.rarity].filter(Boolean).join(" · ")}
            </span>
          )}
          {doll.notes && (
            <p className="mt-2 line-clamp-2 text-sm text-ink/80">{doll.notes}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(doll.id)}
          className="min-h-[44px] min-w-[72px] rounded-xl border border-mauve/30 bg-white px-4 py-2 text-sm text-mauve touch-manipulation hover:bg-mauve/10 active:bg-mauve/20"
        >
          Редагувати
        </button>
      </div>
    </article>
  );
}
