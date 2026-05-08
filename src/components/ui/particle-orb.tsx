"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleCore() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const count = 520;
    const random = seededRandom(4207);
    const cyan = new THREE.Color("#20e4ff");
    const blue = new THREE.Color("#5264ff");
    const pink = new THREE.Color("#ff62cf");
    const data = [];

    for (let i = 0; i < count; i += 1) {
      const radius = 0.86 + random() * 0.42;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const y = Math.sin(phi) * Math.sin(theta);
      const colorMix = (y + 1) / 2;
      const color =
        colorMix < 0.5
          ? cyan.clone().lerp(blue, colorMix * 2)
          : blue.clone().lerp(pink, (colorMix - 0.5) * 2);

      data.push({
        color,
        radius,
        scale: 0.02 + random() * 0.025,
        theta,
        phi,
      });
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
    const pulse = 1 + Math.sin(t * 2) * 0.03;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.28;
      groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.18;
      groupRef.current.scale.setScalar(pulse);
    }

    particles.forEach((particle, index) => {
      const drift = Math.sin(t * 1.4 + index * 0.07) * 0.025;
      const radius = particle.radius + drift;
      const x = radius * Math.sin(particle.phi) * Math.cos(particle.theta);
      const y = radius * Math.sin(particle.phi) * Math.sin(particle.theta);
      const z = radius * Math.cos(particle.phi);
      const size = particle.scale * (1 + Math.max(z, 0) * 0.45);

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummy.matrix);
    });

    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          transparent
          opacity={0.92}
          vertexColors
          depthWrite={false}
        />
      </instancedMesh>
    </group>
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
      <Canvas
        camera={{ position: [0, 0, 3.1], fov: 48 }}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
      >
        <ambientLight intensity={1} />
        <ParticleCore />
      </Canvas>
    </div>
  );
}
