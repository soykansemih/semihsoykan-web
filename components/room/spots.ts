export type PanelKind = 'projects' | 'apps' | 'about' | 'social' | 'contact';

export interface PanelState {
  kind: PanelKind;
  index?: number;
}

export interface Goal {
  x: number;
  z: number;
  then?: PanelState;
  id: number;
}

/** Where the visitor stands to interact with each spot (x, z on the floor). */
export const SPOTS: Record<PanelKind, [number, number]> = {
  projects: [1.9, 3.4],
  apps: [1.9, 1.35],
  about: [5.3, 1.4],
  social: [1.5, 8.2],
  contact: [7.3, 3.15],
};

/** Semih's chair position. */
export const ME: [number, number] = [7.3, 1.95];

/** Project boxes on the shelf: board height and z position. */
export const PROJECT_SLOTS = [
  { y: 0.6, z: 2.0 },
  { y: 0.6, z: 4.7 },
  { y: 1.3, z: 2.9 },
  { y: 2.0, z: 2.9 },
  { y: 1.3, z: 3.85 },
  { y: 2.0, z: 4.3 },
];

export const COLORS = {
  floor: '#e2b48a',
  floorSide: '#c99467',
  wallL: '#f3d9bd',
  wallR: '#f8e6d2',
  rug: '#f4a58a',
  wood: '#d79a62',
  woodDark: '#b97e49',
  accent: '#ff7a59',
  ink: '#3b3348',
  projects: ['#ff8a73', '#7cc7a8', '#ffd166', '#c79bf2', '#ffb347', '#8fb3ff'],
};

/** Keep a floor target inside the room and outside furniture. */
export function resolve(x: number, z: number): [number, number] {
  x = Math.min(9.4, Math.max(1.25, x));
  z = Math.min(9.4, Math.max(0.6, z));
  // desk
  if (x > 5.9 && x < 9.0 && z < 1.6) z = 1.65;
  // plant
  if (x > 8.9 && z < 1.0) z = 1.0;
  // chair + Semih
  const dx = x - ME[0];
  const dz = z - ME[1];
  const d = Math.hypot(dx, dz);
  if (d < 0.8) {
    const k = 0.8 / (d || 1);
    x = ME[0] + (d ? dx * k : 0);
    z = ME[1] + (d ? dz * k : 0.8);
  }
  return [x, z];
}
