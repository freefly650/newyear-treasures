"use client";

import { useState, useEffect, useRef } from "react";
import type { Doll, DollFormData, Paint, Rarity } from "@/lib/types";

const PAINTS: Paint[] = ["amalhama", "farba"];
const RARITIES: Rarity[] = ["R", "RR", "RRR"];

export interface DollFormSavePayload {
  data: DollFormData;
  imageFile?: File | null;
  removeImage?: boolean;
}

interface DollFormProps {
  initial?: Doll | null;
  onSave: (payload: DollFormSavePayload) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  saving?: boolean;
  saveError?: string | null;
}

const emptyForm: DollFormData = {
  name: "",
  line: "",
  factory: "",
  year: undefined,
  paint: undefined,
  rarity: undefined,
  notes: "",
  imageUrl: "",
};

export function DollForm({
  initial,
  onSave,
  onCancel,
  onDelete,
  saving = false,
  saveError = null,
}: DollFormProps) {
  const [form, setForm] = useState<DollFormData>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        line: initial.line ?? "",
        factory: initial.factory ?? "",
        year: initial.year,
        paint: initial.paint,
        rarity: initial.rarity,
        notes: initial.notes ?? "",
        imageUrl: initial.imageUrl ?? "",
      });
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
      setShowDeleteConfirm(false);
    } else {
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
      setShowDeleteConfirm(false);
    }
  }, [initial]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setRemoveImage(false);
    }
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const data: DollFormData = {
      ...form,
      name,
      line: form.line?.trim() || undefined,
      factory: form.factory?.trim() || undefined,
      year: form.year?.trim() || undefined,
      paint: form.paint,
      rarity: form.rarity,
      notes: form.notes?.trim() || undefined,
      imageUrl: form.imageUrl?.trim() || undefined,
    };
    onSave({ data, imageFile: imageFile ?? undefined, removeImage });
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-blush/50 bg-cream/50 px-4 py-3 text-ink placeholder:text-mauve/50 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20 min-h-[48px] touch-manipulation";
  const labelClass = "block text-sm font-medium text-mauve mb-1";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-blush/40 bg-white/90 p-5 shadow-sm sm:p-6"
    >
      <h2 className="font-display text-xl text-ink sm:text-2xl">
        {initial ? "Редагувати іграшку" : "Додати іграшку"}
      </h2>

      {/* Photo: camera on mobile, preview */}
      <div className="mt-5">
        <label className={labelClass}>Фото</label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-start gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Зробити або вибрати фото"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[48px] min-w-[120px] rounded-xl border-2 border-dashed border-blush bg-cream/50 px-4 py-3 text-sm text-mauve touch-manipulation active:bg-blush/20"
            >
              {imageFile ? "Змінити фото" : "Зробити / завантажити фото"}
            </button>
            {initial?.imageUrl && !imageFile && (
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 touch-manipulation">
                <input
                  type="checkbox"
                  checked={removeImage}
                  onChange={(e) => setRemoveImage(e.target.checked)}
                  className="rounded border-mauve/50 text-rose"
                />
                <span className="text-sm text-mauve">Видалити фото</span>
              </label>
            )}
          </div>
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-cream">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : initial?.imageUrl && !removeImage ? (
              <img
                src={initial.imageUrl}
                alt={initial.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-mauve/40 text-3xl">
                —
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="name" className={labelClass}>
            Назва *
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Напр. Кулька 'Сніжинка'"
            className={inputClass}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="line" className={labelClass}>
              Серія / Набір
            </label>
            <input
              id="line"
              type="text"
              value={form.line}
              onChange={(e) => setForm((f) => ({ ...f, line: e.target.value }))}
              placeholder="Напр. Новорічна колекція"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="factory" className={labelClass}>
              Фабрика
            </label>
            <input
              id="factory"
              type="text"
              value={form.factory}
              onChange={(e) => setForm((f) => ({ ...f, factory: e.target.value }))}
              placeholder="Напр. Клавдієво"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="year" className={labelClass}>
            Рік
          </label>
          <input
            id="year"
            type="text"
            value={form.year ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
            placeholder="Напр. 1985 або 80-ті"
            className={inputClass}
          />
        </div>
        <div>
          <span className={labelClass}>Покраска</span>
          <div className="mt-2 flex flex-wrap gap-3">
            {PAINTS.map((p) => (
              <label
                key={p}
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-2 touch-manipulation"
              >
                <input
                  type="radio"
                  name="paint"
                  checked={form.paint === p}
                  onChange={() => setForm((f) => ({ ...f, paint: p }))}
                  className="h-5 w-5 border-mauve/50 text-rose focus:ring-rose"
                />
                <span className="text-sm capitalize text-ink">
                  {p === "amalhama" ? "Амальгама" : "Фарба"}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <span className={labelClass}>Рідкість</span>
          <div className="mt-2 flex flex-wrap gap-3">
            {RARITIES.map((r) => (
              <label
                key={r}
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-2 touch-manipulation"
              >
                <input
                  type="radio"
                  name="rarity"
                  checked={form.rarity === r}
                  onChange={() => setForm((f) => ({ ...f, rarity: r }))}
                  className="h-5 w-5 border-mauve/50 text-rose focus:ring-rose"
                />
                <span className="text-sm capitalize text-ink">{r}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="notes" className={labelClass}>
            Нотатки
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Звідки іграшка, стан, деталі..."
            rows={3}
            className={`${inputClass} min-h-[100px] resize-y`}
          />
        </div>
      </div>

      {saveError && (
        <p className="mt-4 text-sm text-rose" role="alert">
          {saveError}
        </p>
      )}

      {showDeleteConfirm && initial && onDelete && (
        <div
          className="mt-6 rounded-xl border border-rose/40 bg-rose/5 p-4"
          role="alertdialog"
          aria-labelledby="delete-confirm-title"
          aria-describedby="delete-confirm-desc"
        >
          <p id="delete-confirm-title" className="font-medium text-ink">
            Ви впевнені, що хочете видалити?
          </p>
          <p id="delete-confirm-desc" className="mt-1 text-sm text-mauve">
            Іграшка буде видалена з колекції. Дію неможливо скасувати.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => onDelete(initial.id)}
              disabled={saving}
              className="min-h-[44px] rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white touch-manipulation hover:bg-rose/90 disabled:opacity-50"
            >
              Так
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={saving}
              className="min-h-[44px] rounded-xl border border-mauve/30 px-4 py-2 text-sm text-mauve touch-manipulation hover:bg-mauve/10 disabled:opacity-50"
            >
              Ні
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3">
        {initial && onDelete && !showDeleteConfirm && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
            className="min-h-[48px] rounded-xl border border-rose/30 px-5 py-3 text-sm text-rose touch-manipulation hover:bg-rose/10 disabled:opacity-50 sm:mr-auto"
          >
            Видалити
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="min-h-[48px] rounded-xl border border-mauve/30 px-5 py-3 text-sm text-mauve touch-manipulation hover:bg-mauve/10 disabled:opacity-50"
        >
          Скасувати
        </button>
        <button
          type="submit"
          disabled={saving}
          className="min-h-[48px] rounded-xl bg-rose px-5 py-3 text-sm font-medium text-white touch-manipulation hover:bg-rose/90 disabled:opacity-50"
        >
          {saving ? "Збереження..." : initial ? "Зберегти" : "Додати до колекції"}
        </button>
      </div>
    </form>
  );
}
