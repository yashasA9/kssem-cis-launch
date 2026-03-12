
//  generate points on a brain-shaped surface
function generateBrainPoints(): {
  stem: [number, number, number][];
  leftHemisphere: [number, number, number][];
  rightHemisphere: [number, number, number][];
  connections: [number, number][];
} {
  const stem: [number, number, number][] = [];
  const leftHemisphere: [number, number, number][] = [];
  const rightHemisphere: [number, number, number][] = [];
  const allConnections: [number, number][] = [];

  //  pseudo-random for consistency
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Brain stem - cylindrical base tapering down
  for (let i = 0; i < 60; i++) {
    const t = rand();
    const y = -0.6 - t * 0.5;  // bottom 
    const radius = 0.12 + (1 - t) * 0.08;
    const angle = rand() * Math.PI * 2;
    stem.push([
      Math.cos(angle) * radius + (rand() - 0.5) * 0.03,
      y,
      Math.sin(angle) * radius + (rand() - 0.5) * 0.03,
    ]);
  }

  // Cerebellum - dense cluster at back-bottom
  for (let i = 0; i < 40; i++) {
    const phi = rand() * Math.PI * 0.5;
    const theta = rand() * Math.PI * 2;
    const r = 0.25 + rand() * 0.1;
    stem.push([
      Math.sin(phi) * Math.cos(theta) * r,
      -0.45 - Math.cos(phi) * r * 0.3,
      -Math.sin(phi) * Math.sin(theta) * r * 0.8 - 0.15,
    ]);
  }

  // Brain surface function - elongated ellipsoid with cortical folds
  const brainSurface = (u: number, v: number, side: number): [number, number, number] => {
    // u: 0 to PI (top to bottom), v: 0 to 2PI (around)
    const baseX = Math.sin(u) * Math.cos(v);
    const baseY = Math.cos(u);
    const baseZ = Math.sin(u) * Math.sin(v);

    // Brain proportions: wider than tall, elongated front-to-back
    const scaleX = 0.55 * (1 + 0.15 * Math.sin(u * 3)); // slight cortical bumps
    const scaleY = 0.5 * (1 + 0.08 * Math.sin(v * 5 + u * 3)); // fold texture
    const scaleZ = 0.6 * (1 + 0.1 * Math.cos(u * 4));

    // Shift for hemisphere
    const xOffset = side * 0.08;

    // Add cortical fold detail
    const foldNoise = 0.03 * Math.sin(u * 7 + v * 5) + 0.02 * Math.cos(u * 11 + v * 3);

    return [
      baseX * scaleX * (1 + foldNoise) + xOffset,
      baseY * scaleY + 0.1, // shift up slightly
      baseZ * scaleZ * (1 + foldNoise),
    ];
  };

  // Left hemisphere points
  for (let i = 0; i < 150; i++) {
    const u = rand() * Math.PI * 0.85 + 0.1;
    const v = Math.PI + rand() * Math.PI; // left side
    const [x, y, z] = brainSurface(u, v, -1);
    leftHemisphere.push([
      x + (rand() - 0.5) * 0.02,
      y + (rand() - 0.5) * 0.02,
      z + (rand() - 0.5) * 0.02,
    ]);
  }

  // Interior points for left hemisphere
  for (let i = 0; i < 60; i++) {
    const u = rand() * Math.PI * 0.7 + 0.2;
    const v = Math.PI + rand() * Math.PI;
    const [sx, sy, sz] = brainSurface(u, v, -1);
    const shrink = 0.3 + rand() * 0.5;
    leftHemisphere.push([sx * shrink, sy * shrink + 0.05, sz * shrink]);
  }

  // Right hemisphere points
  for (let i = 0; i < 150; i++) {
    const u = rand() * Math.PI * 0.85 + 0.1;
    const v = rand() * Math.PI; // right side
    const [x, y, z] = brainSurface(u, v, 1);
    rightHemisphere.push([
      x + (rand() - 0.5) * 0.02,
      y + (rand() - 0.5) * 0.02,
      z + (rand() - 0.5) * 0.02,
    ]);
  }

  // Interior points for right hemisphere
  for (let i = 0; i < 60; i++) {
    const u = rand() * Math.PI * 0.7 + 0.2;
    const v = rand() * Math.PI;
    const [sx, sy, sz] = brainSurface(u, v, 1);
    const shrink = 0.3 + rand() * 0.5;
    rightHemisphere.push([sx * shrink, sy * shrink + 0.05, sz * shrink]);
  }

  // Generate connections within each region
  const connectNearby = (points: [number, number, number][], offset: number, maxDist: number, maxConn: number) => {
    const conns: [number, number][] = [];
    for (let i = 0; i < points.length; i++) {
      let count = 0;
      for (let j = i + 1; j < points.length && count < maxConn; j++) {
        const dx = points[i][0] - points[j][0];
        const dy = points[i][1] - points[j][1];
        const dz = points[i][2] - points[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < maxDist && rand() > 0.5) {
          conns.push([i + offset, j + offset]);
          count++;
        }
      }
    }
    return conns;
  };

  // Stem connections
  allConnections.push(...connectNearby(stem, 0, 0.2, 3));

  // Left hemisphere connections
  allConnections.push(...connectNearby(leftHemisphere, stem.length, 0.18, 3));

  // Right hemisphere connections
  allConnections.push(
    ...connectNearby(rightHemisphere, stem.length + leftHemisphere.length, 0.18, 3)
  );

  // Cross-hemisphere connections (corpus callosum)
  for (let i = 0; i < leftHemisphere.length; i++) {
    for (let j = 0; j < rightHemisphere.length; j++) {
      const lp = leftHemisphere[i];
      const rp = rightHemisphere[j];
      // Only connect points near the midline
      if (Math.abs(lp[0]) < 0.15 && Math.abs(rp[0]) < 0.15) {
        const dy = Math.abs(lp[1] - rp[1]);
        const dz = Math.abs(lp[2] - rp[2]);
        if (dy < 0.1 && dz < 0.1 && rand() > 0.85) {
          allConnections.push([
            i + stem.length,
            j + stem.length + leftHemisphere.length,
          ]);
        }
      }
    }
  }

  // Stem to hemisphere connections
  for (let i = 0; i < stem.length; i++) {
    const sp = stem[i];
    if (sp[1] > -0.65) {
      for (let j = 0; j < leftHemisphere.length; j++) {
        const lp = leftHemisphere[j];
        if (lp[1] < -0.2) {
          const dx = sp[0] - lp[0];
          const dy = sp[1] - lp[1];
          const dz = sp[2] - lp[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 0.25 && rand() > 0.9) {
            allConnections.push([i, j + stem.length]);
          }
        }
      }
      for (let j = 0; j < rightHemisphere.length; j++) {
        const rp = rightHemisphere[j];
        if (rp[1] < -0.2) {
          const dx = sp[0] - rp[0];
          const dy = sp[1] - rp[1];
          const dz = sp[2] - rp[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 0.25 && rand() > 0.9) {
            allConnections.push([i, j + stem.length + leftHemisphere.length]);
          }
        }
      }
    }
  }

  return { stem, leftHemisphere, rightHemisphere, connections: allConnections };
}

export const brainData = generateBrainPoints();

// Flatten all points into a single array for indexing
export const allBrainPoints: [number, number, number][] = [
  ...brainData.stem,
  ...brainData.leftHemisphere,
  ...brainData.rightHemisphere,
];

// Region boundaries for progressive reveal
export const regionRanges = {
  stem: { start: 0, end: brainData.stem.length },
  leftHemisphere: {
    start: brainData.stem.length,
    end: brainData.stem.length + brainData.leftHemisphere.length,
  },
  rightHemisphere: {
    start: brainData.stem.length + brainData.leftHemisphere.length,
    end: allBrainPoints.length,
  },
};


