import { describe, it, expect } from "vitest";
import type { Doll } from "@/lib/types";
import { sortToys, type DollSortKey } from "@/lib/doll-sorting";

function makeDoll(partial: Partial<Doll> & { id: string; name: string; createdAt: string }): Doll {
  return {
    id: partial.id,
    name: partial.name,
    createdAt: partial.createdAt,
    updatedAt: partial.updatedAt ?? partial.createdAt,
    line: partial.line,
    year: partial.year,
    paint: partial.paint,
    rarity: partial.rarity,
    notes: partial.notes,
    imageUrl: partial.imageUrl,
  };
}

function ids(toys: Doll[]) {
  return toys.map((d) => d.id);
}

describe("doll sorting", () => {
  it("sorts by time added newest first by default", () => {
    const toys = [
      makeDoll({ id: "1", name: "A", createdAt: "2024-01-01T00:00:00.000Z" }),
      makeDoll({ id: "2", name: "B", createdAt: "2024-02-01T00:00:00.000Z" }),
    ];

    expect(sortToys(toys, "time_desc")).toHaveLength(2);
    expect(ids(sortToys(toys, "time_desc"))).toEqual(["2", "1"]);
  });

  it("sorts by year oldest first and pushes missing years to the bottom", () => {
    const toys = [
      makeDoll({ id: "a", name: "A", createdAt: "2024-03-01T00:00:00.000Z", year: "2000" }),
      makeDoll({ id: "b", name: "B", createdAt: "2024-02-01T00:00:00.000Z" }),
      makeDoll({ id: "c", name: "C", createdAt: "2024-01-01T00:00:00.000Z", year: "1999" }),
    ];

    expect(ids(sortToys(toys, "year_asc"))).toEqual(["c", "a", "b"]);
  });

  it("sorts by line A-Z and orders year within the same line oldest->newest", () => {
    const toys = [
      // Same line ("A"), but createdAt order is intentionally mixed.
      makeDoll({ id: "p1", name: "P1", createdAt: "2024-03-01T00:00:00.000Z", line: "A", year: "2005" }),
      makeDoll({ id: "p2", name: "P2", createdAt: "2024-01-01T00:00:00.000Z", line: "A", year: "1990" }),
      makeDoll({ id: "p3", name: "P3", createdAt: "2024-02-01T00:00:00.000Z", line: "A" }), // missing year -> bottom within line group
      makeDoll({ id: "p4", name: "P4", createdAt: "2024-04-01T00:00:00.000Z", line: "B", year: "1980" }),
    ];

    expect(ids(sortToys(toys, "line_asc"))).toEqual(["p2", "p1", "p3", "p4"]);
  });

  it("pushes missing line values to the bottom for line sorting", () => {
    const toys = [
      makeDoll({ id: "withLine", name: "WithLine", createdAt: "2024-01-01T00:00:00.000Z", line: "A", year: "2000" }),
      makeDoll({ id: "noLine", name: "NoLine", createdAt: "2024-02-01T00:00:00.000Z", year: "1970" }),
    ];

    expect(ids(sortToys(toys, "line_asc"))).toEqual(["withLine", "noLine"]);
  });

  it("sorts by title A-Z", () => {
    const toys = [
      makeDoll({ id: "t1", name: "Zed", createdAt: "2024-01-01T00:00:00.000Z" }),
      makeDoll({ id: "t2", name: "Amy", createdAt: "2024-02-01T00:00:00.000Z" }),
    ];

    const key: DollSortKey = "title_asc";
    expect(ids(sortToys(toys, key))).toEqual(["t2", "t1"]);
  });
});

