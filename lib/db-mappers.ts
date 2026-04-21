export interface DollRow {
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

export interface DollApi {
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
 * Map a DB doll row to the API doll shape (nulls → undefined, dates → ISO strings).
 */
export function rowToDoll(row: DollRow): DollApi {
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
