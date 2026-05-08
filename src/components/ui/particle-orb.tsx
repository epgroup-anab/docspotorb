"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleCore() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 1800;
    const data = new Float32Array(count * 3);
    const random = seededRandom(4207);

    for (let i = 0; i < count; i += 1) {
      const radius = 0.9 + random() * 0.45;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);

      data[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      data[i * 3 + 2] = radius * Math.cos(phi);
    }

    return data;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.25;
    pointsRef.current.rotation.x = Math.sin(t * 0.2) * 0.2;
    const pulse = 1 + Math.sin(t * 2) * 0.03;
    pointsRef.current.scale.setScalar(pulse);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#7c3aed"
        size={0.045}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function seededRandom(seed: number) {
  let value = seed;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function ParticleOrb({ className }: { className?: string }) {
  return (
    <div className={className ?? "relative h-full w-full"}>
      <Canvas camera={{ position: [0, 0, 3.1], fov: 55 }}>
        <ambientLight intensity={0.35} />
        <ParticleCore />
      </Canvas>
    </div>
  );
}
