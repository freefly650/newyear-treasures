"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCollection } from "@/lib/collection-store";
import { sortDolls, type DollSortKey } from "@/lib/doll-sorting";
import { DollCard } from "@/components/DollCard";
import { DollForm, type DollFormSavePayload } from "@/components/DollForm";
import { ImageModal } from "@/components/ImageModal";

export default function Home() {
  const {
    dolls,
    loading,
    error,
    reload,
    addDoll,
    updateDoll,
    deleteDoll,
    getDoll,
  } = useCollection();
  const [search, setSearch] = useState("");
  const [filterLine, setFilterLine] = useState("");
  const [sortKey, setSortKey] = useState<DollSortKey>("time_desc");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fullImage, setFullImage] = useState<{ url: string; alt: string } | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string | null } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (showForm || editingId) {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm, editingId]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setCurrentUser({ email: data.email, name: data.name }))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const lines = useMemo(() => {
    const set = new Set<string>();
    dolls.forEach((d) => d.line && set.add(d.line));
    return Array.from(set).sort();
  }, [dolls]);

  const filtered = useMemo(() => {
    let list = dolls;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.line?.toLowerCase().includes(q) ||
          d.notes?.toLowerCase().includes(q)
      );
    }
    if (filterLine) {
      list = list.filter((d) => d.line === filterLine);
    }
    return list;
  }, [dolls, search, filterLine]);

  const sorted = useMemo(() => sortDolls(filtered, sortKey), [filtered, sortKey]);

  const editingDoll = editingId ? getDoll(editingId) : null;

  const handleSave = async (payload: DollFormSavePayload) => {
    setSaveError(null);
    setSaving(true);
    try {
      if (editingId) {
        await updateDoll(
          editingId,
          payload.data,
          payload.imageFile,
          payload.removeImage
        );
        setEditingId(null);
      } else {
        await addDoll(payload.data, payload.imageFile);
        setShowForm(false);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoll(id);
      if (editingId === id) setEditingId(null);
    } catch {
      // could set error state
    }
  };

  if (loading && dolls.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-mauve">Завантаження колекції...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6 pb-10 safe-area-padding sm:px-6 sm:py-8">
      <header className="mb-6 sm:mb-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-normal text-ink sm:text-3xl">
            Новорічні Скарби
          </h1>
          <p className="mt-1 text-mauve text-sm sm:text-base">
            Ваша колекція ялинкових іграшок
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {currentUser && (
            <span className="text-sm text-mauve" title={currentUser.email}>
              {currentUser.name || currentUser.email}
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-mauve underline touch-manipulation hover:text-ink"
          >
            Вийти
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-rose/10 px-4 py-3 text-sm text-rose">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => reload()}
            className="shrink-0 font-medium underline touch-manipulation"
          >
            Спробувати знову
          </button>
        </div>
      )}

      {dolls.length > 0 && (
        <p className="mb-4 text-sm text-mauve">
          У колекції: {dolls.length}
        </p>
      )}

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Пошук..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[48px] w-full rounded-xl border border-blush/50 bg-white/80 px-4 py-3 text-ink placeholder:text-mauve/50 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20 touch-manipulation sm:max-w-xs"
            aria-label="Пошук по колекції"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as DollSortKey)}
            className="min-h-[48px] w-full rounded-xl border border-blush/50 bg-white/80 px-4 py-3 text-ink focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20 touch-manipulation sm:w-auto"
            aria-label="Сортування"
          >
            <option value="time_desc">За часом додавання (нові)</option>
            <option value="time_asc">За часом додавання (старі)</option>
            <option value="year_asc">За роком (старі)</option>
            <option value="year_desc">За роком (нові)</option>
            <option value="line_asc">Серія (А-Я)</option>
            <option value="title_asc">Назва (А-Я)</option>
          </select>
          <select
            value={filterLine}
            onChange={(e) => setFilterLine(e.target.value)}
            className="min-h-[48px] w-full rounded-xl border border-blush/50 bg-white/80 px-4 py-3 text-ink focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20 touch-manipulation sm:w-auto"
            aria-label="Фільтр за серією"
          >
            <option value="">Усі серії</option>
            {lines.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
            setSaveError(null);
          }}
          className="min-h-[48px] shrink-0 rounded-xl bg-rose px-5 py-3 text-sm font-medium text-white touch-manipulation hover:bg-rose/90 active:bg-rose/80"
        >
          Додати іграшку
        </button>
      </div>

      {(showForm || editingDoll) && (
        <div ref={formSectionRef} className="mb-8">
          <DollForm
            initial={editingDoll ?? undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
              setSaveError(null);
            }}
            onDelete={editingDoll ? handleDelete : undefined}
            saving={saving}
            saveError={saveError}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-blush/60 bg-white/50 py-12 text-center">
          {dolls.length === 0 ? (
            <>
              <p className="font-display text-lg text-ink">
                Колекція порожня
              </p>
              <p className="mt-1 text-sm text-mauve">
                Натисніть &quot;Додати іграшку&quot;, щоб створити перший запис.
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-lg text-ink">Нічого не знайдено</p>
              <p className="mt-1 text-sm text-mauve">
                Змініть пошуковий запит або фільтр.
              </p>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {sorted.map((doll) => (
            <li key={doll.id}>
              <DollCard
                doll={doll}
                onEdit={(id) => {
                  setShowForm(false);
                  setEditingId(id);
                  setSaveError(null);
                }}
                onImageClick={(url) => setFullImage({ url, alt: doll.name })}
              />
            </li>
          ))}
        </ul>
      )}

      {fullImage && (
        <ImageModal
          imageUrl={fullImage.url}
          alt={fullImage.alt}
          onClose={() => setFullImage(null)}
        />
      )}

    </div>
  );
}
