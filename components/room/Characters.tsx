import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { Goal, ME, PanelState } from './spots';

interface Look {
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  glasses?: boolean;
}

interface Limbs {
  legL: React.RefObject<Group | null>;
  legR: React.RefObject<Group | null>;
  armL: React.RefObject<Group | null>;
  armR: React.RefObject<Group | null>;
}

const useLimbs = (): Limbs => ({
  legL: useRef<Group>(null),
  legR: useRef<Group>(null),
  armL: useRef<Group>(null),
  armR: useRef<Group>(null),
});

const Mat: React.FC<{ c: string }> = ({ c }) => <meshStandardMaterial color={c} roughness={0.75} />;

const Body: React.FC<Look & { limbs: Limbs; seated?: boolean }> = ({ shirt, pants, skin, hair, glasses, limbs, seated }) => {
  const legRot = seated ? -Math.PI / 2 : 0;
  return (
    <group>
      {([['legL', -0.11], ['legR', 0.11]] as const).map(([k, x]) => (
        <group key={k} ref={limbs[k]} position={[x, 0.5, 0]} rotation={[legRot, 0, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <boxGeometry args={[0.15, 0.48, 0.17]} />
            <Mat c={pants} />
          </mesh>
          <mesh position={[0, -0.48, 0.05]} castShadow>
            <boxGeometry args={[0.17, 0.08, 0.27]} />
            <Mat c="#2d2a35" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.84, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.32, 6, 16]} />
        <Mat c={shirt} />
      </mesh>
      {([['armL', -0.31], ['armR', 0.31]] as const).map(([k, x]) => (
        <group key={k} ref={limbs[k]} position={[x, 1.04, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
            <Mat c={shirt} />
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <sphereGeometry args={[0.075, 12, 12]} />
            <Mat c={skin} />
          </mesh>
        </group>
      ))}
      <group position={[0, 1.44, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.27, 32, 24]} />
          <Mat c={skin} />
        </mesh>
        <mesh position={[0, 0.03, -0.03]} rotation={[-0.35, 0, 0]}>
          <sphereGeometry args={[0.29, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <Mat c={hair} />
        </mesh>
        {[-0.09, 0.09].map((x) => (
          <mesh key={x} position={[x, -0.01, 0.25]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        ))}
        {[-0.15, 0.15].map((x) => (
          <mesh key={x} position={[x, -0.09, 0.21]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            <meshStandardMaterial color="#f59a8a" transparent opacity={0.6} />
          </mesh>
        ))}
        {glasses && (
          <group position={[0, -0.01, 0.27]}>
            {[-0.09, 0.09].map((x) => (
              <mesh key={x} position={[x, 0, 0]}>
                <torusGeometry args={[0.065, 0.013, 8, 24]} />
                <meshStandardMaterial color="#222" />
              </mesh>
            ))}
            <mesh>
              <boxGeometry args={[0.05, 0.012, 0.012]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};

const lerpAngle = (a: number, b: number, t: number) => {
  const d = ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return a + d * t;
};

/** The visitor's character: walks toward the current goal. */
export const Player: React.FC<{
  goal: Goal | null;
  posRef: React.MutableRefObject<Vector3>;
  onArrive: (p: PanelState) => void;
}> = ({ goal, posRef, onArrive }) => {
  const g = useRef<Group>(null);
  const limbs = useLimbs();
  const target = useRef<Vector3 | null>(null);
  const pending = useRef<PanelState | undefined>(undefined);
  const swing = useRef(0);

  useEffect(() => {
    if (!goal) return;
    target.current = new Vector3(goal.x, 0, goal.z);
    pending.current = goal.then;
  }, [goal]);

  useFrame((state, dt) => {
    if (!g.current) return;
    const p = posRef.current;
    const t = state.clock.elapsedTime;
    let walking = false;
    if (target.current) {
      const d = target.current.clone().sub(p);
      const dist = d.length();
      if (dist > 0.04) {
        p.addScaledVector(d.normalize(), Math.min(dist, 3.2 * dt));
        walking = true;
        g.current.rotation.y = lerpAngle(g.current.rotation.y, Math.atan2(d.x, d.z), 1 - Math.exp(-12 * dt));
      } else {
        target.current = null;
        const then = pending.current;
        pending.current = undefined;
        if (then) {
          // face what we came for
          const face: Record<string, number> = { projects: -Math.PI / 2, social: -Math.PI / 2, about: Math.PI, apps: Math.PI, contact: Math.PI };
          g.current.userData.face = face[then.kind];
          onArrive(then);
        }
      }
    } else if (g.current.userData.face !== undefined) {
      g.current.rotation.y = lerpAngle(g.current.rotation.y, g.current.userData.face, 1 - Math.exp(-8 * dt));
    }
    if (walking) g.current.userData.face = undefined;

    const target_swing = walking ? Math.sin(t * 11) * 0.7 : 0;
    swing.current += (target_swing - swing.current) * Math.min(1, dt * 18);
    const s = swing.current;
    if (limbs.legL.current) limbs.legL.current.rotation.x = s;
    if (limbs.legR.current) limbs.legR.current.rotation.x = -s;
    if (limbs.armL.current) limbs.armL.current.rotation.x = -s * 0.8;
    if (limbs.armR.current) limbs.armR.current.rotation.x = s * 0.8;
    g.current.position.set(p.x, walking ? Math.abs(Math.sin(t * 11)) * 0.05 : 0, p.z);
    // idle breathing
    if (!walking) g.current.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
  });

  return (
    <group ref={g} rotation={[0, Math.PI, 0]}>
      <Body shirt="#ffd166" pants="#3b3b4f" skin="#f2c6a0" hair="#7a4a2a" limbs={limbs} />
    </group>
  );
};

/** Semih, sitting on a swivel chair; turns and waves when the visitor comes near. */
export const Me: React.FC<{
  playerRef: React.MutableRefObject<Vector3>;
  onNear: (near: boolean) => void;
}> = ({ playerRef, onNear }) => {
  const g = useRef<Group>(null);
  const limbs = useLimbs();
  const wasNear = useRef(false);

  useFrame((state, dt) => {
    if (!g.current) return;
    const t = state.clock.elapsedTime;
    const p = playerRef.current;
    const dx = p.x - ME[0];
    const dz = p.z - ME[1];
    const near = Math.hypot(dx, dz) < 2.6;
    if (near !== wasNear.current) {
      wasNear.current = near;
      onNear(near);
    }
    const yaw = near ? Math.atan2(dx, dz) : Math.PI + Math.sin(t * 0.6) * 0.15;
    g.current.rotation.y = lerpAngle(g.current.rotation.y, yaw, 1 - Math.exp(-5 * dt));
    const armR = limbs.armR.current;
    const armL = limbs.armL.current;
    if (armR) {
      const z = near ? 2.6 + Math.sin(t * 9) * 0.35 : 0.15;
      const x = near ? 0 : -1.1 + Math.sin(t * 14) * 0.08;
      armR.rotation.z += (z - armR.rotation.z) * Math.min(1, dt * 10);
      armR.rotation.x += (x - armR.rotation.x) * Math.min(1, dt * 10);
    }
    if (armL) armL.rotation.x += ((near ? 0 : -1.1 + Math.sin(t * 13 + 1) * 0.08) - armL.rotation.x) * Math.min(1, dt * 10);
  });

  return (
    <group position={[ME[0], 0, ME[1]]}>
      {/* chair base (doesn't swivel) */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.44, 12]} />
        <meshStandardMaterial color="#5b5266" />
      </mesh>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.06, 5]} />
        <meshStandardMaterial color="#5b5266" />
      </mesh>
      <group ref={g} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.46, 0.05]} castShadow>
          <boxGeometry args={[0.6, 0.08, 0.6]} />
          <meshStandardMaterial color="#ff8a73" />
        </mesh>
        <mesh position={[0, 0.85, -0.26]} castShadow>
          <boxGeometry args={[0.58, 0.7, 0.08]} />
          <meshStandardMaterial color="#e46f58" />
        </mesh>
        <group position={[0, 0.0, 0]}>
          <Body shirt="#4f7cff" pants="#2f3b66" skin="#f2c6a0" hair="#3a2a20" glasses seated limbs={limbs} />
        </group>
      </group>
    </group>
  );
};
