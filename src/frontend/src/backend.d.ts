import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ScoreEntry {
    score: bigint;
    fishCount: bigint;
    timestamp: bigint;
    playerName: string;
}
export interface backendInterface {
    addScore(playerName: string, score: bigint, fishCount: bigint, timestamp: bigint): Promise<void>;
    clearScores(): Promise<void>;
    getTopScores(): Promise<Array<ScoreEntry>>;
}
