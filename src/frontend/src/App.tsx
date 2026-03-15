import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import GameScreen from "./components/GameScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";
import StartScreen from "./components/StartScreen";
import type { SessionData } from "./types";

type Screen = "start" | "game" | "leaderboard";

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [playerName, setPlayerName] = useState("Angler");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  const handleStart = (name: string) => {
    setPlayerName(name.trim() || "Angler");
    setScreen("game");
  };

  const handleEndSession = (data: SessionData) => {
    setSessionData(data);
    setScreen("leaderboard");
  };

  const handlePlayAgain = () => {
    setSessionData(null);
    setScreen("start");
  };

  return (
    <>
      {screen === "start" && <StartScreen onStart={handleStart} />}
      {screen === "game" && (
        <GameScreen playerName={playerName} onEndSession={handleEndSession} />
      )}
      {screen === "leaderboard" && (
        <LeaderboardScreen
          sessionData={sessionData}
          playerName={playerName}
          onPlayAgain={handlePlayAgain}
        />
      )}
      <Toaster />
    </>
  );
}
