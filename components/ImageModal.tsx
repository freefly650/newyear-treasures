"use client";

import { useEffect } from "react";

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, alt, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Full size image"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-ink shadow-lg hover:bg-white"
        aria-label="Close"
      >
        <span className="text-xl leading-none">×</span>
      </button>
      <img
        src={imageUrl}
        alt={alt}
        className="max-h-full max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
