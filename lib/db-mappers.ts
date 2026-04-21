export interface ToyRow {
  id: string;
  name: string;
  line: string | null;
  factory: string | null;
  year: string | null;
  paint: string | null;
  rarity: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ToyApi {
  id: string;
  name: string;
  line?: string;
  factory?: string;
  year?: string;
  paint?: string;
  rarity?: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Map a DB toy row to the API toy shape (nulls → undefined, dates → ISO strings).
 */
export function rowToToy(row: ToyRow): ToyApi {
  return {
    id: row.id,
    name: row.name,
    line: row.line ?? undefined,
    factory: row.factory ?? undefined,
    year: row.year ?? undefined,
    paint: row.paint ?? undefined,
    rarity: row.rarity ?? undefined,
    notes: row.notes ?? undefined,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
