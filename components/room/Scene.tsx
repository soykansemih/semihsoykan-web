import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useCursor, useTexture } from '@react-three/drei';
import { CanvasTexture, Group, Mesh, MeshStandardMaterial, OrthographicCamera, SRGBColorSpace, Vector3 } from 'three';
import { Me, Player } from './Characters';
import Garden from './Garden';
import Rug from './Rug';
import NameTag from './NameTag';
import { COLORS, Goal, ME, PanelKind, PanelState, PROJECT_SLOTS } from './spots';

const TARGET = new Vector3(5, 0.9, 5);

/** Pixels per world unit that fit the whole room on screen. */
const fullZoom = (w: number, h: number) => Math.min(w / 16, h / 12);
/** Below this, the room would look too small: zoom in and follow the character instead. */
const MIN_ZOOM = 52;
const isFollow = (w: number, h: number) => fullZoom(w, h) < MIN_ZOOM;
/** On phones show about 7 units across (roughly half the room), so the characters stay readable. */
const closeZoom = (w: number, h: number) => Math.max(fullZoom(w, h), Math.min(w / 7, h / 7));

/** Sets the zoom: whole room on big screens, a closer view on phones. */
const Fit: React.FC = () => {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as OrthographicCamera;
    const { width: w, height: h } = size;
    cam.zoom = isFollow(w, h) ? closeZoom(w, h) : fullZoom(w, h);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** On small screens the camera glides after the character; on big screens it stays on the room. */
const Follow: React.FC<{ posRef: React.MutableRefObject<Vector3> }> = ({ posRef }) => {
  const controls = useThree((s) => s.controls) as unknown as { target: Vector3; update: () => void } | null;
  const { camera, size } = useThree();
  const desired = useRef(new Vector3());
  const delta = useRef(new Vector3());
  const ready = useRef(false);

  useFrame((_, dt) => {
    if (!controls) return;
    if (!ready.current) {
      controls.target.copy(TARGET);
      ready.current = true;
    }
    const p = posRef.current;
    const { width: w, height: h } = size;
    if (isFollow(w, h)) {
      // Pinch-zoomed out toward the whole room: ease the view back to the room's center.
      const full = fullZoom(w, h);
      const close = closeZoom(w, h);
      const t = clamp(((camera as OrthographicCamera).zoom - full) / Math.max(close - full, 1), 0, 1);
      desired.current.set(clamp(p.x, 2.4, 7.6), TARGET.y, clamp(p.z, 2.4, 7.8)).lerp(TARGET, 1 - t);
    } else {
      desired.current.copy(TARGET);
    }
    const k = 1 - Math.exp(-3.5 * Math.min(dt, 0.1));
    delta.current.subVectors(desired.current, controls.target).multiplyScalar(k);
    controls.target.add(delta.current);
    camera.position.add(delta.current);
    controls.update();
  });
  return null;
};

const Box: React.FC<{ p: [number, number, number]; s: [number, number, number]; c: string; shadow?: boolean }> = ({ p, s, c, shadow = true }) => (
  <mesh position={p} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={0.85} />
  </mesh>
);

/** Wraps an object so it grows and lights up on hover/press and reacts to clicks. */
const Hot: React.FC<{
  position: [number, number, number];
  label: string;
  tipY: number;
  onSelect: () => void;
  children: React.ReactNode;
}> = ({ position, label, tipY, onSelect, children }) => {
  const [hover, setHover] = useState(false);
  const group = useRef<Group>(null);
  const hoverRef = useRef(false);
  hoverRef.current = hover;
  useCursor(hover);

  // No outlines and no idle glow: the object's own surfaces light up in their own colour
  // only while it is hovered or pressed.
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const glow = hoverRef.current ? 0.75 : 0;
    g.traverse((o) => {
      const mat = (o as Mesh).material as MeshStandardMaterial | undefined;
      if (!mat || !mat.isMeshStandardMaterial) return;
      // children can mount later (e.g. the photo texture), so set this up lazily
      if (!mat.userData.glow) { mat.emissive.copy(mat.color); mat.userData.glow = true; }
      mat.emissiveIntensity = glow;
    });
  });

  return (
    <group
      ref={group}
      position={position}
      scale={hover ? 1.06 : 1}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => { e.stopPropagation(); if (e.delta > 6) return; onSelect(); }}
    >
      {children}
      {hover && (
        <Html position={[0, tipY, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[20, 10]}>
          <div className="room-tip">{label}</div>
        </Html>
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
      <meshBasicMaterial color={COLORS.ink} transparent opacity={0.9} />
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
  shelf: string;
  you: string;
}

const APP_ICONS = [
  { src: '/assets/bb-icon.jpg', name: 'BB Oto Yıkama' },
  { src: '/assets/forx-icon.png', name: 'Forx' },
];

const loadImg = (src: string) =>
  new Promise<HTMLImageElement | null>((ok) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = src;
  });

/** A big phone hanging on the wall; its screen shows the app icons. */
const GiantPhone: React.FC<{ title: string }> = ({ title }) => {
  const [tex, setTex] = useState<CanvasTexture | null>(null);
  useEffect(() => {
    let alive = true;
    let made: CanvasTexture | null = null;
    Promise.all([document.fonts.load('700 60px Archivo Black').catch(() => {}), ...APP_ICONS.map((a) => loadImg(a.src))]).then(([, ...imgs]) => {
      if (!alive) return;
      const c = document.createElement('canvas');
      c.width = 512; c.height = 1024;
      const g = c.getContext('2d')!;
      const bg = g.createLinearGradient(0, 0, 0, 1024);
      bg.addColorStop(0, '#f1f1f1');
      bg.addColorStop(1, '#f1f1f1');
      g.fillStyle = bg;
      g.fillRect(0, 0, 512, 1024);
      g.fillStyle = '#121212';
      g.textAlign = 'center';
      g.font = '700 30px Archivo Black, sans-serif';
      g.fillText('9:41', 256, 70);
      g.font = '700 58px Archivo Black, sans-serif';
      g.fillText(title, 256, 210);
      (imgs as (HTMLImageElement | null)[]).forEach((img, i) => {
        const y = 300 + i * 300;
        const x = 156;
        const size = 200;
        g.save();
        g.shadowColor = 'rgba(0,0,0,.25)';
        g.shadowBlur = 24;
        g.shadowOffsetY = 10;
        g.beginPath();
        g.roundRect(x, y, size, size, 48);
        g.fillStyle = '#ffffff';
        g.fill();
        g.restore();
        if (img) {
          g.save();
          g.beginPath();
          g.roundRect(x, y, size, size, 48);
          g.clip();
          g.drawImage(img, x, y, size, size);
          g.restore();
        }
        g.fillStyle = '#121212';
        g.font = '700 36px Archivo Black, sans-serif';
        g.fillText(APP_ICONS[i].name, 256, y + size + 50);
      });
      made = new CanvasTexture(c);
      made.colorSpace = SRGBColorSpace;
      made.anisotropy = 4;
      setTex(made);
    });
    return () => { alive = false; made?.dispose(); };
  }, [title]);
  return (
    <group>
      <Box p={[0, 1.05, 0.06]} s={[1.15, 2.1, 0.12]} c={COLORS.ink} />
      <Box p={[0, 1.98, 0.125]} s={[0.3, 0.06, 0.01]} c="#0a0a0a" shadow={false} />
      {tex && (
        <mesh position={[0, 1.02, 0.125]}>
          <planeGeometry args={[1.0, 1.9]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

/** Wooden sign standing on the shelf; text is painted onto a canvas texture. */
const Sign: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => {
  const [tex, setTex] = useState<CanvasTexture | null>(null);
  const [hover, setHover] = useState(false);
  useCursor(hover);
  useEffect(() => {
    let alive = true;
    let made: CanvasTexture | null = null;
    document.fonts.load('700 96px Archivo Black').catch(() => {}).then(() => {
      if (!alive) return;
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 256;
      const g = c.getContext('2d')!;
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#121212';
      g.font = '700 120px Archivo Black, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, c.width / 2, c.height / 2 + 6);
      made = new CanvasTexture(c);
      made.colorSpace = SRGBColorSpace;
      made.anisotropy = 4;
      setTex(made);
    });
    return () => { alive = false; made?.dispose(); };
  }, [text]);
  return (
    <group
      position={[0.5, 2.92, 3.6]}
      scale={hover ? 1.05 : 1}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={() => setHover(false)}
    >
      <Box p={[0, 0, 0]} s={[0.08, 0.5, 2.0]} c={COLORS.woodDark} />
      {[-0.7, 0.7].map((z) => <Box key={z} p={[0, -0.22, z]} s={[0.06, 0.2, 0.08]} c={COLORS.woodDark} shadow={false} />)}
      {tex && (
        <mesh position={[0.045, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.88, 0.44]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

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
      <hemisphereLight args={['#ffffff', '#ededed', 1.7]} />
      <directionalLight
        position={[9, 12, 7]}
        intensity={1.35}
        color="#fcfcfc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-normalBias={0.03}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0005}
      />

      <Garden />

      {/* floor + walls */}
      <mesh position={[5, -0.2, 5]} receiveShadow onClick={floorClick}>
        <boxGeometry args={[10, 0.4, 10]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.9} />
      </mesh>
      <Box p={[-0.1, W / 2 - 0.4 / 2, 5]} s={[0.2, W + 0.4, 10]} c={COLORS.wallL} shadow={false} />
      <Box p={[5, W / 2 - 0.4 / 2, -0.1]} s={[10.2, W + 0.4, 0.2]} c={COLORS.wallR} shadow={false} />
      {/* skirting */}
      <Box p={[0.03, 0.08, 5]} s={[0.06, 0.16, 10]} c="#e5e5e5" shadow={false} />
      <Box p={[5, 0.08, 0.03]} s={[10, 0.16, 0.06]} c="#f7f7f7" shadow={false} />
      {/* rug */}
      <Rug position={[5.2, 0.01, 6.5]} size={[4.4, 3.6]} onClick={floorClick} />

      {/* window */}
      <group position={[3.9, 2.0, 0.02]}>
        <Box p={[0, 0, 0]} s={[2.0, 1.4, 0.06]} c="#ffffff" shadow={false} />
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.8, 1.2]} />
          <meshBasicMaterial color="#b2e8ff" />
        </mesh>
        <mesh position={[0.45, 0.25, 0.045]}>
          <circleGeometry args={[0.22, 24]} />
          <meshBasicMaterial color="#f9f9f9" />
        </mesh>
        <Box p={[0, 0, 0.06]} s={[0.06, 1.2, 0.03]} c="#ffffff" shadow={false} />
        <Box p={[0, -0.72, 0.12]} s={[2.2, 0.06, 0.24]} c="#ffffff" />
      </group>

      {/* shelf (projects) */}
      <group>
        {[1.05, 6.15].map((z) => <Box key={z} p={[0.45, 1.3, z]} s={[0.9, 2.6, 0.1]} c={COLORS.wood} />)}
        {[0.09, 0.6, 1.3, 2.0, 2.6].map((y) => <Box key={y} p={[0.45, y, 3.6]} s={[0.9, 0.06, 5.2]} c={COLORS.wood} />)}
        <Box p={[0.04, 1.3, 3.6]} s={[0.04, 2.6, 5.2]} c={COLORS.woodDark} shadow={false} />
        {/* decoration: books + plant */}
        {[0, 1, 2].map((i) => <Box key={i} p={[0.45, 1.53, 4.6 + i * 0.22]} s={[0.5, 0.44 - i * 0.05, 0.16]} c={['#6852eb', '#4bc292', '#ffa64d'][i]} />)}
        {[0, 1].map((i) => <Box key={i} p={[0.45, 2.24, 1.7 + i * 0.22]} s={[0.5, 0.42, 0.16]} c={['#ffe600', '#121212'][i]} />)}
        <mesh position={[0.45, 0.78, 3.4]} castShadow><cylinderGeometry args={[0.12, 0.1, 0.3, 12]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[0.45, 1.02, 3.4]} castShadow><sphereGeometry args={[0.2, 12, 12]} /><meshStandardMaterial color="#4bc25d" /></mesh>
        {/* sign on top of the shelf */}
        <Sign text={labels.shelf} onClick={() => onGo('projects', 0)} />
        {PROJECT_SLOTS.map((s, i) => (
          <Hot key={i} position={[0.45, s.y + 0.03, s.z]} label={labels.projects[i]} tipY={0.85} onSelect={() => onGo('projects', i)}>
            <Box p={[0, 0.25, 0]} s={[0.6, 0.5, 0.9]} c={COLORS.projects[i]} />
            <Box p={[0.31, 0.25, 0]} s={[0.02, 0.18, 0.5]} c="#ffffff" shadow={false} />
          </Hot>
        ))}
      </group>

      {/* door (social) */}
      <Hot position={[0.07, 0, 8.3]} label={labels.social} tipY={2.55} onSelect={() => onGo('social')}>
        <Box p={[0, 1.1, 0]} s={[0.08, 2.2, 1.1]} c="#ffffff" shadow={false} />
        <Box p={[0.04, 1.08, 0]} s={[0.06, 2.06, 0.96]} c="#b2b2b2" shadow={false} />
        <mesh position={[0.1, 1.05, -0.33]}><sphereGeometry args={[0.05, 12, 12]} /><meshStandardMaterial color={COLORS.accent} /></mesh>
        <Box p={[0.08, 1.55, 0]} s={[0.02, 0.5, 0.6]} c="#c0c0c0" shadow={false} />
        <Box p={[0.08, 0.6, 0]} s={[0.02, 0.6, 0.6]} c="#c0c0c0" shadow={false} />
      </Hot>

      {/* picture frame (about) */}
      <Hot position={[7.4, 2.25, 0.06]} label={labels.about} tipY={0.75} onSelect={() => onGo('about')}>
        <Box p={[0, 0, 0]} s={[1.0, 0.9, 0.08]} c="#ffffff" shadow={false} />
        <Suspense fallback={null}><Photo /></Suspense>
      </Hot>

      {/* desk */}
      <group>
        <Box p={[7.5, 0.8, 0.8]} s={[2.8, 0.08, 1.05]} c={COLORS.wood} />
        {[[6.2, 0.4], [8.8, 0.4], [6.2, 1.2], [8.8, 1.2]].map(([x, z], i) => <Box key={i} p={[x, 0.39, z]} s={[0.08, 0.78, 0.08]} c={COLORS.woodDark} />)}
        {/* monitor */}
        <Box p={[7.3, 0.92, 0.55]} s={[0.3, 0.04, 0.2]} c="#121212" />
        <Box p={[7.3, 1.05, 0.5]} s={[0.06, 0.25, 0.06]} c="#121212" />
        <Box p={[7.3, 1.42, 0.5]} s={[1.1, 0.62, 0.05]} c="#121212" />
        <mesh position={[7.3, 1.42, 0.53]}>
          <planeGeometry args={[1.0, 0.52]} />
          <meshBasicMaterial color="#69daab" />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[7.1 + i * 0.07, 1.52 - i * 0.12, 0.535]}>
            <planeGeometry args={[0.45 - i * 0.1, 0.05]} />
            <meshBasicMaterial color="#fdfdfd" />
          </mesh>
        ))}
        <Box p={[7.3, 0.86, 1.0]} s={[0.7, 0.03, 0.22]} c="#ffffff" />
        {/* mug */}
        <mesh position={[6.4, 0.95, 0.9]} castShadow><cylinderGeometry args={[0.09, 0.08, 0.22, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[6.4, 1.06, 0.9]}><cylinderGeometry args={[0.075, 0.075, 0.01, 16]} /><meshStandardMaterial color="#161616" /></mesh>
        {/* lamp */}
        <mesh position={[6.6, 0.88, 0.45]}><cylinderGeometry args={[0.12, 0.14, 0.04, 16]} /><meshStandardMaterial color={COLORS.ink} /></mesh>
        <mesh position={[6.6, 1.15, 0.45]}><cylinderGeometry args={[0.015, 0.015, 0.55, 8]} /><meshStandardMaterial color={COLORS.ink} /></mesh>
        <mesh position={[6.6, 1.45, 0.52]} rotation={[0.5, 0, 0]}><coneGeometry args={[0.16, 0.22, 16, 1, true]} /><meshStandardMaterial color="#ffd166" side={2} /></mesh>
      </group>

      {/* giant phone on the wall (apps) */}
      <Hot position={[1.9, 0.5, 0.02]} label={labels.apps} tipY={2.45} onSelect={() => onGo('apps')}>
        <GiantPhone title={labels.apps} />
      </Hot>

      {/* plant */}
      <group position={[9.4, 0, 0.55]}>
        <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.32, 0.25, 0.6, 16]} /><meshStandardMaterial color="#ffe600" /></mesh>
        {[[0, 1.0, 0, 0.42], [-0.2, 1.35, 0.1, 0.32], [0.18, 1.5, -0.05, 0.3], [0, 1.8, 0, 0.24]].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} castShadow><sphereGeometry args={[r, 14, 14]} /><meshStandardMaterial color={i % 2 ? '#57d267' : '#4bc25d'} roughness={0.9} /></mesh>
        ))}
      </group>

      {/* beanbag */}
      <mesh position={[8.4, 0.28, 8.2]} scale={[1, 0.6, 1]} castShadow receiveShadow onClick={floorClick}>
        <sphereGeometry args={[0.6, 24, 16]} />
        <meshStandardMaterial color="#8fb3ff" roughness={1} />
      </mesh>

      {/* Semih (contact) */}
      <Hot position={[ME[0], 0, ME[1]]} label={labels.contact} tipY={2.45} onSelect={() => onGo('contact')}>
        <group position={[-ME[0], 0, -ME[1]]}>
          <Me playerRef={posRef} onNear={onNearMe} />
        </group>
      </Hot>
      {/* name tag above Semih */}
      <NameTag text="Semih" position={[ME[0], 1.98, ME[1]]} />
      {bubble && (
        <Html position={[7.3, 2.65, 1.95]} center zIndexRange={[30, 20]}>
          <button className="room-bubble" onClick={() => onGo('contact')}>{labels.hello}</button>
        </Html>
      )}

      <Marker goal={goal} posRef={posRef} />
      <Player goal={goal} posRef={posRef} onArrive={onArrive} label={labels.you} />
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
    <Follow posRef={posRef} />
    <Controls />
    <Room {...props} posRef={posRef} />
  </Canvas>
  );
};

/** Orbit within a small range; on phones also pinch to zoom between the whole room and a close view. */
const Controls: React.FC = () => {
  const { width: w, height: h } = useThree((s) => s.size);
  const follow = isFollow(w, h);
  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableZoom={follow}
      minZoom={follow ? fullZoom(w, h) : 0}
      maxZoom={follow ? closeZoom(w, h) * 1.6 : Infinity}
      zoomSpeed={0.8}
      enableDamping={false}
      minAzimuthAngle={Math.PI / 4 - 0.55}
      maxAzimuthAngle={Math.PI / 4 + 0.55}
      minPolarAngle={0.7}
      maxPolarAngle={1.15}
      rotateSpeed={0.5}
    />
  );
};

export default Scene;
