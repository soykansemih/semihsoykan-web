import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useCursor, useTexture } from '@react-three/drei';
import { Mesh, OrthographicCamera, SRGBColorSpace, Vector3 } from 'three';
import { Me, Player } from './Characters';
import { COLORS, Goal, ME, PanelKind, PanelState, PROJECT_SLOTS } from './spots';

const TARGET = new Vector3(5, 0.9, 5);

/** Keeps the whole room in frame at any screen size. */
const Fit: React.FC = () => {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as OrthographicCamera;
    const portrait = size.width < size.height;
    cam.zoom = Math.min(size.width / (portrait ? 19 : 16), size.height / 12);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
};

const Box: React.FC<{ p: [number, number, number]; s: [number, number, number]; c: string; shadow?: boolean }> = ({ p, s, c, shadow = true }) => (
  <mesh position={p} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={0.85} />
  </mesh>
);

/** Small bouncing dot that marks something you can click. */
const Beacon: React.FC<{ y: number }> = ({ y }) => {
  const m = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (m.current) m.current.position.y = y + Math.sin(clock.elapsedTime * 3) * 0.08;
  });
  return (
    <mesh ref={m}>
      <sphereGeometry args={[0.07, 12, 12]} />
      <meshBasicMaterial color={COLORS.accent} />
    </mesh>
  );
};

/** Wraps an object so it highlights on hover and reacts to clicks. */
const Hot: React.FC<{
  position: [number, number, number];
  label: string;
  tipY: number;
  onSelect: () => void;
  children: React.ReactNode;
}> = ({ position, label, tipY, onSelect, children }) => {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  return (
    <group
      position={position}
      scale={hover ? 1.06 : 1}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => { e.stopPropagation(); if (e.delta > 6) return; onSelect(); }}
    >
      {children}
      {hover ? (
        <Html position={[0, tipY, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[20, 10]}>
          <div className="room-tip">{label}</div>
        </Html>
      ) : (
        <group position={[0, tipY - 0.1, 0]}><Beacon y={0} /></group>
      )}
    </group>
  );
};

const Photo: React.FC = () => {
  const tex = useTexture('/assets/semih.jpg');
  tex.colorSpace = SRGBColorSpace;
  return (
    <mesh position={[0, 0, 0.045]}>
      <planeGeometry args={[0.8, 0.7]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
};

/** Ring on the floor where the character is heading. */
const Marker: React.FC<{ goal: Goal | null; posRef: React.MutableRefObject<Vector3> }> = ({ goal, posRef }) => {
  const m = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!m.current || !goal) return;
    const d = Math.hypot(posRef.current.x - goal.x, posRef.current.z - goal.z);
    m.current.visible = d > 0.15;
    const s = 1 + Math.sin(clock.elapsedTime * 6) * 0.12;
    m.current.scale.set(s, s, s);
  });
  if (!goal) return null;
  return (
    <mesh ref={m} position={[goal.x, 0.02, goal.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 0.3, 32]} />
      <meshBasicMaterial color={COLORS.accent} transparent opacity={0.9} />
    </mesh>
  );
};

export interface SceneLabels {
  projects: string[];
  apps: string;
  about: string;
  social: string;
  contact: string;
  hello: string;
}

const Room: React.FC<{
  labels: SceneLabels;
  goal: Goal | null;
  posRef: React.MutableRefObject<Vector3>;
  onFloor: (x: number, z: number) => void;
  onGo: (kind: PanelKind, index?: number) => void;
  onArrive: (p: PanelState) => void;
  bubble: boolean;
  onNearMe: (near: boolean) => void;
}> = ({ labels, goal, posRef, onFloor, onGo, onArrive, bubble, onNearMe }) => {
  const floorClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    onFloor(e.point.x, e.point.z);
  };
  const W = 3.4; // wall height

  return (
    <>
      <hemisphereLight args={['#fff6ec', '#e2b48a', 1.25]} />
      <directionalLight
        position={[9, 12, 7]}
        intensity={1.35}
        color="#fff1e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0005}
      />

      {/* floor + walls */}
      <mesh position={[5, -0.2, 5]} receiveShadow onClick={floorClick}>
        <boxGeometry args={[10, 0.4, 10]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.9} />
      </mesh>
      <Box p={[-0.1, W / 2 - 0.4 / 2, 5]} s={[0.2, W + 0.4, 10]} c={COLORS.wallL} shadow={false} />
      <Box p={[5, W / 2 - 0.4 / 2, -0.1]} s={[10.2, W + 0.4, 0.2]} c={COLORS.wallR} shadow={false} />
      {/* skirting */}
      <Box p={[0.03, 0.08, 5]} s={[0.06, 0.16, 10]} c="#e9c7a4" shadow={false} />
      <Box p={[5, 0.08, 0.03]} s={[10, 0.16, 0.06]} c="#f0d6bb" shadow={false} />
      {/* rug */}
      <mesh position={[5.2, 0.01, 6.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={floorClick}>
        <planeGeometry args={[4.4, 3.6]} />
        <meshStandardMaterial color={COLORS.rug} roughness={1} />
      </mesh>
      <mesh position={[5.2, 0.015, 6.5]} rotation={[-Math.PI / 2, 0, 0]} onClick={floorClick}>
        <ringGeometry args={[1.0, 1.12, 48]} />
        <meshStandardMaterial color="#fbd0bf" />
      </mesh>

      {/* window */}
      <group position={[3.9, 2.0, 0.02]}>
        <Box p={[0, 0, 0]} s={[2.0, 1.4, 0.06]} c="#ffffff" shadow={false} />
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.8, 1.2]} />
          <meshBasicMaterial color="#bfe3f2" />
        </mesh>
        <mesh position={[0.45, 0.25, 0.045]}>
          <circleGeometry args={[0.22, 24]} />
          <meshBasicMaterial color="#fff3c4" />
        </mesh>
        <Box p={[0, 0, 0.06]} s={[0.06, 1.2, 0.03]} c="#ffffff" shadow={false} />
        <Box p={[0, -0.72, 0.12]} s={[2.2, 0.06, 0.24]} c="#ffffff" />
      </group>

      {/* shelf (projects) */}
      <group>
        {[1.05, 6.15].map((z) => <Box key={z} p={[0.45, 1.3, z]} s={[0.9, 2.6, 0.1]} c={COLORS.wood} />)}
        {[0.03, 0.6, 1.3, 2.0, 2.6].map((y) => <Box key={y} p={[0.45, y, 3.6]} s={[0.9, 0.06, 5.2]} c={COLORS.wood} />)}
        <Box p={[0.04, 1.3, 3.6]} s={[0.04, 2.6, 5.2]} c={COLORS.woodDark} shadow={false} />
        {/* decoration: books + plant */}
        {[0, 1, 2].map((i) => <Box key={i} p={[0.45, 1.53, 4.6 + i * 0.22]} s={[0.5, 0.44 - i * 0.05, 0.16]} c={['#7a6bd1', '#5fae8e', '#f2a65a'][i]} />)}
        {[0, 1].map((i) => <Box key={i} p={[0.45, 2.24, 1.7 + i * 0.22]} s={[0.5, 0.42, 0.16]} c={['#ff8a73', '#3b3348'][i]} />)}
        <mesh position={[0.45, 0.78, 3.4]} castShadow><cylinderGeometry args={[0.12, 0.1, 0.3, 12]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[0.45, 1.02, 3.4]} castShadow><sphereGeometry args={[0.2, 12, 12]} /><meshStandardMaterial color="#5fae6b" /></mesh>
        {PROJECT_SLOTS.map((s, i) => (
          <Hot key={i} position={[0.45, s.y + 0.03, s.z]} label={labels.projects[i]} tipY={0.85} onSelect={() => onGo('projects', i)}>
            <Box p={[0, 0.25, 0]} s={[0.6, 0.5, 0.9]} c={COLORS.projects[i]} />
            <Box p={[0.31, 0.25, 0]} s={[0.02, 0.18, 0.5]} c="#ffffff" shadow={false} />
          </Hot>
        ))}
      </group>

      {/* door (social) */}
      <Hot position={[0.03, 0, 8.3]} label={labels.social} tipY={2.55} onSelect={() => onGo('social')}>
        <Box p={[0, 1.1, 0]} s={[0.08, 2.2, 1.1]} c="#ffffff" shadow={false} />
        <Box p={[0.04, 1.08, 0]} s={[0.06, 2.06, 0.96]} c="#c98b5e" shadow={false} />
        <mesh position={[0.1, 1.05, -0.33]}><sphereGeometry args={[0.05, 12, 12]} /><meshStandardMaterial color={COLORS.accent} /></mesh>
        <Box p={[0.08, 1.55, 0]} s={[0.02, 0.5, 0.6]} c="#d79a6b" shadow={false} />
        <Box p={[0.08, 0.6, 0]} s={[0.02, 0.6, 0.6]} c="#d79a6b" shadow={false} />
      </Hot>

      {/* picture frame (about) */}
      <Hot position={[7.4, 2.25, 0.02]} label={labels.about} tipY={0.75} onSelect={() => onGo('about')}>
        <Box p={[0, 0, 0]} s={[1.0, 0.9, 0.08]} c="#ffffff" shadow={false} />
        <Suspense fallback={null}><Photo /></Suspense>
      </Hot>

      {/* desk */}
      <group>
        <Box p={[7.5, 0.8, 0.8]} s={[2.8, 0.08, 1.05]} c={COLORS.wood} />
        {[[6.2, 0.4], [8.8, 0.4], [6.2, 1.2], [8.8, 1.2]].map(([x, z], i) => <Box key={i} p={[x, 0.39, z]} s={[0.08, 0.78, 0.08]} c={COLORS.woodDark} />)}
        {/* monitor */}
        <Box p={[7.3, 0.92, 0.55]} s={[0.3, 0.04, 0.2]} c="#3b3348" />
        <Box p={[7.3, 1.05, 0.5]} s={[0.06, 0.25, 0.06]} c="#3b3348" />
        <Box p={[7.3, 1.42, 0.5]} s={[1.1, 0.62, 0.05]} c="#3b3348" />
        <mesh position={[7.3, 1.42, 0.53]}>
          <planeGeometry args={[1.0, 0.52]} />
          <meshBasicMaterial color="#7cc7a8" />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[7.1 + i * 0.07, 1.52 - i * 0.12, 0.535]}>
            <planeGeometry args={[0.45 - i * 0.1, 0.05]} />
            <meshBasicMaterial color="#e9fff4" />
          </mesh>
        ))}
        <Box p={[7.3, 0.86, 1.0]} s={[0.7, 0.03, 0.22]} c="#ffffff" />
        {/* mug */}
        <mesh position={[6.4, 0.95, 0.9]} castShadow><cylinderGeometry args={[0.09, 0.08, 0.22, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[6.4, 1.06, 0.9]}><cylinderGeometry args={[0.075, 0.075, 0.01, 16]} /><meshStandardMaterial color="#6b3e26" /></mesh>
        {/* lamp */}
        <mesh position={[6.6, 0.88, 0.45]}><cylinderGeometry args={[0.12, 0.14, 0.04, 16]} /><meshStandardMaterial color={COLORS.ink} /></mesh>
        <mesh position={[6.6, 1.15, 0.45]}><cylinderGeometry args={[0.015, 0.015, 0.55, 8]} /><meshStandardMaterial color={COLORS.ink} /></mesh>
        <mesh position={[6.6, 1.45, 0.52]} rotation={[0.5, 0, 0]}><coneGeometry args={[0.16, 0.22, 16, 1, true]} /><meshStandardMaterial color="#ffd166" side={2} /></mesh>
      </group>

      {/* phone (apps) */}
      <Hot position={[8.35, 0.85, 0.95]} label={labels.apps} tipY={0.6} onSelect={() => onGo('apps')}>
        <group rotation={[0, -0.4, 0]}>
          <Box p={[0, 0.02, 0]} s={[0.26, 0.04, 0.46]} c={COLORS.ink} />
          <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.22, 0.4]} />
            <meshBasicMaterial color={COLORS.accent} />
          </mesh>
        </group>
      </Hot>

      {/* plant */}
      <group position={[9.4, 0, 0.55]}>
        <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.32, 0.25, 0.6, 16]} /><meshStandardMaterial color="#e98a5f" /></mesh>
        {[[0, 1.0, 0, 0.42], [-0.2, 1.35, 0.1, 0.32], [0.18, 1.5, -0.05, 0.3], [0, 1.8, 0, 0.24]].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} castShadow><sphereGeometry args={[r, 14, 14]} /><meshStandardMaterial color={i % 2 ? '#6bbd76' : '#5fae6b'} roughness={0.9} /></mesh>
        ))}
      </group>

      {/* beanbag */}
      <mesh position={[8.4, 0.28, 8.2]} scale={[1, 0.6, 1]} castShadow receiveShadow onClick={floorClick}>
        <sphereGeometry args={[0.6, 24, 16]} />
        <meshStandardMaterial color="#8fb3ff" roughness={1} />
      </mesh>

      {/* Semih (contact) */}
      <Hot position={[ME[0], 0, ME[1]]} label={labels.contact} tipY={2.15} onSelect={() => onGo('contact')}>
        <group position={[-ME[0], 0, -ME[1]]}>
          <Me playerRef={posRef} onNear={onNearMe} />
        </group>
      </Hot>
      {bubble && (
        <Html position={[7.3, 2.3, 1.95]} center zIndexRange={[30, 20]}>
          <button className="room-bubble" onClick={() => onGo('contact')}>{labels.hello}</button>
        </Html>
      )}

      <Marker goal={goal} posRef={posRef} />
      <Player goal={goal} posRef={posRef} onArrive={onArrive} />
    </>
  );
};

const Scene: React.FC<Omit<React.ComponentProps<typeof Room>, 'posRef'>> = (props) => {
  const posRef = useRef(new Vector3(5, 0, 7.6));
  return (
  <Canvas
    orthographic
    shadows
    flat
    dpr={[1, 1.5]}
    camera={{ position: [TARGET.x + 14, TARGET.y + 12, TARGET.z + 14], zoom: 60, near: -100, far: 200 }}
    onCreated={({ camera }) => camera.lookAt(TARGET)}
  >
    <Fit />
    <OrbitControls
      target={TARGET}
      enablePan={false}
      enableZoom={false}
      enableDamping
      minAzimuthAngle={Math.PI / 4 - 0.55}
      maxAzimuthAngle={Math.PI / 4 + 0.55}
      minPolarAngle={0.7}
      maxPolarAngle={1.15}
      rotateSpeed={0.5}
    />
    <Room {...props} posRef={posRef} />
  </Canvas>
  );
};

export default Scene;
