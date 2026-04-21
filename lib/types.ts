export type Paint = "amalhama" | "farba";
export type Rarity = "R" | "RR" | "RRR";

export interface Toy {
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

export type ToyFormData = Omit<Toy, "id" | "createdAt" | "updatedAt">;
