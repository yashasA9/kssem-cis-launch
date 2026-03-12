import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import BrainVisualization from "./BrainVisualization";
import ParticleBackground from "./ParticleBackground";
import CameraZoom from "./CameraZoom";

interface Scene3DProps {
  launched: boolean;
  brainStage: number;
  activated: boolean;
}

const Scene3D = ({ launched, brainStage, activated }: Scene3DProps) => {
  const intensity = brainStage / 3;

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[5, 5, 5]} intensity={0.5} color="#00d4ff" />
          <pointLight position={[-5, -3, 3]} intensity={0.3} color="#8b5cf6" />

          <ParticleBackground launched={launched} intensity={intensity} />

          {launched && (
            <BrainVisualization stage={brainStage} activated={activated} />
          )}

          {/* Camera zoom during activation */}
          <CameraZoom activated={activated} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene3D;
