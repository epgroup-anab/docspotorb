"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type WaveformMode = "idle" | "connecting" | "listening" | "speaking";

type ParticleWaveformProps = {
  activity?: number;
  className?: string;
  mode?: WaveformMode;
};

const LANES = 7;
const SEGMENTS = 92;
const PARTICLE_COUNT = LANES * SEGMENTS;

function ParticleWaveformCore({
  activity,
  mode,
}: {
  activity: number;
  mode: WaveformMode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const activityRef = useRef(activity);
  const modeRef = useRef(mode);
  const smoothActivityRef = useRef(activity);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const particles = useMemo(() => {
    const random = seededRandom(4831);
    const cyan = new THREE.Color("#16d9ff");
    const blue = new THREE.Color("#4258ff");
    const pink = new THREE.Color("#ff4ed6");
    const data = [];

    for (let lane = 0; lane < LANES; lane += 1) {
      const laneProgress = lane / (LANES - 1);
      const laneOffset = laneProgress - 0.5;
      const laneColor =
        laneProgress < 0.5
          ? cyan.clone().lerp(blue, laneProgress * 2)
          : blue.clone().lerp(pink, (laneProgress - 0.5) * 2);

      for (let segment = 0; segment < SEGMENTS; segment += 1) {
        const xProgress = segment / (SEGMENTS - 1);
        const x = -4.8 + xProgress * 9.6;
        const edgeFade = Math.sin(xProgress * Math.PI);

        data.push({
          color: laneColor,
          edgeFade,
          lane,
          laneOffset,
          seed: random(),
          x,
        });
      }
    }

    return data;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;

    particles.forEach((particle, index) => {
      meshRef.current?.setColorAt(index, particle.color);
    });
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [particles]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speakingPulse =
      modeRef.current === "speaking" ? 0.58 + Math.sin(t * 5.8) * 0.24 : 0;
    const connectingPulse =
      modeRef.current === "connecting" ? 0.34 + Math.sin(t * 2.8) * 0.13 : 0;
    const idlePulse =
      modeRef.current === "idle" ? 0.2 + Math.sin(t * 1.3) * 0.06 : 0.12;
    const targetActivity = Math.min(
      1,
      Math.max(activityRef.current, speakingPulse, connectingPulse, idlePulse)
    );

    smoothActivityRef.current +=
      (targetActivity - smoothActivityRef.current) * 0.16;

    const voice = smoothActivityRef.current;

    particles.forEach((particle, index) => {
      const envelope = Math.pow(particle.edgeFade, 0.45);
      const carrier = Math.sin(
        particle.x * (2.2 + particle.lane * 0.12) -
          t * (2.4 + voice * 2.2) +
          particle.seed * 7
      );
      const harmonic =
        Math.sin(particle.x * 4.1 + t * 1.7 + particle.lane * 0.58) * 0.35;
      const flicker = Math.sin(t * 8.4 + particle.seed * 31) * 0.08;
      const amplitude = (0.42 + voice * 1.22) * envelope;

      const y =
        particle.laneOffset * (0.72 + voice * 0.5) +
        (carrier + harmonic + flicker) * amplitude;
      const z =
        particle.laneOffset * (1.7 + voice * 0.55) +
        Math.cos(particle.x * 1.2 + t * 0.85 + particle.seed * 6) *
          (0.22 + voice * 0.42);
      const size =
        (0.085 + envelope * 0.035 + voice * 0.045) *
        (0.86 + particle.seed * 0.32);

      dummy.position.set(particle.x, y, z);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummy.matrix);
    });

    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.82 + voice * 0.16;
    }

    if (groupRef.current) {
      groupRef.current.rotation.x = -0.12 + Math.sin(t * 0.35) * 0.035;
      groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.14;
      groupRef.current.scale.set(1 + voice * 0.05, 1 + voice * 0.1, 1);
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial
          transparent
          opacity={0.9}
          vertexColors
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
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
        camera={{ position: [0, 0, 8.2], fov: 36 }}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
      >
        <ambientLight intensity={1} />
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
