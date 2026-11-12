import React, { useEffect, useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';

const RED = '#7d1f22';
const RED_DARK = '#5e1519';
const NAVY = '#1c2948';
const CREAM = '#ead9b4';
const GOLD = '#c99a4a';

const W = 1100;
const H = 900;

const diamond = (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) => {
  g.beginPath();
  g.moveTo(x, y - ry);
  g.lineTo(x + rx, y);
  g.lineTo(x, y + ry);
  g.lineTo(x - rx, y);
  g.closePath();
};

/** Paints an antique (Persian-style) carpet: fringes, layered borders, a lattice field and a centre medallion. */
const paint = () => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;

  // fringes on the two short ends
  const F = 26;
  g.fillStyle = CREAM;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#b9a987';
  for (let y = 4; y < H; y += 9) {
    g.fillRect(0, y, F, 3);
    g.fillRect(W - F, y, F, 3);
  }

  // outer navy border with a row of diamonds
  const band = (inset: number, color: string) => {
    g.fillStyle = color;
    g.fillRect(F + inset, inset, W - 2 * F - 2 * inset, H - 2 * inset);
  };
  band(0, NAVY);
  const B = 78; // border width
  const row = (x0: number, y0: number, x1: number, y1: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      g.fillStyle = GOLD;
      diamond(g, x, y, 20, 24);
      g.fill();
      g.fillStyle = RED;
      diamond(g, x, y, 10, 12);
      g.fill();
    }
  };
  row(F + B, B / 2, W - F - B, B / 2, 16);
  row(F + B, H - B / 2, W - F - B, H - B / 2, 16);
  row(F + B / 2, B, F + B / 2, H - B, 13);
  row(W - F - B / 2, B, W - F - B / 2, H - B, 13);
  // corner rosettes
  [[F + B / 2, B / 2], [W - F - B / 2, B / 2], [F + B / 2, H - B / 2], [W - F - B / 2, H - B / 2]].forEach(([x, y]) => {
    g.fillStyle = CREAM;
    diamond(g, x, y, 24, 24);
    g.fill();
    g.fillStyle = RED;
    diamond(g, x, y, 12, 12);
    g.fill();
  });

  // guard stripes, then the red field
  band(B, CREAM);
  band(B + 8, GOLD);
  band(B + 22, CREAM);
  band(B + 30, RED);

  // lattice of small diamonds across the field
  const x0 = F + B + 30;
  const y0 = B + 30;
  const fw = W - 2 * x0;
  const fh = H - 2 * y0;
  g.save();
  g.beginPath();
  g.rect(x0, y0, fw, fh);
  g.clip();
  for (let j = 0; j * 44 < fh + 44; j++) {
    for (let i = 0; i * 56 < fw + 56; i++) {
      const x = x0 + i * 56 + (j % 2 ? 28 : 0);
      const y = y0 + j * 44;
      g.fillStyle = RED_DARK;
      diamond(g, x, y, 16, 14);
      g.fill();
      g.fillStyle = GOLD;
      diamond(g, x, y, 4, 4);
      g.fill();
    }
  }
  // quarter medallions in the corners of the field
  [[x0, y0], [x0 + fw, y0], [x0, y0 + fh], [x0 + fw, y0 + fh]].forEach(([x, y]) => {
    g.fillStyle = NAVY;
    diamond(g, x, y, 170, 140);
    g.fill();
    g.strokeStyle = CREAM;
    g.lineWidth = 6;
    diamond(g, x, y, 170, 140);
    g.stroke();
    g.fillStyle = GOLD;
    diamond(g, x, y, 90, 74);
    g.fill();
  });
  g.restore();

  // centre medallion with pendants
  const cx = W / 2;
  const cy = H / 2;
  g.fillStyle = CREAM;
  diamond(g, cx, cy, 300, 215);
  g.fill();
  g.fillStyle = NAVY;
  diamond(g, cx, cy, 284, 203);
  g.fill();
  g.fillStyle = GOLD;
  diamond(g, cx, cy, 214, 152);
  g.fill();
  g.fillStyle = RED;
  diamond(g, cx, cy, 190, 134);
  g.fill();
  g.fillStyle = CREAM;
  diamond(g, cx, cy, 110, 78);
  g.fill();
  g.fillStyle = NAVY;
  diamond(g, cx, cy, 86, 60);
  g.fill();
  g.fillStyle = GOLD;
  diamond(g, cx, cy, 34, 24);
  g.fill();
  [-1, 1].forEach((s) => {
    g.fillStyle = CREAM;
    diamond(g, cx + s * 345, cy, 44, 30);
    g.fill();
    g.fillStyle = NAVY;
    diamond(g, cx + s * 345, cy, 30, 20);
    g.fill();
  });

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

/** Antique carpet lying on the floor. */
const Rug: React.FC<{ position: [number, number, number]; size: [number, number]; onClick: (e: ThreeEvent<MouseEvent>) => void }> = ({ position, size, onClick }) => {
  const tex = useMemo(paint, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onClick}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
};

export default Rug;
