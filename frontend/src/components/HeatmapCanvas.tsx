'use client';

import { useEffect, useRef } from 'react';
import { ClickPoint } from '@/lib/api';

interface Props {
  clicks: ClickPoint[];
  width: number;
  height: number;
}

export default function HeatmapCanvas({ clicks, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (clicks.length === 0) return;

    // Draw radial gradient dots for each click
    const radius = 28;
    clicks.forEach(({ x, y, vw, vh }) => {
      const cx = vw ? (x / vw) * width : x;
      const cy = vh ? (y / vh) * height : y;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, 'rgba(251, 113, 33, 0.85)');
      grad.addColorStop(0.4, 'rgba(234, 179, 8, 0.5)');
      grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Overlay a dot at each exact click position
    clicks.forEach(({ x, y, vw, vh }) => {
      const cx = vw ? (x / vw) * width : x;
      const cy = vh ? (y / vh) * height : y;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
    });
  }, [clicks, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '8px' }}
    />
  );
}
