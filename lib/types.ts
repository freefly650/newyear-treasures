export type Paint = "amalhama" | "farba";
export type Rarity = "R" | "RR" | "RRR";

export interface Doll {
  id: string;
  name: string;
  line?: string;
  factory?: string;
  year?: string;
  paint?: Paint;
  rarity?: Rarity;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type DollFormData = Omit<Doll, "id" | "createdAt" | "updatedAt">;
