"use client";

import { useCallback, useEffect, useState } from "react";
import type { Doll, DollFormData } from "./types";

async function fetchDolls(): Promise<Doll[]> {
  const res = await fetch("/api/dolls");
  if (!res.ok) throw new Error("Failed to load collection");
  return res.json();
}

export function useCollection() {
  const [dolls, setDolls] = useState<Doll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchDolls();
      setDolls(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setDolls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addDoll = useCallback(
    async (data: DollFormData, imageFile?: File | null) => {
      const form = new FormData();
      form.set("name", data.name);
      if (data.line) form.set("line", data.line);
      if (data.factory) form.set("factory", data.factory);
      if (data.year) form.set("year", data.year);
      if (data.paint) form.set("paint", data.paint);
      if (data.rarity) form.set("rarity", data.rarity);
      if (data.notes) form.set("notes", data.notes);
      if (imageFile && imageFile.size > 0) form.set("image", imageFile);
      const res = await fetch("/api/dolls", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add doll");
      }
      const created = await res.json();
      setDolls((prev) => [created, ...prev]);
      return created.id;
    },
    []
  );

  const updateDoll = useCallback(
    async (
      id: string,
      data: Partial<DollFormData>,
      imageFile?: File | null,
      removeImage?: boolean
    ) => {
      const form = new FormData();
      form.set("name", data.name ?? "");
      form.set("line", (data.line ?? "") || "");
      form.set("factory", (data.factory ?? "") || "");
      form.set("year", data.year ?? "");
      form.set("paint", (data.paint ?? "") || "");
      form.set("rarity", (data.rarity ?? "") || "");
      form.set("notes", (data.notes ?? "") || "");
      if (removeImage) form.set("removeImage", "true");
      if (imageFile && imageFile.size > 0) form.set("image", imageFile);
      const res = await fetch(`/api/dolls/${id}`, {
        method: "PATCH",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update doll");
      }
      const updated = await res.json();
      setDolls((prev) =>
        prev.map((d) => (d.id === id ? updated : d))
      );
    },
    []
  );

  const deleteDoll = useCallback(async (id: string) => {
    const res = await fetch(`/api/dolls/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    setDolls((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const getDoll = useCallback(
    (id: string) => dolls.find((d) => d.id === id),
    [dolls]
  );

  return {
    dolls,
    loading,
    error,
    reload: load,
    addDoll,
    updateDoll,
    deleteDoll,
    getDoll,
  };
}
