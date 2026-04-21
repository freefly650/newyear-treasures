import type { Doll } from "./types";

export type DollSortKey =
  | "time_desc"
  | "time_asc"
  | "year_asc"
  | "year_desc"
  | "line_asc"
  | "title_asc";

function parseTime(d: Doll): number {
  // createdAt should always be present, but keep this robust for tests/edge-cases.
  return Number.isFinite(Date.parse(d.createdAt)) ? Date.parse(d.createdAt) : 0;
}

function compareStringsAsc(a: string, b: string) {
  return a.localeCompare(b, "uk", { sensitivity: "base" });
}

export function sortDolls(dolls: Doll[], sortKey: DollSortKey): Doll[] {
  return [...dolls].sort((a, b) => compareDolls(a, b, sortKey));
}

export function compareDolls(a: Doll, b: Doll, sortKey: DollSortKey): number {
  const createdAtCmpDesc = () => {
    const ta = parseTime(a);
    const tb = parseTime(b);
    if (ta !== tb) return tb - ta;
    return compareStringsAsc(a.name, b.name);
  };

  if (sortKey === "time_desc") {
    const ta = parseTime(a);
    const tb = parseTime(b);
    if (ta !== tb) return tb - ta;
    return compareStringsAsc(a.name, b.name);
  }

  if (sortKey === "time_asc") {
    const ta = parseTime(a);
    const tb = parseTime(b);
    if (ta !== tb) return ta - tb;
    return compareStringsAsc(a.name, b.name);
  }

  if (sortKey === "year_asc" || sortKey === "year_desc") {
    const hasYearA = a.year != null;
    const hasYearB = b.year != null;
    if (hasYearA !== hasYearB) return hasYearA ? -1 : 1;

    const yearA = a.year ?? "";
    const yearB = b.year ?? "";
    if (yearA !== yearB) {
      return sortKey === "year_asc"
        ? compareStringsAsc(yearA, yearB)
        : compareStringsAsc(yearB, yearA);
    }

    return createdAtCmpDesc();
  }

  if (sortKey === "title_asc") {
    const nameCmp = compareStringsAsc(a.name, b.name);
    if (nameCmp !== 0) return nameCmp;
    return createdAtCmpDesc();
  }

  if (sortKey === "line_asc") {
    const lineA = a.line?.trim();
    const lineB = b.line?.trim();
    const hasLineA = !!lineA;
    const hasLineB = !!lineB;

    // Missing line values go to the bottom.
    if (hasLineA !== hasLineB) return hasLineA ? -1 : 1;

    // Same line (or both missing): primary key is "line", secondary is "year".
    if (hasLineA && hasLineB) {
      const lineCmp = compareStringsAsc(lineA!, lineB!);
      if (lineCmp !== 0) return lineCmp;
    }

    // Within the same line group, order by year oldest->newest.
    const hasYearA = a.year != null;
    const hasYearB = b.year != null;
    if (hasYearA !== hasYearB) return hasYearA ? -1 : 1;

    const yearA = a.year ?? "";
    const yearB = b.year ?? "";
    if (yearA !== yearB) return compareStringsAsc(yearA, yearB);

    // Within identical (line,year) pairs, keep stable ordering.
    return createdAtCmpDesc();
  }

  // Exhaustiveness fallback
  return 0;
}

