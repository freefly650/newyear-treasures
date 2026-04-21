import { describe, it, expect } from "vitest";
import { rowToToy } from "./db-mappers";

describe("rowToToy", () => {
  it("maps full row to API shape with nulls as undefined", () => {
    const row = {
      id: "id-1",
      name: "Barbie",
      line: "Collector",
      factory: null,
      year: "2020",
      paint: null,
      rarity: null,
      notes: "NIB",
      image_url: "https://example.com/img.jpg",
      created_at: new Date("2024-01-01T12:00:00.000Z"),
      updated_at: new Date("2024-01-02T12:00:00.000Z"),
    };
    const result = rowToToy(row);
    expect(result).toEqual({
      id: "id-1",
      name: "Barbie",
      line: "Collector",
      factory: undefined,
      year: "2020",
      paint: undefined,
      rarity: undefined,
      notes: "NIB",
      imageUrl: "https://example.com/img.jpg",
      createdAt: "2024-01-01T12:00:00.000Z",
      updatedAt: "2024-01-02T12:00:00.000Z",
    });
  });

  it("maps null optional fields to undefined", () => {
    const row = {
      id: "id-2",
      name: "Ken",
      line: null,
      year: null,
      factory: null,
      paint: null,
      rarity: null,
      notes: null,
      image_url: null,
      created_at: new Date("2024-02-01T00:00:00.000Z"),
      updated_at: new Date("2024-02-01T00:00:00.000Z"),
    };
    const result = rowToToy(row);
    expect(result).toEqual({
      id: "id-2",
      name: "Ken",
      line: undefined,
      year: undefined,
      factory: undefined,
      paint: undefined,
      rarity: undefined,
      notes: undefined,
      imageUrl: undefined,
      createdAt: "2024-02-01T00:00:00.000Z",
      updatedAt: "2024-02-01T00:00:00.000Z",
    });
  });

  it("uses camelCase for imageUrl, createdAt, updatedAt", () => {
    const row = {
      id: "x",
      name: "Toy",
      line: null,
      year: null,
      factory: null,
      paint: null,
      rarity: null,
      notes: null,
      image_url: "url",
      created_at: new Date(0),
      updated_at: new Date(1000),
    };
    const result = rowToToy(row);
    expect(result.imageUrl).toBe("url");
    expect(result.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(result.updatedAt).toBe("1970-01-01T00:00:01.000Z");
  });
});
