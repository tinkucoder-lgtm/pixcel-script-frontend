"use client";

/**
 * Full-bleed hero with a Canvas 2D orbit animation — six shining-star "USP"
 * nodes ride elliptical orbits around a center glow. Hovering a star shows a
 * label; clicking opens a card with the full USP description. The hero also
 * carries the headline + prompt bar; submitting the prompt navigates to
 * /create?description=… so the studio can prefill it.
 *
 * Ported from design-reference/index.html. The drawing/state logic lives in
 * refs (mutable, not React state) so the rAF loop doesn't trigger re-renders
 * 60×/s; only `selected` is React state, since the card overlay is React.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const NODES = [
  {
    title: "Doesn't look AI-made",
    desc: "Engineered around the visual tells — no over-glow, no dead-center symmetry, no mangled text.",
  },
  {
    title: "Typography you control",
    desc: "Eight curated type systems, plus optional custom headline and body fonts of your own.",
  },
  {
    title: "Your words, rendered right",
    desc: "Your exact headline text, correctly spelled — not the garbled gibberish other tools produce.",
  },
  {
    title: "Studio-grade style presets",
    desc: "Complete, considered aesthetics — not random filters slapped on top of a generation.",
  },
  {
    title: "Publish-ready quality",
    desc: "Output you can ship, not a rough first draft you have to fix before anyone sees it.",
  },
  {
    title: "Sentence → design",
    desc: "From a single plain-language sentence to a finished, downloadable design in under two minutes.",
  },
];

type Orbit = {
  title: string;
  desc: string;
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

export default function OrbitHero() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selected, setSelected] = useState(-1);
  const [prompt, setPrompt] = useState("");

  // Refs for hover state — written from rAF, no re-render needed.
  const hoveredRef = useRef(-1);
  const selectedRef = useRef(-1);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, cx = 0, cy = 0, scale = 0;

    function resize() {
      if (!canvas || !ctx) return;
      const r = canvas.getBoundingClientRect();
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
    window.addEventListener("resize", resize);

    // 70 dust motes drift through the background.
    const dust = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.3,
      sp: Math.random() * 0.00018 + 0.00004,
      ph: Math.random() * Math.PI * 2,
      a: Math.random() * 0.4 + 0.1,
    }));

    const orbits: Orbit[] = NODES.map((n, i) => ({
      ...n,
      angle: (i / NODES.length) * Math.PI * 2,
      speed: 0.0026 + (i % 3) * 0.0005,
      rx: 1.55 + (i % 3) * 0.16,
      ry: 0.62 + (i % 2) * 0.12,
      tilt: (i * Math.PI) / 6 - 0.2,
      dir: i % 2 ? 1 : -1,
      prec: 0,
      x: 0,
      y: 0,
      z: 0,
      size: 0,
    }));

    let mouse = { x: -9999, y: -9999 };
    let coreT = 0;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onClick = () => {
      if (hoveredRef.current >= 0) setSelected(hoveredRef.current);
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

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
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function drawNode(o: Orbit, i: number) {
      if (!ctx) return;
      const isActive = i === hoveredRef.current || i === selectedRef.current;
      const depthAlpha = 0.45 + (o.z + 1) * 0.275;
      const tw = 0.75 + 0.25 * Math.sin(performance.now() * 0.0022 + i * 1.7);
      const r = o.size * (isActive ? 1.8 : 1) * (0.85 + 0.15 * tw);

      // soft halo
      const glowR = r * (isActive ? 7 : 4.6);
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, glowR);
      g.addColorStop(0, `rgba(150,170,255,${(isActive ? 0.75 : 0.42) * depthAlpha})`);
      g.addColorStop(1, "rgba(150,170,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // 4-point sparkle flare
      ctx.globalAlpha = depthAlpha * (isActive ? 1 : 0.85);
      sparkle(
        o.x,
        o.y,
        r * (isActive ? 5.5 : 3.6),
        isActive ? "rgba(200,212,255,0.85)" : "rgba(165,185,255,0.55)"
      );

      // bright core
      ctx.fillStyle = "#f3f6ff";
      ctx.beginPath();
      ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isActive ? "#dbe3ff" : "rgba(219,227,255,0.9)";
      ctx.beginPath();
      ctx.arc(o.x, o.y, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // hover label (only when not viewing a card)
      if (isActive && selectedRef.current < 0) {
        const label = o.title;
        ctx.font = '600 13px "Hanken Grotesk", sans-serif';
        const lw = ctx.measureText(label).width;
        const below = o.y < cy;
        const px = o.x - (lw + 16) / 2;
        const py = below ? o.y + r + 14 : o.y - r - 42;
        ctx.fillStyle = "rgba(20,23,43,0.96)";
        roundRect(px, py, lw + 16, 28, 8);
        ctx.fill();
        ctx.strokeStyle = "rgba(74,108,255,0.5)";
        ctx.lineWidth = 1;
        roundRect(px, py, lw + 16, 28, 8);
        ctx.stroke();
        ctx.fillStyle = "#eef0fb";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(label, px + 8, py + 14);
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const t = performance.now();
      const paused = selectedRef.current >= 0;

      if (!paused) orbits.forEach((o) => (o.prec += o.speed * 0.7));

      // dust drift
      dust.forEach((p) => {
        const dx = p.x + Math.sin(t * p.sp + p.ph) * 0.02;
        const dy = p.y + Math.cos(t * p.sp + p.ph) * 0.02;
        const px = dx * W, py = dy * H;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(132,153,255,${p.a * (0.6 + Math.sin(t * 0.001 + p.ph) * 0.4)})`;
        ctx.fill();
      });

      // orbit guide rings
      orbits.forEach((o, idx) => {
        const active = idx === hoveredRef.current || idx === selectedRef.current;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(o.tilt + o.prec * o.dir);
        ctx.beginPath();
        ctx.ellipse(0, 0, scale * o.rx, scale * o.ry, 0, 0, Math.PI * 2);
        if (active) {
          ctx.strokeStyle = "rgba(150,170,255,0.6)";
          ctx.lineWidth = 1.6;
          ctx.shadowColor = "rgba(74,108,255,0.7)";
          ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = "rgba(125,145,250,0.32)";
          ctx.lineWidth = 1.2;
          ctx.shadowColor = "rgba(74,108,255,0.45)";
          ctx.shadowBlur = 6;
        }
        ctx.stroke();
        ctx.restore();
      });

      // soft pulsing core glow
      coreT += 0.015;
      const pulse = 1 + Math.sin(coreT) * 0.08;
      const cgrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.9 * pulse);
      cgrad.addColorStop(0, "rgba(74,108,255,0.10)");
      cgrad.addColorStop(0.5, "rgba(74,108,255,0.04)");
      cgrad.addColorStop(1, "rgba(74,108,255,0)");
      ctx.fillStyle = cgrad;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * 0.9 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // advance node positions
      orbits.forEach((o) => {
        if (!paused) o.angle += o.speed;
        const rot = o.tilt + o.prec * o.dir;
        const lx = Math.cos(o.angle) * scale * o.rx;
        const ly = Math.sin(o.angle) * scale * o.ry;
        o.x = cx + lx * Math.cos(rot) - ly * Math.sin(rot);
        o.y = cy + lx * Math.sin(rot) + ly * Math.cos(rot);
        o.z = Math.sin(o.angle);
        o.size = 2.6 + (o.z + 1) * 2.4;
      });

      // hover hit-testing — pick nearest node within 24px of cursor
      if (selectedRef.current < 0) {
        let best = -1, bestD = 24;
        orbits.forEach((o, i) => {
          const d = Math.hypot(mouse.x - o.x, mouse.y - o.y);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        hoveredRef.current = best;
        canvas.style.cursor = best >= 0 ? "pointer" : "default";
      }

      const order = orbits.map((_, i) => i).sort((a, b) => orbits[a].z - orbits[b].z);

      // dashed leader-line from core to the selected node
      if (selectedRef.current >= 0) {
        const o = orbits[selectedRef.current];
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(o.x, o.y);
        ctx.strokeStyle = "rgba(132,153,255,0.45)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // back-to-front: behind-the-center stars first, then in-front ones
      order.forEach((i) => {
        if (orbits[i].z < 0) drawNode(orbits[i], i);
      });
      order.forEach((i) => {
        if (orbits[i].z >= 0) drawNode(orbits[i], i);
      });

      rafId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitPrompt = () => {
    const trimmed = prompt.trim();
    const qs = trimmed ? `?description=${encodeURIComponent(trimmed)}` : "";
    router.push(`/create${qs}`);
  };

  return (
    <div
      className="ps-hero"
      style={{
        position: "relative",
        height: "100vh",
        minHeight: 720,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        id="orbit-canvas"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(74,108,255,0.10) 0%, transparent 60%), radial-gradient(ellipse 100% 100% at 50% 50%, transparent 60%, rgba(7,8,15,0.55) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 4,
          textAlign: "center",
          maxWidth: 720,
          padding: "0 24px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--mono)",
            fontSize: "0.72rem",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "var(--cobalt-2)",
            padding: "7px 14px",
            border: "1px solid var(--line)",
            borderRadius: 100,
            background: "rgba(20, 23, 43, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            marginBottom: 30,
            pointerEvents: "auto",
          }}
        >
          <span className="ps-pulse-dot" />
          The anti-AI-slop design engine
        </div>

        <h1
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: "clamp(2.7rem, 6vw, 5rem)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            marginBottom: 22,
            textShadow: "0 4px 40px rgba(7,8,15,0.8)",
            pointerEvents: "auto",
          }}
        >
          Designs that{" "}
          <em style={{ fontStyle: "italic", color: "var(--cobalt-2)", fontWeight: 400 }}>
            don't look
          </em>
          <br />
          AI-made.
        </h1>

        <p
          style={{
            fontSize: "1.12rem",
            color: "var(--text-dim)",
            maxWidth: 520,
            margin: "0 auto 36px",
            textShadow: "0 2px 20px rgba(7,8,15,0.9)",
            pointerEvents: "auto",
          }}
        >
          Describe it. Pick a style. Get a publish-ready marketing design in under two
          minutes — engineered around every tell that screams "a robot made this."
        </p>

        <div
          className="ps-prompt-core"
          style={{ position: "relative", maxWidth: 580, margin: "0 auto", pointerEvents: "auto" }}
        >
          <div
            className="ps-prompt-bar"
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(18, 21, 40, 0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(74,108,255,0.4)",
              borderRadius: 16,
              padding: "9px 9px 9px 20px",
              boxShadow:
                "0 20px 60px -20px rgba(0,0,0,0.8), 0 0 40px -16px var(--cobalt-glow)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitPrompt();
              }}
              placeholder="An Instagram post for a coffee shop opening…"
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontFamily: "var(--sans)",
                fontSize: "1rem",
              }}
            />
            <button
              onClick={submitPrompt}
              style={{
                background: "var(--cobalt)",
                color: "#fff",
                border: "none",
                padding: "12px 22px",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: "0.92rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.2s",
              }}
            >
              Generate →
            </button>
          </div>
        </div>

        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.74rem",
            color: "var(--text-faint)",
            marginTop: 16,
            pointerEvents: "auto",
          }}
        >
          // hover the orbiting stars to see what makes it different
        </div>
      </div>

      {/* Bottom-right dot indicators — clickable shortcut to each USP card. */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          right: 36,
          display: "flex",
          gap: 10,
          zIndex: 5,
        }}
      >
        {NODES.map((n, i) => (
          <button
            key={i}
            title={n.title}
            aria-label={n.title}
            onClick={() => setSelected(i)}
            className="ps-orbit-dot"
            data-active={i === selected || undefined}
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: i === selected ? "var(--cobalt)" : "var(--line)",
              boxShadow: i === selected ? "0 0 12px var(--cobalt-glow)" : "none",
              transform: i === selected ? "scale(1.3)" : "scale(1)",
              cursor: "pointer",
              transition: "all 0.25s",
              border: "none",
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* "SCROLL ↓" cue */}
      <div
        className="ps-scroll-cue"
        style={{
          position: "absolute",
          bottom: 26,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 4,
          fontFamily: "var(--mono)",
          fontSize: "0.68rem",
          letterSpacing: "0.2em",
          color: "var(--text-faint)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>SCROLL</span>
        <span
          style={{
            width: 1,
            height: 28,
            background: "linear-gradient(var(--cobalt-2), transparent)",
            display: "block",
          }}
        />
      </div>

      {/* USP card overlay — shown when a node is selected. */}
      {selected >= 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 300,
            transform: "translate(-50%, -50%) scale(1)",
            background: "rgba(20, 23, 43, 0.96)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--cobalt)",
            borderRadius: 18,
            padding: 26,
            zIndex: 6,
            boxShadow:
              "0 28px 70px -18px rgba(0,0,0,0.8), 0 0 40px -12px var(--cobalt-glow)",
            transition: "opacity 0.3s, transform 0.3s",
          }}
        >
          <button
            onClick={() => setSelected(-1)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 14,
              right: 16,
              color: "var(--text-faint)",
              cursor: "pointer",
              fontSize: "1.2rem",
              background: "none",
              border: "none",
            }}
          >
            ×
          </button>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "0.72rem",
              color: "var(--cobalt-2)",
              letterSpacing: "0.1em",
              marginBottom: 10,
            }}
          >
            0{selected + 1} / 06
          </div>
          <h3
            style={{
              fontFamily: "var(--serif)",
              fontSize: "1.5rem",
              fontWeight: 500,
              marginBottom: 10,
              lineHeight: 1.12,
            }}
          >
            {NODES[selected].title}
          </h3>
          <p style={{ fontSize: "0.94rem", color: "var(--text-dim)" }}>
            {NODES[selected].desc}
          </p>
        </div>
      )}

      <style jsx global>{`
        @keyframes ps-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes ps-bob {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
        @keyframes ps-coreGlow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        .ps-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--cobalt-2);
          box-shadow: 0 0 8px var(--cobalt-2);
          animation: ps-pulse 2s infinite;
          display: inline-block;
        }
        .ps-scroll-cue { animation: ps-bob 2.4s ease-in-out infinite; }
        .ps-prompt-core::before {
          content: "";
          position: absolute;
          inset: -40px;
          background: radial-gradient(ellipse at center, rgba(74,108,255,0.28) 0%, transparent 70%);
          z-index: -1;
          pointer-events: none;
          animation: ps-coreGlow 5s ease-in-out infinite;
        }
        .ps-prompt-bar:focus-within {
          border-color: var(--cobalt) !important;
          box-shadow: 0 20px 60px -20px rgba(0,0,0,0.8), 0 0 0 3px rgba(74,108,255,0.2) !important;
        }
        .ps-prompt-bar input::placeholder { color: var(--text-faint); }
        .ps-prompt-bar button:hover { background: var(--cobalt-2) !important; }
        .ps-orbit-dot:hover {
          background: var(--text-faint) !important;
          transform: scale(1.2) !important;
        }
        .ps-orbit-dot[data-active]:hover {
          background: var(--cobalt) !important;
          transform: scale(1.3) !important;
        }
        @media (max-width: 540px) {
          .ps-hero { min-height: 640px !important; }
        }
      `}</style>
    </div>
  );
}
