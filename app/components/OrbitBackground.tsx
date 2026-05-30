"use client";

/**
 * Ambient orbit canvas — same visual treatment as the home OrbitStudio hero,
 * but stripped of all interactivity (no hover labels, no USP-card overlay,
 * no orbit-dot indicators). Drops into any container that has
 * `position: relative` and `overflow: hidden`; this component absolutely
 * fills it via `inset: 0`.
 *
 * Used as a decorative background for the About hero (and is reusable on
 * any other static hero that wants the brand-anchoring cosmic feel without
 * the full studio interaction surface).
 *
 * Implementation notes:
 *   - Uses ResizeObserver on the parent so the canvas tracks container
 *     resize (e.g., when the viewport changes or fonts load and the hero
 *     reflows). Same pattern as OrbitStudio.
 *   - cx/cy pinned to the canvas center — no need to align to a child
 *     element like OrbitStudio does for its prompt bar.
 *   - All animation state lives in refs (mouse position omitted entirely
 *     since there's no hover behavior); no React state means no rerenders.
 */

import { useEffect, useRef } from "react";

const NODE_COUNT = 6;
const DUST_COUNT = 70;

type Orbit = {
  angle: number;
  speed: number;
  rx: number;
  ry: number;
  tilt: number;
  dir: 1 | -1;
  prec: number;
  x: number;
  y: number;
  z: number;
  size: number;
};

export default function OrbitBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, cx = 0, cy = 0, scale = 0;

    function resize() {
      if (!canvas || !ctx || !parent) return;
      const r = parent.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2;
      cy = H / 2;
      scale = Math.min(W, H) * 0.46;
    }
    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(parent);
    window.addEventListener("resize", resize);

    // Background dust — same density + drift pattern as OrbitStudio.
    const dust = Array.from({ length: DUST_COUNT }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.6 + 0.3,
      sp: Math.random() * 0.00018 + 0.00004,
      ph: Math.random() * Math.PI * 2,
      a: Math.random() * 0.4 + 0.1,
    }));

    // Six decorative star nodes riding their orbits. No NODES copy attached
    // because we never need to render labels or cards here.
    const orbits: Orbit[] = Array.from({ length: NODE_COUNT }, (_, i) => ({
      angle: (i / NODE_COUNT) * Math.PI * 2,
      speed: 0.0026 + (i % 3) * 0.0005,
      rx: 1.55 + (i % 3) * 0.16,
      ry: 0.62 + (i % 2) * 0.12,
      tilt: (i * Math.PI) / 6 - 0.2,
      dir: i % 2 ? 1 : -1,
      prec: 0, x: 0, y: 0, z: 0, size: 0,
    }));

    let coreT = 0;
    let rafId = 0;

    function sparkle(x: number, y: number, R: number, col: string) {
      if (!ctx) return;
      const inner = R * 0.16;
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const ang = (k * Math.PI) / 4 - Math.PI / 2;
        const rr = k % 2 === 0 ? R : inner;
        const px = x + Math.cos(ang) * rr;
        const py = y + Math.sin(ang) * rr;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    function drawNode(o: Orbit, i: number) {
      if (!ctx) return;
      const depthAlpha = 0.45 + (o.z + 1) * 0.275;
      const tw = 0.75 + 0.25 * Math.sin(performance.now() * 0.0022 + i * 1.7);
      const r = o.size * (0.85 + 0.15 * tw);
      // halo
      const glowR = r * 4.6;
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, glowR);
      g.addColorStop(0, `rgba(150,170,255,${0.42 * depthAlpha})`);
      g.addColorStop(1, "rgba(150,170,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      // sparkle
      ctx.globalAlpha = depthAlpha * 0.85;
      sparkle(o.x, o.y, r * 3.6, "rgba(165,185,255,0.55)");
      // core
      ctx.fillStyle = "#f3f6ff";
      ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(219,227,255,0.9)";
      ctx.beginPath(); ctx.arc(o.x, o.y, r * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const t = performance.now();
      // Slow precession of every orbit's tilt
      orbits.forEach((o) => (o.prec += o.speed * 0.7));

      // Dust
      dust.forEach((p) => {
        const dx = p.x + Math.sin(t * p.sp + p.ph) * 0.02;
        const dy = p.y + Math.cos(t * p.sp + p.ph) * 0.02;
        const px = dx * W, py = dy * H;
        ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(132,153,255,${p.a * (0.6 + Math.sin(t * 0.001 + p.ph) * 0.4)})`;
        ctx.fill();
      });

      // Orbit guide rings
      orbits.forEach((o) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(o.tilt + o.prec * o.dir);
        ctx.beginPath();
        ctx.ellipse(0, 0, scale * o.rx, scale * o.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(125,145,250,0.32)";
        ctx.lineWidth = 1.2;
        ctx.shadowColor = "rgba(74,108,255,0.45)";
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.restore();
      });

      // Center pulse glow
      coreT += 0.015;
      const pulse = 1 + Math.sin(coreT) * 0.08;
      const cgrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.9 * pulse);
      cgrad.addColorStop(0, "rgba(74,108,255,0.10)");
      cgrad.addColorStop(0.5, "rgba(74,108,255,0.04)");
      cgrad.addColorStop(1, "rgba(74,108,255,0)");
      ctx.fillStyle = cgrad;
      ctx.beginPath(); ctx.arc(cx, cy, scale * 0.9 * pulse, 0, Math.PI * 2); ctx.fill();

      // Advance + position the star nodes, then depth-sort back-to-front.
      orbits.forEach((o) => {
        o.angle += o.speed;
        const rot = o.tilt + o.prec * o.dir;
        const lx = Math.cos(o.angle) * scale * o.rx;
        const ly = Math.sin(o.angle) * scale * o.ry;
        o.x = cx + lx * Math.cos(rot) - ly * Math.sin(rot);
        o.y = cy + lx * Math.sin(rot) + ly * Math.cos(rot);
        o.z = Math.sin(o.angle);
        o.size = 2.6 + (o.z + 1) * 2.4;
      });
      const order = orbits.map((_, i) => i).sort((a, b) => orbits[a].z - orbits[b].z);
      order.forEach((i) => { if (orbits[i].z < 0) drawNode(orbits[i], i); });
      order.forEach((i) => { if (orbits[i].z >= 0) drawNode(orbits[i], i); });

      rafId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        zIndex: 1,
        pointerEvents: "none",
      }}
    />
  );
}
