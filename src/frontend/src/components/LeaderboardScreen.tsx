import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { useAddScore, useTopScores } from "../hooks/useQueries";
import type { SessionData } from "../types";

interface Props {
  sessionData: SessionData | null;
  playerName: string;
  onPlayAgain: () => void;
}

export default function LeaderboardScreen({
  sessionData,
  playerName,
  onPlayAgain,
}: Props) {
  const [name, setName] = useState(playerName);
  const [submitted, setSubmitted] = useState(false);

  const { data: scores, isLoading } = useTopScores();
  const { mutateAsync: addScore, isPending } = useAddScore();

  const handleSubmit = async () => {
    if (!sessionData || submitted) return;
    try {
      await addScore({
        playerName: name.trim() || "Angler",
        score: sessionData.score,
        fishCount: sessionData.fishCount,
      });
      setSubmitted(true);
      toast.success("Score submitted to the Diamond Valley leaderboard!");
    } catch {
      toast.error("Could not save score. Try again.");
    }
  };

  const formatDate = (ts: bigint) => {
    try {
      return new Date(Number(ts)).toLocaleDateString();
    } catch {
      return "";
    }
  };

  const skeletonKeys = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e"] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      <div
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{
          backgroundImage: `url('/assets/generated/dvl-bg.dim_1200x400.jpg')`,
          filter: "brightness(0.2) saturate(0.8)",
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background/80 to-background -z-10" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏆</div>
          <h1 className="font-display text-4xl text-foreground">Leaderboard</h1>
          <p className="text-muted-foreground text-sm">
            Diamond Valley Lake · Hemet, CA
          </p>
        </div>

        {sessionData && (
          <div className="bg-card/80 backdrop-blur-md border border-accent/30 rounded-2xl p-5 mb-5">
            <h2 className="font-display text-xl text-accent mb-3">
              Your Session
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {sessionData.score.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-xs">points</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {sessionData.fishCount}
                </p>
                <p className="text-muted-foreground text-xs">fish</p>
              </div>
              <div className="text-center">
                {sessionData.bestCatch ? (
                  <>
                    <p className="text-3xl font-bold text-foreground">
                      {sessionData.bestCatch.weight}
                    </p>
                    <p className="text-muted-foreground text-xs">lbs best</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-muted-foreground">
                      —
                    </p>
                    <p className="text-muted-foreground text-xs">no catch</p>
                  </>
                )}
              </div>
            </div>
            {sessionData.bestCatch && (
              <p className="text-muted-foreground text-sm text-center mb-3">
                Best catch: {sessionData.bestCatch.species.emoji}{" "}
                {sessionData.bestCatch.species.name} (
                {sessionData.bestCatch.weight} lbs)
              </p>
            )}
            {!submitted ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs mb-1 block">
                    Your name
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-card/60 border-border/70 text-foreground h-10"
                    maxLength={20}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || sessionData.fishCount === 0}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold h-11"
                >
                  {isPending
                    ? "Saving..."
                    : sessionData.fishCount === 0
                      ? "No fish caught"
                      : "Save to Leaderboard 🎣"}
                </Button>
              </div>
            ) : (
              <div className="text-center text-green-400 font-semibold py-2">
                ✓ Score saved!
              </div>
            )}
          </div>
        )}

        <div className="bg-card/70 backdrop-blur-md border border-border/50 rounded-2xl p-5 mb-5">
          <h2 className="font-display text-xl text-foreground mb-4">
            Top Anglers
          </h2>
          {isLoading ? (
            <div className="space-y-3" data-ocid="leaderboard.loading_state">
              {skeletonKeys.map((k) => (
                <Skeleton key={k} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <ol data-ocid="leaderboard.list" className="space-y-2">
              {(!scores || scores.length === 0) && (
                <li
                  data-ocid="leaderboard.empty_state"
                  className="text-muted-foreground text-sm text-center py-4"
                >
                  No scores yet — be the first! 🎣
                </li>
              )}
              {scores?.slice(0, 10).map((entry, i) => (
                <li
                  key={String(entry.timestamp)}
                  data-ocid={`leaderboard.item.${i + 1}`}
                  className="flex items-center gap-3 bg-secondary/50 rounded-xl px-3 py-2"
                >
                  <span className="text-lg font-bold w-7 text-center shrink-0">
                    {i === 0
                      ? "🥇"
                      : i === 1
                        ? "🥈"
                        : i === 2
                          ? "🥉"
                          : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-semibold text-sm truncate">
                      {entry.playerName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {Number(entry.fishCount)} fish ·{" "}
                      {formatDate(entry.timestamp)}
                    </p>
                  </div>
                  <span className="text-accent font-bold text-sm shrink-0">
                    {Number(entry.score).toLocaleString()} pts
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <Button
          data-ocid="leaderboard.primary_button"
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-glow-blue"
          onClick={onPlayAgain}
        >
          Cast Again 🎣
        </Button>

        <footer className="text-center text-muted-foreground/40 text-xs mt-6">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground/60 underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
