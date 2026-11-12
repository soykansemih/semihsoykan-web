import React, { useEffect, useState } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

const FONT = '800 44px "JetBrains Mono", monospace';
const PAD = 18;
const BORDER = 6;
const HEIGHT = 80;

/**
 * A small name label drawn inside the 3D scene (white box, black border), always facing
 * the camera and drawn on top of everything. Kept in the canvas rather than as an HTML
 * overlay so it cannot get lost when the page's DOM overlays are rebuilt.
 */
const NameTag: React.FC<{ text: string; position: [number, number, number]; height?: number }> = ({ text, position, height = 0.3 }) => {
  const [tag, setTag] = useState<{ tex: CanvasTexture; aspect: number } | null>(null);

  useEffect(() => {
    let alive = true;
    let made: CanvasTexture | null = null;
    const draw = () => {
      if (!alive) return;
      const c = document.createElement('canvas');
      const g = c.getContext('2d')!;
      g.font = FONT;
      c.width = Math.ceil(g.measureText(text).width) + 2 * (PAD + BORDER);
      c.height = HEIGHT;
      g.fillStyle = '#121212';
      g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#ffffff';
      g.fillRect(BORDER, BORDER, c.width - 2 * BORDER, c.height - 2 * BORDER);
      g.fillStyle = '#121212';
      g.font = FONT;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, c.width / 2, c.height / 2 + 3);
      made?.dispose();
      made = new CanvasTexture(c);
      made.colorSpace = SRGBColorSpace;
      setTag({ tex: made, aspect: c.width / c.height });
    };
    // draw right away with whatever font is available, then again once the real font is ready
    draw();
    document.fonts?.load(FONT, text).then(draw).catch(() => {});
    return () => { alive = false; made?.dispose(); };
  }, [text]);

  if (!tag) return null;
  return (
    <sprite position={position} scale={[height * tag.aspect, height, 1]} renderOrder={999} raycast={() => {}}>
      <spriteMaterial map={tag.tex} depthTest={false} depthWrite={false} toneMapped={false} />
    </sprite>
  );
};

export default NameTag;
