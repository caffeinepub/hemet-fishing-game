import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface Props {
  onStart: (name: string) => void;
}

// Pre-computed star data to avoid array index keys
const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: `star-${Math.floor(i * 2.47 * 100) % 100}-${Math.floor(i * 1.73 * 100) % 55}`,
  width: `${1 + Math.sin(i * 2.3) * 1}px`,
  height: `${1 + Math.sin(i * 2.3) * 1}px`,
  left: `${(i * 2.47 * 100) % 100}%`,
  top: `${(i * 1.73 * 100) % 55}%`,
  opacity: 0.4 + Math.sin(i * 1.7) * 0.3,
}));

export default function StartScreen({ onStart }: Props) {
  const [name, setName] = useState("");

  const handleStart = () => {
    onStart(name.trim() || "Angler");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex flex-col items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/assets/generated/dvl-bg.dim_1200x400.jpg')`,
          filter: "brightness(0.35) saturate(1.2)",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/90" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {STARS.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              width: s.width,
              height: s.height,
              left: s.left,
              top: s.top,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 py-10 w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 animate-float">🎣</div>
          <h1 className="font-display text-5xl text-foreground leading-tight mb-1">
            Diamond Valley
          </h1>
          <h2 className="font-display text-3xl text-accent mb-3">Fishing</h2>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            📍 Hemet, California
          </p>
        </div>

        <div className="w-full bg-card/70 backdrop-blur-md border border-border/60 rounded-2xl p-4 mb-6 text-sm text-muted-foreground text-center leading-relaxed">
          <span className="text-accent font-semibold">Diamond Valley Lake</span>{" "}
          is Hemet's crown jewel — a 4,500-acre reservoir in the San Jacinto
          Valley teeming with bass, catfish, trout, and more. Cast your line and
          see what's biting today!
        </div>

        <div className="w-full mb-4">
          <Label
            htmlFor="player-name"
            className="text-muted-foreground text-sm mb-2 block"
          >
            Your angler name
          </Label>
          <Input
            id="player-name"
            data-ocid="start.input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="bg-card/60 backdrop-blur-sm border-border/70 text-foreground placeholder:text-muted-foreground/50 h-12 text-base"
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            maxLength={20}
          />
        </div>

        <Button
          data-ocid="start.primary_button"
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-blue rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          onClick={handleStart}
        >
          Cast a Line 🎣
        </Button>

        <p className="text-muted-foreground/50 text-xs mt-6 text-center">
          Tap the water to cast · Tap fast when you get a bite!
        </p>
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-muted-foreground/40 text-xs z-10">
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
  );
}
