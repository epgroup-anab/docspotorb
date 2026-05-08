"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleCore() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef =
    useRef<THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>>(null);
  const haloRef = useRef<THREE.Points>(null);
  const sparkRef = useRef<THREE.Points>(null);

  const shellPositions = useMemo(() => {
    const count = 2600;
    const data = new Float32Array(count * 3);
    const random = seededRandom(4207);

    for (let i = 0; i < count; i += 1) {
      const radius = 1.04 + random() * 0.22;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);

      data[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      data[i * 3 + 2] = radius * Math.cos(phi);
    }

    return data;
  }, []);

  const sparkPositions = useMemo(() => {
    const count = 520;
    const data = new Float32Array(count * 3);
    const random = seededRandom(9181);

    for (let i = 0; i < count; i += 1) {
      const radius = 1.35 + random() * 0.42;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);

      data[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      data[i * 3 + 2] = radius * Math.cos(phi);
    }

    return data;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: new THREE.Uniform(0),
      uFresnelColor: new THREE.Uniform(new THREE.Color("#58f5ff")),
      uCoreColor: new THREE.Uniform(new THREE.Color("#182cff")),
      uHotColor: new THREE.Uniform(new THREE.Color("#ff7adf")),
    }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 1.8) * 0.025;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.28;
      groupRef.current.rotation.x = Math.sin(t * 0.22) * 0.16;
    }

    if (coreRef.current) {
      coreRef.current.material.uniforms.uTime.value = t;
      coreRef.current.scale.setScalar(pulse);
    }

    if (haloRef.current) {
      haloRef.current.rotation.y = -t * 0.18;
      haloRef.current.rotation.z = t * 0.06;
      haloRef.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.018);
    }

    if (sparkRef.current) {
      sparkRef.current.rotation.y = t * 0.36;
      sparkRef.current.rotation.x = -t * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
        />
      </mesh>

      <points ref={haloRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[shellPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#65f7ff"
          size={0.018}
          transparent
          opacity={0.72}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points ref={sparkRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sparkPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ff84f6"
          size={0.026}
          transparent
          opacity={0.58}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <OrbRing rotation={[0.95, 0.2, 0.35]} color="#52f4ff" speed={0.32} />
      <OrbRing rotation={[1.35, -0.5, -0.6]} color="#a07cff" speed={-0.24} />
      <OrbRing rotation={[0.25, 0.85, 1.1]} color="#ff6fce" speed={0.2} />
    </group>
  );
}

function OrbRing({
  color,
  rotation,
  speed,
}: {
  color: string;
  rotation: [number, number, number];
  speed: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = rotation[2] + clock.getElapsedTime() * speed;
  });

  return (
    <mesh ref={ringRef} rotation={rotation}>
      <torusGeometry args={[1.17, 0.012, 12, 180]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.62}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

export function ParticleOrb({ className }: { className?: string }) {
  return (
    <div className={className ?? "relative h-full w-full"}>
      <Canvas
        camera={{ position: [0, 0, 3.4], fov: 44 }}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[2.5, 1.6, 2]} intensity={14} color="#8efcff" />
        <pointLight
          position={[-2.2, -1.3, 1.4]}
          intensity={7}
          color="#ff77d9"
        />
        <ParticleCore />
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

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uFresnelColor;
  uniform vec3 uCoreColor;
  uniform vec3 uHotColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float radius = length(uv);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0), 2.1);
    float plasma = noise(uv * 3.4 + vec2(uTime * 0.18, -uTime * 0.12));
    plasma += 0.55 * noise(uv * 6.8 + vec2(-uTime * 0.2, uTime * 0.16));
    plasma = smoothstep(0.52, 1.18, plasma);

    float innerGlow = smoothstep(0.92, 0.04, radius);
    float hotVein = smoothstep(0.82, 1.0, sin((uv.x * 4.2 - uv.y * 2.7 + uTime * 1.8) + plasma * 3.2) * 0.5 + 0.5);
    vec3 color = mix(uCoreColor, uFresnelColor, fresnel);
    color = mix(color, uHotColor, plasma * 0.62 + hotVein * 0.18);
    color += uFresnelColor * fresnel * 1.85;
    color += vec3(0.98, 1.0, 1.0) * pow(innerGlow, 7.0) * 0.5;

    float alpha = 0.5 + fresnel * 0.48 + plasma * 0.18;
    gl_FragColor = vec4(color, alpha);
  }
`;
