"use client";

/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type WaveformMode = "idle" | "connecting" | "listening" | "speaking";

type ParticleWaveformProps = {
  activity?: number;
  className?: string;
  mode?: WaveformMode;
};

const LANES = 9;
const SEGMENTS = 118;
const POINT_COUNT = LANES * SEGMENTS;

function ParticleWaveformCore({
  activity,
  mode,
}: {
  activity: number;
  mode: WaveformMode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>>(null);
  const activityRef = useRef(activity);
  const modeRef = useRef(mode);
  const smoothActivityRef = useRef(activity);

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const { positions, colors, seeds } = useMemo(() => {
    const positionData = new Float32Array(POINT_COUNT * 3);
    const colorData = new Float32Array(POINT_COUNT * 3);
    const seedData = new Float32Array(POINT_COUNT);
    const random = seededRandom(2718);
    const cyan = new THREE.Color("#43efff");
    const blue = new THREE.Color("#4268ff");
    const pink = new THREE.Color("#ff65d8");

    for (let lane = 0; lane < LANES; lane += 1) {
      const laneProgress = lane / (LANES - 1);
      const laneColor = laneProgress < 0.5
        ? cyan.clone().lerp(blue, laneProgress * 2)
        : blue.clone().lerp(pink, (laneProgress - 0.5) * 2);

      for (let segment = 0; segment < SEGMENTS; segment += 1) {
        const i = lane * SEGMENTS + segment;
        const x = -4.7 + (segment / (SEGMENTS - 1)) * 9.4;
        const z = (laneProgress - 0.5) * 1.7;
        const y = (laneProgress - 0.5) * 0.44;

        positionData[i * 3] = x;
        positionData[i * 3 + 1] = y;
        positionData[i * 3 + 2] = z;
        colorData[i * 3] = laneColor.r;
        colorData[i * 3 + 1] = laneColor.g;
        colorData[i * 3 + 2] = laneColor.b;
        seedData[i] = random();
      }
    }

    return { positions: positionData, colors: colorData, seeds: seedData };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speakingPulse =
      modeRef.current === "speaking" ? 0.5 + Math.sin(t * 5.8) * 0.22 : 0;
    const connectingPulse =
      modeRef.current === "connecting" ? 0.28 + Math.sin(t * 2.8) * 0.12 : 0;
    const idlePulse = modeRef.current === "idle" ? 0.15 + Math.sin(t * 1.4) * 0.05 : 0.08;
    const targetActivity = Math.min(
      1,
      Math.max(activityRef.current, speakingPulse, connectingPulse, idlePulse)
    );

    smoothActivityRef.current +=
      (targetActivity - smoothActivityRef.current) * 0.15;

    const voice = smoothActivityRef.current;
    const arr = positions;

    for (let lane = 0; lane < LANES; lane += 1) {
      const laneProgress = lane / (LANES - 1);
      const laneOffset = laneProgress - 0.5;

      for (let segment = 0; segment < SEGMENTS; segment += 1) {
        const i = lane * SEGMENTS + segment;
        const baseX = -4.7 + (segment / (SEGMENTS - 1)) * 9.4;
        const centeredX = baseX / 4.7;
        const envelope = Math.pow(1 - Math.min(1, Math.abs(centeredX)), 0.42);
        const seed = seeds[i];
        const carrier = Math.sin(baseX * (2.1 + laneProgress * 0.72) - t * (2.6 + voice * 2.2) + seed * 6);
        const harmonic = Math.sin(baseX * 4.4 + t * (1.6 + seed) + lane * 0.5) * 0.36;
        const shimmer = Math.sin(t * 7.5 + seed * 24 + segment * 0.08) * 0.09;
        const amplitude = (0.26 + voice * 1.05) * envelope;

        arr[i * 3] = baseX;
        arr[i * 3 + 1] =
          laneOffset * (0.48 + voice * 0.32) +
          (carrier + harmonic + shimmer) * amplitude;
        arr[i * 3 + 2] =
          laneOffset * (1.4 + voice * 0.55) +
          Math.cos(baseX * 1.3 + t * 0.85 + seed * 6) * (0.18 + voice * 0.34);
      }
    }

    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      pointsRef.current.material.size = 0.055 + voice * 0.035;
      pointsRef.current.material.opacity = 0.68 + voice * 0.22;
    }

    if (groupRef.current) {
      groupRef.current.rotation.x = -0.16 + Math.sin(t * 0.35) * 0.025;
      groupRef.current.rotation.y = Math.sin(t * 0.28) * 0.18;
      groupRef.current.scale.set(1 + voice * 0.04, 1 + voice * 0.12, 1);
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.065}
          transparent
          opacity={0.78}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export function ParticleWaveform({
  activity = 0,
  className,
  mode = "idle",
}: ParticleWaveformProps) {
  return (
    <div className={className ?? "relative h-full w-full"}>
      <Canvas
        camera={{ position: [0, 0, 8.8], fov: 42 }}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
      >
        <ambientLight intensity={0.8} />
        <ParticleWaveformCore activity={activity} mode={mode} />
      </Canvas>
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
