export type GameState =
  | "idle"
  | "casting"
  | "waiting"
  | "biting"
  | "reeling"
  | "caught"
  | "escaped";
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export interface FishSpecies {
  name: string;
  emoji: string;
  minWeight: number;
  maxWeight: number;
  points: number;
  rarity: number;
  times: TimeOfDay[];
}

export interface CaughtFish {
  species: FishSpecies;
  weight: number;
  points: number;
}

export interface SessionData {
  score: number;
  fishCount: number;
  catches: CaughtFish[];
  bestCatch: CaughtFish | null;
}

export interface SwimmingFish {
  x: number;
  y: number;
  vx: number;
  size: number;
  alpha: number;
}

export interface StarPoint {
  x: number;
  y: number;
  size: number;
  twinkle: number;
}

export interface Point {
  x: number;
  y: number;
}
