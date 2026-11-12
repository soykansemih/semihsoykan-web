import React from 'react';
import { COLORS } from './spots';

const GRASS = '#46bf68';
const LEAF = '#2f9e52';
const LEAF_LIGHT = '#57cc77';
const TRUNK = '#6f5540';
const ASPHALT = '#2b2b2b';
const LINE = '#ffffff';
const HALF = Math.PI / 2;

/** Ground level outside: the room's floor slab is 0.4 thick, so the lawn sits at its base. */
const GROUND = -0.4;

const Tree: React.FC<{ p: [number, number]; s?: number }> = ({ p, s = 1 }) => (
  <group position={[p[0], GROUND, p[1]]} scale={s}>
    <mesh position={[0, 0.9, 0]} castShadow>
      <cylinderGeometry args={[0.14, 0.2, 1.8, 6]} />
      <meshStandardMaterial color={TRUNK} roughness={1} flatShading />
    </mesh>
    <mesh position={[0, 2.5, 0]} castShadow>
      <icosahedronGeometry args={[1.25, 0]} />
      <meshStandardMaterial color={LEAF} roughness={1} flatShading />
    </mesh>
    <mesh position={[0.35, 3.45, -0.2]} castShadow>
      <icosahedronGeometry args={[0.8, 0]} />
      <meshStandardMaterial color={LEAF_LIGHT} roughness={1} flatShading />
    </mesh>
  </group>
);

const Bush: React.FC<{ p: [number, number]; s?: number }> = ({ p, s = 1 }) => (
  <group position={[p[0], GROUND, p[1]]} scale={s}>
    <mesh position={[0, 0.35, 0]} castShadow>
      <icosahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial color={LEAF} roughness={1} flatShading />
    </mesh>
    <mesh position={[0.45, 0.28, 0.2]} castShadow>
      <icosahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial color={LEAF_LIGHT} roughness={1} flatShading />
    </mesh>
  </group>
);

/** A painted line lying flat on the court. */
const Line: React.FC<{ p: [number, number]; s: [number, number]; c?: string; y?: number }> = ({ p, s, c = LINE, y = 0.046 }) => (
  <mesh position={[p[0], y, p[1]]}>
    <boxGeometry args={[s[0], 0.01, s[1]]} />
    <meshStandardMaterial color={c} roughness={0.9} />
  </mesh>
);

/** A painted arc lying flat on the court; angles run from +x toward -z. */
const Arc: React.FC<{ p: [number, number]; r: number; from: number; len: number }> = ({ p, r, from, len }) => (
  <mesh position={[p[0], 0.05, p[1]]} rotation={[-HALF, 0, 0]}>
    <ringGeometry args={[r - 0.06, r, 48, 1, from, len]} />
    <meshStandardMaterial color={LINE} roughness={0.9} />
  </mesh>
);

/** Half court next to the open side of the room. Local x runs along the court, away from the hoop. */
const Court: React.FC = () => (
  <group position={[2.9, GROUND, 13.5]}>
    <mesh position={[3.4, 0.02, 0]} receiveShadow>
      <boxGeometry args={[7.2, 0.04, 5.2]} />
      <meshStandardMaterial color={ASPHALT} roughness={1} />
    </mesh>
    {/* key (outline only) */}
    <Line p={[1.2, -0.9]} s={[2.4, 0.06]} />
    <Line p={[1.2, 0.9]} s={[2.4, 0.06]} />
    <Line p={[2.4, 0]} s={[0.06, 1.86]} />
    {/* boundary */}
    <Line p={[3.5, -2.5]} s={[7.06, 0.06]} />
    <Line p={[3.5, 2.5]} s={[7.06, 0.06]} />
    <Line p={[0, 0]} s={[0.06, 5.06]} />
    <Line p={[7, 0]} s={[0.06, 5.06]} />
    {/* free-throw circle, three-point line, centre circle */}
    <Arc p={[2.4, 0]} r={0.9} from={-HALF} len={Math.PI} />
    <Arc p={[0.75, 0]} r={2.3} from={-HALF} len={Math.PI} />
    <Line p={[0.375, -2.27]} s={[0.75, 0.06]} />
    <Line p={[0.375, 2.27]} s={[0.75, 0.06]} />
    <Arc p={[7, 0]} r={0.9} from={HALF} len={Math.PI} />

    {/* hoop */}
    <mesh position={[-0.35, 1.55, 0]} castShadow>
      <boxGeometry args={[0.16, 3.1, 0.16]} />
      <meshStandardMaterial color={COLORS.ink} roughness={0.8} />
    </mesh>
    <mesh position={[0, 2.95, 0]} castShadow>
      <boxGeometry args={[0.75, 0.1, 0.1]} />
      <meshStandardMaterial color={COLORS.ink} roughness={0.8} />
    </mesh>
    <mesh position={[0.4, 3.05, 0]} castShadow>
      <boxGeometry args={[0.06, 1.0, 1.5]} />
      <meshStandardMaterial color="#ffffff" roughness={0.6} />
    </mesh>
    <mesh position={[0.4, 2.85, 0]}>
      <boxGeometry args={[0.065, 0.42, 0.56]} />
      <meshStandardMaterial color={COLORS.ink} />
    </mesh>
    <mesh position={[0.4, 2.85, 0]}>
      <boxGeometry args={[0.07, 0.3, 0.44]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    <mesh position={[0.7, 2.62, 0]} rotation={[HALF, 0, 0]} castShadow>
      <torusGeometry args={[0.25, 0.025, 8, 24]} />
      <meshStandardMaterial color="#ff5a36" roughness={0.6} />
    </mesh>
    <mesh position={[0.7, 2.42, 0]}>
      <cylinderGeometry args={[0.25, 0.17, 0.4, 10, 2, true]} />
      <meshBasicMaterial color="#ffffff" wireframe />
    </mesh>

    {/* ball */}
    <group position={[3.0, 0.24, 1.2]}>
      <mesh castShadow>
        <sphereGeometry args={[0.2, 20, 16]} />
        <meshStandardMaterial color="#ff8a1c" roughness={0.9} />
      </mesh>
      <mesh rotation={[HALF, 0, 0.4]}>
        <torusGeometry args={[0.2, 0.008, 6, 24]} />
        <meshStandardMaterial color={COLORS.ink} />
      </mesh>
      <mesh rotation={[0, 0, 0.4]}>
        <torusGeometry args={[0.2, 0.008, 6, 24]} />
        <meshStandardMaterial color={COLORS.ink} />
      </mesh>
    </group>
  </group>
);

/** Everything outside the room: a lawn plot, trees and bushes, and a basketball half court. */
const Garden: React.FC = () => (
  <group>
    {/* lawn plot the room stands on */}
    <mesh position={[4.5, GROUND - 0.3, 6]} receiveShadow>
      <boxGeometry args={[21, 0.6, 24]} />
      <meshStandardMaterial color={GRASS} roughness={1} />
    </mesh>

    <Court />

    {/* behind the walls: tall enough to show above them */}
    <Tree p={[-2.4, 2.2]} s={1.15} />
    <Tree p={[-3.0, 7.2]} />
    <Tree p={[2.6, -2.6]} />
    <Tree p={[7.8, -2.4]} s={1.2} />
    {/* around the open sides */}
    <Tree p={[12.8, 2.6]} s={0.9} />
    <Tree p={[-3.2, 12.6]} s={0.95} />
    <Bush p={[11.3, 5.6]} />
    <Bush p={[11.6, 8.4]} s={0.8} />
    <Bush p={[12.6, 11.2]} s={1.1} />
    <Bush p={[-1.6, 10.6]} s={0.9} />
    <Bush p={[10.8, 16.2]} />
  </group>
);

export default Garden;
