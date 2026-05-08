"use client";

import { useEffect, useMemo, useRef } from "react";

type WaveformMode = "idle" | "connecting" | "listening" | "speaking";

type ParticleWaveformProps = {
  activity?: number;
  className?: string;
  mode?: WaveformMode;
};

const LANES = 9;
const SEGMENTS = 132;

type Particle = {
  color: string;
  lane: number;
  laneOffset: number;
  phase: number;
  seed: number;
  xProgress: number;
};

export function ParticleWaveform({
  activity = 0,
  className,
  mode = "idle",
}: ParticleWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activityRef = useRef(activity);
  const modeRef = useRef(mode);
  const smoothActivityRef = useRef(activity);

  const particles = useMemo(() => {
    const random = seededRandom(6824);
    const data: Particle[] = [];
    const colors = [
      "#16d9ff",
      "#22c7ff",
      "#3c9cff",
      "#536dff",
      "#7760ff",
      "#a35dff",
      "#d957ff",
      "#ff62d0",
      "#ff7ab8",
    ];

    for (let lane = 0; lane < LANES; lane += 1) {
      const laneProgress = lane / (LANES - 1);
      const laneOffset = laneProgress - 0.5;

      for (let segment = 0; segment < SEGMENTS; segment += 1) {
        data.push({
          color: colors[lane] ?? "#4ddcff",
          lane,
          laneOffset,
          phase: random() * Math.PI * 2,
          seed: random(),
          xProgress: segment / (SEGMENTS - 1),
        });
      }
    }

    return data;
  }, []);

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let frameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const drawParticle = (
      x: number,
      y: number,
      radius: number,
      alpha: number,
      color: string
    ) => {
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = radius * 4.5;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    };

    const render = (time: number) => {
      const t = time / 1000;
      const speakingPulse =
        modeRef.current === "speaking" ? 0.62 + Math.sin(t * 5.4) * 0.22 : 0;
      const connectingPulse =
        modeRef.current === "connecting" ? 0.36 + Math.sin(t * 2.6) * 0.12 : 0;
      const idlePulse =
        modeRef.current === "idle" ? 0.24 + Math.sin(t * 1.2) * 0.06 : 0.14;
      const targetActivity = Math.min(
        1,
        Math.max(activityRef.current, speakingPulse, connectingPulse, idlePulse)
      );

      smoothActivityRef.current +=
        (targetActivity - smoothActivityRef.current) * 0.14;

      const voice = smoothActivityRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      const waveWidth = width * 0.88;
      const halfWave = waveWidth / 2;
      const laneSpread = height * (0.2 + voice * 0.08);
      const waveAmplitude = height * (0.18 + voice * 0.24);

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      const glow = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(width, height) * 0.45
      );
      glow.addColorStop(0, `rgba(90, 139, 255, ${0.14 + voice * 0.12})`);
      glow.addColorStop(0.55, `rgba(83, 231, 255, ${0.08 + voice * 0.08})`);
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = "lighter";

      particles.forEach((particle) => {
        const xNorm = particle.xProgress * 2 - 1;
        const edgeEnvelope = Math.pow(
          Math.sin(particle.xProgress * Math.PI),
          0.52
        );
        const carrier = Math.sin(
          xNorm * (9.5 + particle.lane * 0.22) -
            t * (3.0 + voice * 2.4) +
            particle.phase
        );
        const harmonic =
          Math.sin(xNorm * 18 + t * 1.7 + particle.seed * 8) * 0.3;
        const fine =
          Math.sin(t * 8.5 + particle.seed * 28 + particle.lane) * 0.08;
        const depth = Math.cos(xNorm * 2.5 + t * 0.8 + particle.seed * 7);
        const perspective = 0.72 + (depth + 1) * 0.18;
        const x =
          centerX +
          xNorm * halfWave * perspective +
          depth * (10 + voice * 18);
        const y =
          centerY +
          particle.laneOffset * laneSpread +
          (carrier + harmonic + fine) * waveAmplitude * edgeEnvelope;
        const radius =
          (2.2 + edgeEnvelope * 2.6 + voice * 2.4) *
          (0.76 + particle.seed * 0.44) *
          perspective;
        const alpha =
          (0.34 + edgeEnvelope * 0.38 + voice * 0.2) *
          (0.78 + particle.seed * 0.22);

        drawParticle(x, y, radius, alpha, particle.color);
      });

      context.globalCompositeOperation = "source-over";
      context.shadowBlur = 0;
      context.globalAlpha = 1;

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [particles]);

  return (
    <div className={className ?? "relative h-full w-full"}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-hidden="true"
      />
    </div>
  );
}

function seededRandom(seed: number) {
  let value = seed;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
