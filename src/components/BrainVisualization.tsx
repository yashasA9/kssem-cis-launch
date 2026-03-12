import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { allBrainPoints, brainData, regionRanges } from "@/data/brainPoints";

interface BrainVisualizationProps {
  /** 0 = nothing visible, 1 = stem, 2 = +hemispheres forming, 3 = full brain */
  stage: number;
  /** Whether final activation is playing */
  activated: boolean;
}

/**
 * 3D neural brain visualization built from anatomical point cloud data.
 * Progressively reveals neuron nodes and synapse connections as quiz progresses.
 */
const BrainVisualization = ({ stage, activated }: BrainVisualizationProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pulseTimeRef = useRef(0);
  const revealProgressRef = useRef(0);

  const totalPoints = allBrainPoints.length;

  // Determine how many points should be visible based on stage
  const targetReveal = useMemo(() => {
    if (stage === 0) return 0;
    if (stage === 1) return regionRanges.stem.end / totalPoints;
    if (stage === 2) return regionRanges.rightHemisphere.start / totalPoints;
    return 1;
  }, [stage, totalPoints]);

  // Node positions - all points, but we control visibility via alpha
  const { nodePositions, nodeColors, nodeAlphas, nodeSizes } = useMemo(() => {
    const pos = new Float32Array(totalPoints * 3);
    const col = new Float32Array(totalPoints * 3);
    const alpha = new Float32Array(totalPoints);
    const size = new Float32Array(totalPoints);

    const cyanCol = new THREE.Color("hsl(190, 100%, 60%)");
    const blueCol = new THREE.Color("hsl(210, 100%, 60%)");
    const purpleCol = new THREE.Color("hsl(260, 80%, 65%)");

    for (let i = 0; i < totalPoints; i++) {
      const p = allBrainPoints[i];
      // Scale up for visibility
      pos[i * 3] = p[0] * 2.5;
      pos[i * 3 + 1] = p[1] * 2.5;
      pos[i * 3 + 2] = p[2] * 2.5;

      // Color by region
      let c: THREE.Color;
      if (i < regionRanges.stem.end) {
        c = cyanCol;
      } else if (i < regionRanges.rightHemisphere.start) {
        c = blueCol;
      } else {
        c = purpleCol;
      }

      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      alpha[i] = 0;
      size[i] = 0.04 + Math.random() * 0.03;
    }

    return { nodePositions: pos, nodeColors: col, nodeAlphas: alpha, nodeSizes: size };
  }, [totalPoints]);

  // Connection line geometry
  const { linePositions, lineColors, lineCount } = useMemo(() => {
    const conns = brainData.connections;
    const pos = new Float32Array(conns.length * 6);
    const col = new Float32Array(conns.length * 6);

    for (let i = 0; i < conns.length; i++) {
      const [a, b] = conns[i];
      const pa = allBrainPoints[a];
      const pb = allBrainPoints[b];

      pos[i * 6] = pa[0] * 2.5;
      pos[i * 6 + 1] = pa[1] * 2.5;
      pos[i * 6 + 2] = pa[2] * 2.5;
      pos[i * 6 + 3] = pb[0] * 2.5;
      pos[i * 6 + 4] = pb[1] * 2.5;
      pos[i * 6 + 5] = pb[2] * 2.5;

      // Cyan connections
      col[i * 6] = 0;
      col[i * 6 + 1] = 0.8;
      col[i * 6 + 2] = 1;
      col[i * 6 + 3] = 0;
      col[i * 6 + 4] = 0.8;
      col[i * 6 + 5] = 1;
    }

    return { linePositions: pos, lineColors: col, lineCount: conns.length };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth reveal progress
    const revealSpeed = activated ? 0.8 : 1.5;
    revealProgressRef.current += (targetReveal - revealProgressRef.current) * delta * revealSpeed;
    const progress = revealProgressRef.current;

    // Update node visibility
    if (nodesRef.current) {
      const alphaAttr = nodesRef.current.geometry.getAttribute("alpha") as THREE.BufferAttribute;
      const alphaArr = alphaAttr.array as Float32Array;

      for (let i = 0; i < totalPoints; i++) {
        const normalizedIdx = i / totalPoints;
        const targetAlpha = normalizedIdx < progress ? 1 : 0;
        alphaArr[i] += (targetAlpha - alphaArr[i]) * delta * 3;

        // Pulse effect when activated
        if (activated && alphaArr[i] > 0.5) {
          alphaArr[i] = 0.7 + Math.sin(pulseTimeRef.current * 3 + i * 0.1) * 0.3;
        }
      }
      alphaAttr.needsUpdate = true;
    }

    // Update line visibility
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = Math.min(progress * 1.5, activated ? 0.6 : 0.3);
    }

    // Rotation - slow ambient before launch, more dynamic when activated
    const baseSpeed = 0.12;
    const activatedBoost = activated ? 0.28 : 0;
    const rotSpeed = baseSpeed + activatedBoost;
    groupRef.current.rotation.y += delta * rotSpeed;

    // Subtle floating
    groupRef.current.position.y = Math.sin(pulseTimeRef.current * 0.5) * 0.05;

    pulseTimeRef.current += delta;
  });

  // Custom shader material for nodes with per-particle alpha
  const nodeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        attribute float alpha;
        attribute float size;
        attribute vec3 color;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vAlpha = alpha;
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 300.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, d);
          // Stronger inner core and softer halo for a richer neuron look
          float core = smoothstep(0.18, 0.0, d);
          vec3 color = mix(vColor * 0.6, vColor * 1.4, core);
          float alpha = vAlpha * glow;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      {/* Neuron nodes */}
      <points ref={nodesRef} material={nodeMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={totalPoints} array={nodePositions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={totalPoints} array={nodeColors} itemSize={3} />
          <bufferAttribute attach="attributes-alpha" count={totalPoints} array={nodeAlphas} itemSize={1} />
          <bufferAttribute attach="attributes-size" count={totalPoints} array={nodeSizes} itemSize={1} />
        </bufferGeometry>
      </points>

      {/* Synapse connections */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={lineCount * 2} array={linePositions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={lineCount * 2} array={lineColors} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
};

export default BrainVisualization;
