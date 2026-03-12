import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface CameraZoomProps {
  activated: boolean;
}

/**
 * Cinematic camera zoom that slowly pushes toward the brain
 * during the final activation sequence.
 */
const CameraZoom = ({ activated }: CameraZoomProps) => {
  const { camera } = useThree();
  const targetZ = useRef(4);
  const startTime = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (activated) {
      if (startTime.current === null) startTime.current = 0;
      startTime.current += delta;

      // Slow cinematic push from z=4 → z=2.2 over ~4 seconds
      const progress = Math.min(startTime.current / 4, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      targetZ.current = 4 - eased * 1.8;

      // Subtle vertical drift
      camera.position.y = Math.sin(startTime.current * 0.3) * 0.08;
    } else {
      targetZ.current = 4;
      startTime.current = null;
    }

    camera.position.z += (targetZ.current - camera.position.z) * delta * 2;
  });

  return null;
};

export default CameraZoom;
