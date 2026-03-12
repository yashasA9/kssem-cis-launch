import { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleBackgroundProps {
  count?: number;
  launched: boolean;
  intensity: number; // 0-1, increases with correct answers
}

/**
 * Floating background particles that react to launch state and quiz progress.
 * Uses GPU-efficient instanced buffer geometry.
 */
const ParticleBackground = ({ count = 300, launched, intensity }: ParticleBackgroundProps) => {
  const meshRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sz[i] = Math.random() * 3 + 1;
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    velocitiesRef.current = vel;
    return { positions: pos, sizes: sz };
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current || !velocitiesRef.current) return;

    const geo = meshRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const vel = velocitiesRef.current;

    const speed = launched ? 1 + intensity * 4 : 0.3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArr[i3] += vel[i3] * speed * delta * 60;
      posArr[i3 + 1] += vel[i3 + 1] * speed * delta * 60;
      posArr[i3 + 2] += vel[i3 + 2] * speed * delta * 60;

      // Wrap around
      for (let j = 0; j < 3; j++) {
        if (posArr[i3 + j] > 10) posArr[i3 + j] = -10;
        if (posArr[i3 + j] < -10) posArr[i3 + j] = 10;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={new THREE.Color("hsl(190, 100%, 50%)")}
        transparent
        opacity={0.4 + intensity * 0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default ParticleBackground;
