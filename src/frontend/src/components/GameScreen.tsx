import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CaughtFish,
  FishSpecies,
  GameState,
  Point,
  SessionData,
  StarPoint,
  SwimmingFish,
  TimeOfDay,
} from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const FISH_SPECIES: FishSpecies[] = [
  {
    name: "Largemouth Bass",
    emoji: "🐟",
    minWeight: 1.5,
    maxWeight: 8,
    points: 100,
    rarity: 0.25,
    times: ["day", "dusk", "dawn"],
  },
  {
    name: "Channel Catfish",
    emoji: "🐠",
    minWeight: 2,
    maxWeight: 15,
    points: 150,
    rarity: 0.2,
    times: ["night", "dusk"],
  },
  {
    name: "Rainbow Trout",
    emoji: "🌈",
    minWeight: 0.5,
    maxWeight: 4,
    points: 120,
    rarity: 0.15,
    times: ["dawn", "day"],
  },
  {
    name: "Common Carp",
    emoji: "🐡",
    minWeight: 3,
    maxWeight: 20,
    points: 80,
    rarity: 0.25,
    times: ["day", "night"],
  },
  {
    name: "Bluegill",
    emoji: "🔵",
    minWeight: 0.2,
    maxWeight: 1.5,
    points: 50,
    rarity: 0.35,
    times: ["day", "dawn", "dusk"],
  },
  {
    name: "Striped Bass",
    emoji: "🎣",
    minWeight: 2,
    maxWeight: 12,
    points: 130,
    rarity: 0.1,
    times: ["dawn", "dusk"],
  },
];

const TIME_ICONS: Record<TimeOfDay, string> = {
  dawn: "🌅",
  day: "☀️",
  dusk: "🌆",
  night: "🌙",
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour < 4 || hour >= 21) return "night";
  if (hour < 7) return "dawn";
  if (hour < 18) return "day";
  return "dusk";
}

function formatGameTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  const ampm = h >= 12 ? "PM" : "AM";
  const dh = h % 12 || 12;
  return `${dh}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lerpColor(c1: string, c2: string, t: number): string {
  const tc = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const r = Math.round(r1 + (r2 - r1) * tc);
  const g = Math.round(g1 + (g2 - g1) * tc);
  const b = Math.round(b1 + (b2 - b1) * tc);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

interface SkyColors {
  top: string;
  bottom: string;
}

function getSkyColors(hour: number): SkyColors {
  const kf = [
    { h: 0, top: "#010510", bottom: "#060E1C" },
    { h: 4.5, top: "#1A0820", bottom: "#3A0A10" },
    { h: 5.5, top: "#8B2500", bottom: "#FF5820" },
    { h: 7, top: "#5890D0", bottom: "#85C0E8" },
    { h: 12, top: "#3578C8", bottom: "#78B8E8" },
    { h: 17, top: "#4578B0", bottom: "#A8C8E0" },
    { h: 18.5, top: "#7A1A80", bottom: "#FF4500" },
    { h: 20, top: "#2A0840", bottom: "#8A1010" },
    { h: 21.5, top: "#040818", bottom: "#0A0E20" },
    { h: 24, top: "#010510", bottom: "#060E1C" },
  ];
  let prev = kf[0];
  let next = kf[kf.length - 1];
  for (let i = 0; i < kf.length - 1; i++) {
    if (hour >= kf[i].h && hour < kf[i + 1].h) {
      prev = kf[i];
      next = kf[i + 1];
      break;
    }
  }
  const t = next.h > prev.h ? (hour - prev.h) / (next.h - prev.h) : 0;
  return {
    top: lerpColor(prev.top, next.top, t),
    bottom: lerpColor(prev.bottom, next.bottom, t),
  };
}

function getWaterColor(hour: number): [string, string] {
  if (hour < 5 || hour >= 21) return ["#071828", "#020810"];
  if (hour < 7) return ["#1A4060", "#0A1C30"];
  if (hour < 18) return ["#1E7AC0", "#0D3A6C"];
  return ["#1A3060", "#080E28"];
}

function generateMountainPoints(w: number, h: number): Point[] {
  const waterY = h * 0.63;
  const baseY = waterY * 0.92;
  const peakRange = waterY * 0.6;
  const defs = [
    { x: 0, yf: 0 },
    { x: 0.04, yf: 0.32 },
    { x: 0.1, yf: 0.62 },
    { x: 0.15, yf: 0.45 },
    { x: 0.22, yf: 0.88 },
    { x: 0.27, yf: 0.78 },
    { x: 0.31, yf: 0.96 },
    { x: 0.35, yf: 0.84 },
    { x: 0.4, yf: 0.7 },
    { x: 0.45, yf: 0.55 },
    { x: 0.52, yf: 0.42 },
    { x: 0.58, yf: 0.6 },
    { x: 0.64, yf: 0.48 },
    { x: 0.7, yf: 0.35 },
    { x: 0.78, yf: 0.28 },
    { x: 0.86, yf: 0.2 },
    { x: 0.93, yf: 0.14 },
    { x: 1.0, yf: 0.08 },
  ];
  const pts: Point[] = [{ x: 0, y: baseY }];
  for (const d of defs) {
    pts.push({ x: d.x * w, y: baseY - peakRange * d.yf });
  }
  pts.push({ x: w, y: baseY });
  return pts;
}

function generateSwimmingFish(w: number, h: number): SwimmingFish[] {
  const waterY = h * 0.63;
  return Array.from({ length: 12 }, () => ({
    x: Math.random() * w,
    y: waterY + 40 + Math.random() * (h - waterY - 70),
    vx: (Math.random() < 0.5 ? 1 : -1) * (18 + Math.random() * 28),
    size: 10 + Math.random() * 16,
    alpha: 0.06 + Math.random() * 0.1,
  }));
}

function generateStars(w: number, h: number): StarPoint[] {
  const waterY = h * 0.63;
  return Array.from({ length: 130 }, () => ({
    x: Math.random() * w,
    y: Math.random() * waterY * 0.95,
    size: 0.5 + Math.random() * 1.5,
    twinkle: Math.random() * Math.PI * 2,
  }));
}

function getPlayerLayout(w: number, h: number) {
  const waterY = h * 0.63;
  const dockEndX = Math.min(175, w * 0.19);
  const sx = dockEndX - 18;
  const sy = waterY - 18;
  const rodTipX = sx + 62;
  const rodTipY = sy - 62;
  return { waterY, dockEndX, sx, sy, rodTipX, rodTipY };
}

function generateCatch(gameMinutes: number): CaughtFish {
  const hour = gameMinutes / 60;
  const tod = getTimeOfDay(hour);
  const available = FISH_SPECIES.filter((f) => f.times.includes(tod));
  const pool = available.length > 0 ? available : FISH_SPECIES;
  const totalRarity = pool.reduce((s, f) => s + f.rarity, 0);
  let rand = Math.random() * totalRarity;
  let selected = pool[0];
  for (const f of pool) {
    rand -= f.rarity;
    if (rand <= 0) {
      selected = f;
      break;
    }
  }
  const weight =
    Math.round(
      (selected.minWeight +
        Math.random() * (selected.maxWeight - selected.minWeight)) *
        10,
    ) / 10;
  const avg = (selected.minWeight + selected.maxWeight) / 2;
  const points = Math.round(selected.points * (weight / avg));
  return { species: selected, weight, points };
}

// ─── Canvas Draw Functions ────────────────────────────────────────────────────

function drawSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hour: number,
) {
  const { top, bottom } = getSkyColors(hour);
  const g = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h * 0.65);
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: StarPoint[],
  hour: number,
  timestamp: number,
) {
  let starAlpha = 0;
  if (hour < 5) starAlpha = 1;
  else if (hour < 7) starAlpha = 1 - (hour - 5) / 2;
  else if (hour >= 21) starAlpha = 1;
  else if (hour >= 20) starAlpha = (hour - 20) / 1.5;
  if (starAlpha <= 0.01) return;
  const t = timestamp / 1000;
  ctx.save();
  for (const s of stars) {
    const tw = 0.6 + 0.4 * Math.sin(t * 2.1 + s.twinkle);
    ctx.globalAlpha = starAlpha * tw * 0.85;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMountains(
  ctx: CanvasRenderingContext2D,
  _w: number,
  h: number,
  pts: Point[],
  hour: number,
) {
  if (pts.length < 3) return;
  const waterY = h * 0.63;
  const darkness = hour >= 20 || hour < 6 ? 0.7 : 0.0;
  const mtTop =
    darkness > 0 ? lerpColor("#2A2040", "#0A0818", darkness) : "#2A2040";
  const mtBot =
    darkness > 0 ? lerpColor("#3D3050", "#141028", darkness) : "#3D3050";
  const g = ctx.createLinearGradient(0, 0, 0, waterY);
  g.addColorStop(0, mtTop);
  g.addColorStop(1, mtBot);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1)) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(220, 210, 240, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1)) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

function drawDesert(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const waterY = h * 0.63;
  const desertTop = waterY * 0.87;
  const g = ctx.createLinearGradient(0, desertTop, 0, waterY);
  g.addColorStop(0, "#C4A882");
  g.addColorStop(1, "#A8855A");
  ctx.fillStyle = g;
  ctx.fillRect(0, desertTop, w, waterY - desertTop);
  const numBrush = Math.max(6, Math.floor(w / 55));
  ctx.fillStyle = "#6A7A48";
  for (let i = 0; i < numBrush; i++) {
    const bx = (i + 0.5) * (w / numBrush) + Math.sin(i * 2.3) * 18;
    const by = desertTop + (waterY - desertTop) * 0.3 + Math.sin(i * 1.7) * 4;
    const br = 5 + Math.sin(i * 1.3) * 3;
    ctx.beginPath();
    ctx.arc(bx, by, Math.max(3, br), Math.PI, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx + 10, by + 2, Math.max(2, br * 0.6), Math.PI, 2 * Math.PI);
    ctx.fill();
  }
}

function drawWater(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hour: number,
  timestamp: number,
) {
  const waterY = h * 0.63;
  const [wTop, wBot] = getWaterColor(hour);
  const g = ctx.createLinearGradient(0, waterY, 0, h);
  g.addColorStop(0, wTop);
  g.addColorStop(1, wBot);
  ctx.fillStyle = g;
  const t = timestamp / 1000;
  ctx.beginPath();
  ctx.moveTo(0, waterY);
  for (let x = 0; x <= w; x += 3) {
    const y =
      waterY +
      Math.sin(x * 0.018 + t * 1.1) * 3.5 +
      Math.sin(x * 0.032 + t * 0.75) * 2 +
      Math.sin(x * 0.009 + t * 1.9) * 1.5;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const phase = (i * 0.16 + t * 0.04) % 1;
    const sx = phase * w;
    const sy = waterY + 25 + Math.sin(i * 1.4) * 15;
    ctx.globalAlpha = 0.07 + 0.05 * Math.sin(t * 2 + i);
    ctx.fillStyle = "#AADDFF";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 55 + i * 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWaterLabel(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const waterY = h * 0.63;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `italic ${Math.max(12, Math.floor(w * 0.022))}px serif`;
  ctx.textAlign = "center";
  ctx.fillText("◆ Diamond Valley Lake ◆", w / 2, waterY + 55);
  ctx.restore();
}

function drawDockAndPlayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const { waterY, dockEndX, sx, sy, rodTipX, rodTipY } = getPlayerLayout(w, h);
  ctx.fillStyle = "#6A4C2A";
  const posts = [
    20,
    Math.floor(dockEndX * 0.4),
    Math.floor(dockEndX * 0.7),
    dockEndX - 5,
  ];
  for (const px of posts) {
    ctx.fillRect(px - 5, waterY - 5, 10, h - waterY + 5);
  }
  const dg = ctx.createLinearGradient(0, waterY - 20, 0, waterY);
  dg.addColorStop(0, "#A0784A");
  dg.addColorStop(1, "#8A6035");
  ctx.fillStyle = dg;
  ctx.fillRect(0, waterY - 20, dockEndX + 8, 20);
  ctx.strokeStyle = "#6A4C2A";
  ctx.lineWidth = 1;
  for (let px = 20; px < dockEndX + 6; px += 22) {
    ctx.beginPath();
    ctx.moveTo(px, waterY - 20);
    ctx.lineTo(px, waterY);
    ctx.stroke();
  }
  ctx.fillStyle = "#1A0E06";
  ctx.strokeStyle = "#1A0E06";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx, sy - 10, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3A2010";
  ctx.beginPath();
  ctx.ellipse(sx, sy - 17, 12, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(sx - 7, sy - 24, 14, 9);
  ctx.fillStyle = "#1A0E06";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#1A0E06";
  ctx.beginPath();
  ctx.moveTo(sx, sy - 2);
  ctx.lineTo(sx, sy + 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx, sy + 18);
  ctx.lineTo(sx - 7, sy + 34);
  ctx.moveTo(sx, sy + 18);
  ctx.lineTo(sx + 6, sy + 34);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx, sy + 5);
  ctx.lineTo(sx + 20, sy - 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx, sy + 5);
  ctx.lineTo(sx - 8, sy + 14);
  ctx.stroke();
  ctx.strokeStyle = "#5A3A1A";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(sx + 20, sy - 3);
  ctx.lineTo(rodTipX, rodTipY);
  ctx.stroke();
}

function drawSwimmingFish(
  ctx: CanvasRenderingContext2D,
  fish: SwimmingFish[],
  waterY: number,
) {
  ctx.save();
  for (const f of fish) {
    const facingRight = f.vx > 0;
    ctx.globalAlpha = f.alpha;
    ctx.fillStyle = "#A8D4F0";
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, f.size, f.size * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    const tailX = facingRight ? f.x - f.size : f.x + f.size;
    const td = facingRight ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(tailX, f.y);
    ctx.lineTo(tailX + td * f.size * 0.45, f.y - f.size * 0.32);
    ctx.lineTo(tailX + td * f.size * 0.45, f.y + f.size * 0.32);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  const [wTop] = getWaterColor(12);
  ctx.fillStyle = wTop;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0, waterY, ctx.canvas.width, ctx.canvas.height - waterY);
  ctx.restore();
}

function drawFishingLine(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: GameState,
  castProgress: number,
  castTargetX: number,
  timestamp: number,
) {
  const { waterY, rodTipX, rodTipY } = getPlayerLayout(w, h);
  ctx.strokeStyle = "rgba(220, 220, 220, 0.7)";
  ctx.lineWidth = 1.2;

  if (state === "casting") {
    const t = castProgress;
    const mt = 1 - t;
    const midX = (rodTipX + castTargetX) / 2;
    const midY = rodTipY - 130;
    const bx = mt * mt * rodTipX + 2 * mt * t * midX + t * t * castTargetX;
    const by = mt * mt * rodTipY + 2 * mt * t * midY + t * t * (waterY + 20);
    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.fillStyle = "#DC2020";
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const tsec = timestamp / 1000;
  const bx = castTargetX;
  let by: number;
  if (state === "waiting") {
    by = waterY + 14 + Math.sin(tsec * 2.4) * 4;
  } else if (state === "biting") {
    by = waterY + 10 + Math.sin(tsec * 14) * 18;
  } else {
    by = waterY + 14;
  }

  const ctrlX = (rodTipX + bx) / 2;
  const ctrlY = Math.max(rodTipY, (rodTipY + by) / 2) + 15;
  ctx.beginPath();
  ctx.moveTo(rodTipX, rodTipY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, bx, by);
  ctx.stroke();

  const isBiting = state === "biting";
  if (!isBiting) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = "#AADDFF";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(bx, waterY + 14, 14, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = isBiting ? "#FF2000" : "#DC2020";
  ctx.beginPath();
  ctx.arc(bx, by - 5, 7, Math.PI, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = "#E8E8E0";
  ctx.beginPath();
  ctx.arc(bx, by + 1, 7, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(bx - 7, by - 2);
  ctx.lineTo(bx + 7, by - 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx, by - 12);
  ctx.lineTo(bx, by - 18);
  ctx.stroke();
}

// ─── GameScreen Component ─────────────────────────────────────────────────────

interface Props {
  playerName: string;
  onEndSession: (data: SessionData) => void;
}

export default function GameScreen({ onEndSession }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);

  const stateRef = useRef<GameState>("idle");
  const gameMinRef = useRef<number>(7 * 60);
  const castTargetXRef = useRef<number>(0);
  const castProgressRef = useRef<number>(0);
  const waitTimerRef = useRef<number>(0);
  const biteTimerRef = useRef<number>(0);
  const tensionRef = useRef<number>(0);
  const caughtFishRef = useRef<CaughtFish | null>(null);
  const catchTimerRef = useRef<number>(0);
  const escapeTimerRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const fishCountRef = useRef<number>(0);
  const catchesRef = useRef<CaughtFish[]>([]);

  const swimFishRef = useRef<SwimmingFish[]>([]);
  const starsRef = useRef<StarPoint[]>([]);
  const mountainPtsRef = useRef<Point[]>([]);

  const [uiState, setUiState] = useState<GameState>("idle");
  const [uiScore, setUiScore] = useState(0);
  const [uiFishCount, setUiFishCount] = useState(0);
  const [uiTimeOfDay, setUiTimeOfDay] = useState<TimeOfDay>("day");
  const [uiTension, setUiTension] = useState(0);
  const [uiCaughtFish, setUiCaughtFish] = useState<CaughtFish | null>(null);
  const [uiGameMin, setUiGameMin] = useState(7 * 60);

  const syncUI = useCallback(() => {
    setUiState(stateRef.current);
    setUiScore(scoreRef.current);
    setUiFishCount(fishCountRef.current);
    setUiTimeOfDay(getTimeOfDay(gameMinRef.current / 60));
    setUiTension(tensionRef.current);
    setUiCaughtFish(caughtFishRef.current);
    setUiGameMin(gameMinRef.current);
  }, []);

  const syncUIRef = useRef(syncUI);
  syncUIRef.current = syncUI;

  const handleInteraction = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const h = canvas.offsetHeight;
    const waterY = h * 0.63;
    const state = stateRef.current;

    if (state === "idle") {
      if (y > waterY - 10 && x > 50) {
        castTargetXRef.current = x;
        castProgressRef.current = 0;
        stateRef.current = "casting";
        syncUIRef.current();
      }
    } else if (state === "biting") {
      tensionRef.current = 25;
      stateRef.current = "reeling";
      syncUIRef.current();
    } else if (state === "reeling") {
      tensionRef.current = Math.min(100, tensionRef.current + 16);
      setUiTension(tensionRef.current);
      if (tensionRef.current >= 100) {
        const fish = generateCatch(gameMinRef.current);
        caughtFishRef.current = fish;
        catchTimerRef.current = 3;
        scoreRef.current += fish.points;
        fishCountRef.current += 1;
        catchesRef.current.push(fish);
        stateRef.current = "caught";
        syncUIRef.current();
      }
    }
  }, []);

  const handleEndSession = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    const catches = catchesRef.current;
    const bestCatch = catches.reduce<CaughtFish | null>(
      (best, c) => (!best || c.points > best.points ? c : best),
      null,
    );
    onEndSession({
      score: scoreRef.current,
      fishCount: fishCountRef.current,
      catches,
      bestCatch,
    });
  }, [onEndSession]);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      handleInteraction(e.clientX - rect.left, e.clientY - rect.top);
    },
    [handleInteraction],
  );

  const handleContainerTouch = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !touch) return;
      handleInteraction(touch.clientX - rect.left, touch.clientY - rect.top);
    },
    [handleInteraction],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        handleInteraction(canvas.offsetWidth / 2, canvas.offsetHeight * 0.8);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleInteraction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initBackground = (w: number, h: number) => {
      mountainPtsRef.current = generateMountainPoints(w, h);
      swimFishRef.current = generateSwimmingFish(w, h);
      starsRef.current = generateStars(w, h);
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      initBackground(w, h);
    };

    resize();
    window.addEventListener("resize", resize);

    const clockInterval = setInterval(() => {
      setUiGameMin(gameMinRef.current);
    }, 1000);

    function update(delta: number) {
      const dt = Math.min(delta, 0.12);
      gameMinRef.current = (gameMinRef.current + dt * 6) % 1440;

      const w2 = canvas!.offsetWidth;
      for (const f of swimFishRef.current) {
        f.x += f.vx * dt;
        if (f.x < -70) f.x = w2 + 70;
        if (f.x > w2 + 70) f.x = -70;
      }

      const state = stateRef.current;
      if (state === "casting") {
        castProgressRef.current += dt / 0.5;
        if (castProgressRef.current >= 1) {
          castProgressRef.current = 1;
          stateRef.current = "waiting";
          waitTimerRef.current = 2 + Math.random() * 6;
          syncUIRef.current();
        }
      } else if (state === "waiting") {
        waitTimerRef.current -= dt;
        if (waitTimerRef.current <= 0) {
          stateRef.current = "biting";
          biteTimerRef.current = 1.5;
          syncUIRef.current();
        }
      } else if (state === "biting") {
        biteTimerRef.current -= dt;
        if (biteTimerRef.current <= 0) {
          stateRef.current = "escaped";
          escapeTimerRef.current = 1.5;
          syncUIRef.current();
        }
      } else if (state === "reeling") {
        tensionRef.current = Math.max(0, tensionRef.current - dt * 14);
        setUiTension(tensionRef.current);
        if (tensionRef.current <= 0) {
          stateRef.current = "escaped";
          escapeTimerRef.current = 1.5;
          syncUIRef.current();
        }
      } else if (state === "caught") {
        catchTimerRef.current -= dt;
        if (catchTimerRef.current <= 0) {
          caughtFishRef.current = null;
          stateRef.current = "idle";
          syncUIRef.current();
        }
      } else if (state === "escaped") {
        escapeTimerRef.current -= dt;
        if (escapeTimerRef.current <= 0) {
          stateRef.current = "idle";
          syncUIRef.current();
        }
      }
    }

    function render(timestamp: number) {
      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      const hour = gameMinRef.current / 60;
      const { waterY } = getPlayerLayout(w, h);

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      drawSky(ctx, w, h, hour);
      drawStars(ctx, starsRef.current, hour, timestamp);
      drawMountains(ctx, w, h, mountainPtsRef.current, hour);
      drawDesert(ctx, w, h);
      drawSwimmingFish(ctx, swimFishRef.current, waterY);
      drawWater(ctx, w, h, hour, timestamp);
      drawWaterLabel(ctx, w, h);
      drawDockAndPlayer(ctx, w, h);

      const state = stateRef.current;
      if (state !== "idle") {
        drawFishingLine(
          ctx,
          w,
          h,
          state,
          castProgressRef.current,
          castTargetXRef.current,
          timestamp,
        );
      }
      ctx.restore();
    }

    function loop(ts: number) {
      const delta = lastTsRef.current ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;
      update(delta);
      render(ts);
      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(clockInterval);
    };
  }, []);

  const todIcon = TIME_ICONS[uiTimeOfDay];
  const tensionColor =
    uiTension > 70 ? "#22c55e" : uiTension > 35 ? "#f59e0b" : "#ef4444";

  return (
    <button
      type="button"
      aria-label="Fishing game - tap to cast, tap to reel"
      className="relative w-screen h-screen overflow-hidden game-container select-none text-left p-0 m-0 border-0 bg-transparent focus:outline-none"
      onClick={handleContainerClick}
      onTouchStart={handleContainerTouch}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleInteraction(
            (canvasRef.current?.offsetWidth ?? 400) / 2,
            (canvasRef.current?.offsetHeight ?? 600) * 0.8,
          );
        }
      }}
    >
      <canvas
        ref={canvasRef}
        data-ocid="game.canvas_target"
        className="absolute inset-0 block"
      />

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3 z-10 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10">
          <p className="text-white/60 text-xs">📍 Diamond Valley Lake</p>
          <p className="text-white text-sm font-semibold">Hemet, CA</p>
        </div>
        <div className="bg-black/50 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10 text-right">
          <p className="text-white/60 text-xs">
            {todIcon}{" "}
            {uiTimeOfDay.charAt(0).toUpperCase() + uiTimeOfDay.slice(1)}
          </p>
          <p className="text-white text-xs font-mono">
            {formatGameTime(uiGameMin)}
          </p>
          <p className="text-amber-400 text-lg font-bold leading-tight">
            {uiScore.toLocaleString()} pts
          </p>
        </div>
      </div>

      {uiState === "idle" && (
        <div className="absolute bottom-28 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-black/55 backdrop-blur-sm rounded-full px-6 py-3 text-white text-sm font-semibold animate-pulse border border-white/15">
            🎣 Tap the water to cast
          </div>
        </div>
      )}

      {uiState === "waiting" && (
        <div className="absolute bottom-28 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-black/55 backdrop-blur-sm rounded-full px-6 py-3 text-white/80 text-sm border border-white/10">
            🌊 Waiting for a bite...
          </div>
        </div>
      )}

      {uiState === "biting" && (
        <div className="absolute inset-x-0 top-1/3 flex justify-center z-20 pointer-events-none">
          <div className="bite-pulse bg-red-600/95 text-white text-2xl font-bold px-8 py-5 rounded-3xl shadow-2xl border-2 border-red-400/50">
            🎣 BITE! TAP NOW!
          </div>
        </div>
      )}

      {uiState === "reeling" && (
        <div className="absolute bottom-28 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md rounded-3xl px-6 py-4 w-80 border border-white/15 shadow-2xl">
            <p className="text-white text-center text-sm font-semibold mb-3">
              🎣 Keep tapping to reel in!
            </p>
            <div className="w-full bg-white/10 rounded-full h-5 overflow-hidden border border-white/20">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${uiTension}%`,
                  backgroundColor: tensionColor,
                  boxShadow: `0 0 8px ${tensionColor}`,
                }}
              />
            </div>
            <p className="text-white/60 text-center text-xs mt-1">
              {Math.round(uiTension)}% tension
            </p>
          </div>
        </div>
      )}

      {(uiState === "biting" || uiState === "reeling") && (
        <button
          type="button"
          data-ocid="game.primary_button"
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-primary/90 hover:bg-primary active:scale-95 text-white font-bold rounded-2xl px-10 py-4 text-lg shadow-glow-blue border border-primary/50 transition-transform pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            handleInteraction(
              castTargetXRef.current,
              (canvasRef.current?.offsetHeight ?? 400) * 0.8,
            );
          }}
        >
          {uiState === "biting" ? "🎣 REEL!" : "🎣 TAP!"}
        </button>
      )}

      {uiState === "caught" && uiCaughtFish && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-accent/30 rounded-3xl p-7 text-foreground text-center max-w-xs mx-4 shadow-2xl animate-slide-up">
            <div className="text-6xl mb-3">{uiCaughtFish.species.emoji}</div>
            <h3 className="font-display text-2xl text-accent mb-1">
              {uiCaughtFish.species.name}
            </h3>
            <p className="text-4xl font-bold mb-1">{uiCaughtFish.weight} lbs</p>
            <div className="inline-block bg-green-500/20 text-green-400 font-bold text-2xl px-4 py-1 rounded-xl border border-green-500/30 mb-3">
              +{uiCaughtFish.points} pts
            </div>
            <p className="text-muted-foreground text-sm">
              Caught at Diamond Valley Lake! 🏔️
            </p>
          </div>
        </div>
      )}

      {uiState === "escaped" && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-slate-800/90 backdrop-blur-sm text-white text-xl font-semibold px-8 py-4 rounded-2xl border border-white/10 animate-fade-in">
            🐟 It got away!
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-3 z-10">
        <div className="bg-black/50 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10 pointer-events-none">
          <p className="text-white/60 text-xs">Caught today</p>
          <p className="text-white font-bold text-base">{uiFishCount} 🐟</p>
        </div>
        <button
          type="button"
          data-ocid="game.secondary_button"
          className="bg-red-900/80 hover:bg-red-800/90 backdrop-blur-md text-white rounded-2xl px-5 py-3 font-semibold text-sm border border-red-700/40 pointer-events-auto transition-colors active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            handleEndSession();
          }}
        >
          End Session
        </button>
      </div>
    </button>
  );
}
