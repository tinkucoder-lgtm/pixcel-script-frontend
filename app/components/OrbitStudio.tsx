"use client";

/**
 * Home hero — orbit canvas + headline + prompt bar with style chip.
 *
 * SCOPE: this component is now JUST the home entry point. It owns the orbit
 * animation, the headline, and the prompt input + style picker. Generate
 * does NOT run a chat inline here anymore — it serializes the payload
 * (description + preset OR custom fonts) into sessionStorage under
 * CHAT_HANDOFF_KEY and routes to /chat, which reads the handoff, fires the
 * first /api/generate-design call, and owns the entire conversation thread.
 *
 * State here is intentionally ephemeral: when the user comes back via "New
 * chat" the component remounts and everything resets — chip back to
 * Editorial Elegant, prompt empty.
 *
 * Canvas resize logic still uses a ResizeObserver because the hero element's
 * height can shift slightly on different viewports / when fonts swap in.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone, type FileRejection } from "react-dropzone";
import { CHAT_HANDOFF_KEY } from "../chat/page";
import { setPendingReferenceImages } from "../lib/referenceImageStash";

// Reference-image upload limits — mirrored in /chat when the FormData is built.
const MAX_REFERENCE_IMAGES = 4;
const MAX_REFERENCE_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_MIME = {
  "image/png": [],
  "image/jpeg": [],
  "image/webp": [],
  "image/gif": [],
};

const PRESETS: Array<{
  key: string;
  label: string;
  desc: string;
  specimen: React.CSSProperties;
}> = [
  {
    key: "editorial-elegant",
    label: "Editorial Elegant",
    desc: "High-contrast editorial serif",
    specimen: { fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontWeight: 500 },
  },
  {
    key: "modern-minimal",
    label: "Modern Minimal",
    desc: "Clean geometric sans-serif",
    specimen: { fontFamily: "'Hanken Grotesk', system-ui, sans-serif", fontWeight: 700, letterSpacing: "-0.01em" },
  },
  {
    key: "warm-handcrafted",
    label: "Warm Handcrafted",
    desc: "Friendly hand-lettered script",
    specimen: { fontFamily: "'Bradley Hand', 'Marker Felt', cursive", fontWeight: 700 },
  },
  {
    key: "classic-serif",
    label: "Classic Serif",
    desc: "Traditional old-style serif",
    specimen: { fontFamily: "'Times New Roman', serif", fontWeight: 500 },
  },
  {
    key: "bold-impact",
    label: "BOLD IMPACT",
    desc: "Heavy condensed sans-serif",
    specimen: { fontFamily: "Impact, 'Arial Black', sans-serif", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 900 },
  },
  {
    key: "vintage-retro",
    label: "Vintage Retro",
    desc: "Retro display slab-serif",
    specimen: { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.02em" },
  },
  {
    key: "luxury-refined",
    label: "Luxury Refined",
    desc: "Elegant thin serif, wide tracking",
    specimen: { fontFamily: "Didot, 'Bodoni 72', serif", fontWeight: 400, letterSpacing: "0.08em", fontVariant: "small-caps" },
  },
  {
    key: "playful-friendly",
    label: "Playful Friendly",
    desc: "Rounded playful display",
    specimen: { fontFamily: "'Trebuchet MS', system-ui, sans-serif", fontWeight: 700 },
  },
];

const NODES = [
  { title: "Doesn't look AI-made", desc: "Engineered around the visual tells — no over-glow, no dead-center symmetry, no mangled text." },
  { title: "Typography you control", desc: "Eight curated type systems, plus optional custom headline and body fonts of your own." },
  { title: "Your words, rendered right", desc: "Your exact headline text, correctly spelled — not the garbled gibberish other tools produce." },
  { title: "Studio-grade style presets", desc: "Complete, considered aesthetics — not random filters slapped on top of a generation." },
  { title: "Publish-ready quality", desc: "Output you can ship, not a rough first draft you have to fix before anyone sees it." },
  { title: "Sentence → design", desc: "From a single plain-language sentence to a finished, downloadable design in under two minutes." },
];

type Orbit = {
  title: string; desc: string;
  angle: number; speed: number;
  rx: number; ry: number; tilt: number;
  dir: 1 | -1; prec: number;
  x: number; y: number; z: number; size: number;
};

export default function OrbitStudio() {
  const router = useRouter();

  // Refs for orbit canvas / hero
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);

  // USP card overlay state
  const [selectedNode, setSelectedNode] = useState(-1);
  const selectedNodeRef = useRef(-1);
  useEffect(() => { selectedNodeRef.current = selectedNode; }, [selectedNode]);
  const hoveredNodeRef = useRef(-1);

  // Studio entry-point state
  const [prompt, setPrompt] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("editorial-elegant");
  const [customFontsOn, setCustomFontsOn] = useState(false);
  const [headlineFont, setHeadlineFont] = useState("");
  const [bodyFont, setBodyFont] = useState("");
  const [stylePopOpen, setStylePopOpen] = useState(false);
  // Reference image upload state
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [refImageError, setRefImageError] = useState<string | null>(null);

  // Object URLs for thumbnail rendering — recomputed when the file list
  // changes, revoked on cleanup so we don't leak blob URLs.
  const previewUrls = useMemo(
    () => referenceImages.map((f) => URL.createObjectURL(f)),
    [referenceImages],
  );
  useEffect(() => () => previewUrls.forEach((u) => URL.revokeObjectURL(u)), [previewUrls]);

  // Textarea auto-grow: clamp to ~8 visible rows (~200px), scroll past that.
  useEffect(() => {
    const el = promptInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = 200;
    const next = Math.min(el.scrollHeight, maxH);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
  }, [prompt]);

  const chipLabel = customFontsOn
    ? "Custom fonts"
    : (PRESETS.find((p) => p.key === selectedPreset)?.label ?? "Editorial Elegant");

  // ===== ORBIT CANVAS =====
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, cx = 0, cy = 0, scale = 0;

    function resize() {
      if (!canvas || !ctx || !stage) return;
      const sr = stage.getBoundingClientRect();
      const heroEl = heroRef.current;
      const hr = heroEl ? heroEl.getBoundingClientRect() : sr;
      W = sr.width; H = sr.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Orbit center pinned to the hero's vertical middle — preserves the
      // "prompt-bar is the core" feel even when stage and hero differ in size.
      cx = W / 2;
      cy = (hr.top - sr.top) + hr.height / 2;
      scale = Math.min(W, hr.height) * 0.46;
    }
    resize();

    const ro = new ResizeObserver(() => resize());
    ro.observe(stage);
    window.addEventListener("resize", resize);

    const dust = Array.from({ length: 70 }, () => ({
      x: Math.random(), y: Math.random(),
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
      prec: 0, x: 0, y: 0, z: 0, size: 0,
    }));
    let mouse = { x: -9999, y: -9999 };
    let coreT = 0;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    const onClick = () => { if (hoveredNodeRef.current >= 0) setSelectedNode(hoveredNodeRef.current); };
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
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
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
      const isActive = i === hoveredNodeRef.current || i === selectedNodeRef.current;
      const depthAlpha = 0.45 + (o.z + 1) * 0.275;
      const tw = 0.75 + 0.25 * Math.sin(performance.now() * 0.0022 + i * 1.7);
      const r = o.size * (isActive ? 1.8 : 1) * (0.85 + 0.15 * tw);
      const glowR = r * (isActive ? 7 : 4.6);
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, glowR);
      g.addColorStop(0, `rgba(150,170,255,${(isActive ? 0.75 : 0.42) * depthAlpha})`);
      g.addColorStop(1, "rgba(150,170,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(o.x, o.y, glowR, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = depthAlpha * (isActive ? 1 : 0.85);
      sparkle(o.x, o.y, r * (isActive ? 5.5 : 3.6), isActive ? "rgba(200,212,255,0.85)" : "rgba(165,185,255,0.55)");
      ctx.fillStyle = "#f3f6ff";
      ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isActive ? "#dbe3ff" : "rgba(219,227,255,0.9)";
      ctx.beginPath(); ctx.arc(o.x, o.y, r * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      if (isActive && selectedNodeRef.current < 0) {
        const label = o.title;
        ctx.font = '600 13px "Hanken Grotesk", sans-serif';
        const lw = ctx.measureText(label).width;
        const below = o.y < cy;
        const px = o.x - (lw + 16) / 2;
        const py = below ? o.y + r + 14 : o.y - r - 42;
        ctx.fillStyle = "rgba(20,23,43,0.96)"; roundRect(px, py, lw + 16, 28, 8); ctx.fill();
        ctx.strokeStyle = "rgba(74,108,255,0.5)"; ctx.lineWidth = 1; roundRect(px, py, lw + 16, 28, 8); ctx.stroke();
        ctx.fillStyle = "#eef0fb"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(label, px + 8, py + 14);
      }
    }
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const t = performance.now();
      const paused = selectedNodeRef.current >= 0;
      if (!paused) orbits.forEach((o) => (o.prec += o.speed * 0.7));
      dust.forEach((p) => {
        const dx = p.x + Math.sin(t * p.sp + p.ph) * 0.02;
        const dy = p.y + Math.cos(t * p.sp + p.ph) * 0.02;
        const px = dx * W, py = dy * H;
        ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(132,153,255,${p.a * (0.6 + Math.sin(t * 0.001 + p.ph) * 0.4)})`;
        ctx.fill();
      });
      orbits.forEach((o, idx) => {
        const active = idx === hoveredNodeRef.current || idx === selectedNodeRef.current;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.tilt + o.prec * o.dir);
        ctx.beginPath(); ctx.ellipse(0, 0, scale * o.rx, scale * o.ry, 0, 0, Math.PI * 2);
        if (active) { ctx.strokeStyle = "rgba(150,170,255,0.6)"; ctx.lineWidth = 1.6; ctx.shadowColor = "rgba(74,108,255,0.7)"; ctx.shadowBlur = 10; }
        else { ctx.strokeStyle = "rgba(125,145,250,0.32)"; ctx.lineWidth = 1.2; ctx.shadowColor = "rgba(74,108,255,0.45)"; ctx.shadowBlur = 6; }
        ctx.stroke(); ctx.restore();
      });
      coreT += 0.015;
      const pulse = 1 + Math.sin(coreT) * 0.08;
      const cgrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.9 * pulse);
      cgrad.addColorStop(0, "rgba(74,108,255,0.10)");
      cgrad.addColorStop(0.5, "rgba(74,108,255,0.04)");
      cgrad.addColorStop(1, "rgba(74,108,255,0)");
      ctx.fillStyle = cgrad;
      ctx.beginPath(); ctx.arc(cx, cy, scale * 0.9 * pulse, 0, Math.PI * 2); ctx.fill();
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
      if (selectedNodeRef.current < 0) {
        let best = -1, bestD = 24;
        orbits.forEach((o, i) => {
          const d = Math.hypot(mouse.x - o.x, mouse.y - o.y);
          if (d < bestD) { bestD = d; best = i; }
        });
        hoveredNodeRef.current = best;
        // canvas is guaranteed non-null by the early return at the top of
        // this effect; the closure boundary loses that narrowing so we
        // assert here rather than re-guard inside the rAF hot path.
        canvas!.style.cursor = best >= 0 ? "pointer" : "default";
      }
      const order = orbits.map((_, i) => i).sort((a, b) => orbits[a].z - orbits[b].z);
      if (selectedNodeRef.current >= 0) {
        const o = orbits[selectedNodeRef.current];
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(o.x, o.y);
        ctx.strokeStyle = "rgba(132,153,255,0.45)"; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
      }
      order.forEach((i) => { if (orbits[i].z < 0) drawNode(orbits[i], i); });
      order.forEach((i) => { if (orbits[i].z >= 0) drawNode(orbits[i], i); });
      rafId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  // === reference-image drop handler ===
  // Validates accepted + rejected files together so the inline error reflects
  // every reason a file didn't make it in (size, type, cumulative cap).
  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setRefImageError(null);
      const remaining = MAX_REFERENCE_IMAGES - referenceImages.length;
      const toAdd = accepted.slice(0, Math.max(0, remaining));
      const problems: string[] = [];
      if (accepted.length > remaining) {
        problems.push(
          `Maximum ${MAX_REFERENCE_IMAGES} reference images — ${accepted.length - remaining} ignored`,
        );
      }
      if (rejected.length > 0) {
        const tooLarge = rejected.some((r) => r.errors.some((e) => e.code === "file-too-large"));
        const wrongType = rejected.some((r) => r.errors.some((e) => e.code === "file-invalid-type"));
        if (tooLarge) problems.push("Each image must be under 8 MB");
        if (wrongType) problems.push("Only PNG, JPEG, WebP, or GIF");
      }
      if (problems.length) setRefImageError(problems.join(" · "));
      if (toAdd.length) setReferenceImages((prev) => [...prev, ...toAdd]);
    },
    [referenceImages.length],
  );

  // noClick + noKeyboard: we don't want the panel itself to open the file
  // picker (the textarea + buttons are inside it). The paperclip button uses
  // the `open` function instead.
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_MIME,
    maxSize: MAX_REFERENCE_IMAGE_BYTES,
    noClick: true,
    noKeyboard: true,
  });

  const removeReferenceImage = useCallback((idx: number) => {
    setRefImageError(null);
    setReferenceImages((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Style popover: outside-click + Escape close
  const styleChipRef = useRef<HTMLButtonElement | null>(null);
  const stylePopRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!stylePopOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (stylePopRef.current?.contains(t)) return;
      if (styleChipRef.current?.contains(t)) return;
      setStylePopOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setStylePopOpen(false); };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [stylePopOpen]);

  // ===== Generate → write handoff, navigate to /chat =====
  // No API call here. /chat reads the sessionStorage payload on mount and
  // owns the entire conversation from that point on.
  const onGenerate = useCallback(() => {
    const v = prompt.trim();
    if (!v) {
      promptInputRef.current?.focus();
      return;
    }
    if (customFontsOn && (!headlineFont.trim() || !bodyFont.trim())) {
      // Surface the missing inputs by opening the popover.
      setStylePopOpen(true);
      return;
    }
    const payload: Record<string, string> = {
      description: v,
      styleLabel: chipLabel,
    };
    if (customFontsOn) {
      payload.headline_font = headlineFont.trim();
      payload.body_font = bodyFont.trim();
    } else {
      payload.font_preset = selectedPreset;
    }
    try {
      sessionStorage.setItem(CHAT_HANDOFF_KEY, JSON.stringify(payload));
    } catch {
      // sessionStorage can throw in private-browsing — fall through; /chat
      // will show its empty state with a back-to-home link.
    }
    // Hand the File objects off via the module-level stash. /chat picks
    // them up on first mount and folds them into the FormData call.
    setPendingReferenceImages(referenceImages);
    router.push("/chat");
  }, [prompt, customFontsOn, headlineFont, bodyFont, chipLabel, selectedPreset, referenceImages, router]);

  return (
    <div className="ps-orbit-stage" ref={stageRef}>
      <canvas ref={canvasRef} id="orbit-canvas" />
      <div className="ps-hero-atmos" />

      <div className="ps-hero" ref={heroRef} id="top">
        <div className="ps-hero-content">
          <div className="ps-eyebrow">
            <span className="ps-pulse-dot" />
            The anti-AI-slop design engine
          </div>
          <h1 className="ps-h1">
            Designs that <em>don't look</em><br />AI-made.
          </h1>
          <p className="ps-sub">
            Describe it. Pick a style. Get a publish-ready marketing design in under
            two minutes — engineered around every tell that screams "a robot made this."
          </p>

          <div className="ps-prompt-core">
            <div
              {...getRootProps({
                className: `ps-compose-panel${isDragActive ? " drag-active" : ""}`,
                id: "ps-prompt-bar",
              })}
            >
              {/* Hidden native input — react-dropzone wires it up. */}
              <input {...getInputProps()} />

              {/* Drop-target overlay — only paints during a drag. */}
              {isDragActive && (
                <div className="ps-drop-overlay" aria-hidden>
                  <div className="ps-drop-overlay-inner">Drop to add reference</div>
                </div>
              )}

              {/* The compose textarea — Enter submits, Shift+Enter newlines. */}
              <textarea
                ref={promptInputRef}
                className="ps-compose-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onGenerate();
                  }
                }}
                placeholder="Describe the design — e.g., Instagram post for a coffee shop opening"
                rows={3}
              />

              {/* Thumbnails row — appears once the user uploads anything. */}
              {referenceImages.length > 0 && (
                <div className="ps-thumbs-row">
                  {referenceImages.map((file, i) => (
                    <div key={`${file.name}-${i}`} className="ps-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrls[i]} alt={`Reference ${i + 1}`} />
                      <button
                        type="button"
                        className="ps-thumb-remove"
                        aria-label={`Remove reference ${i + 1}`}
                        onClick={() => removeReferenceImage(i)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline error — too many files, too large, wrong type. */}
              {refImageError && (
                <div className="ps-ref-error" role="alert">{refImageError}</div>
              )}

              {/* Controls row — chip + add ref on the left, generate on the right. */}
              <div className="ps-compose-controls">
                <button
                  ref={styleChipRef}
                  className="ps-style-chip"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={stylePopOpen}
                  onClick={(e) => { e.stopPropagation(); setStylePopOpen((o) => !o); }}
                >
                  <span className="ps-chip-label">Style:</span>
                  <span className="ps-chip-current">{chipLabel}</span>
                  <span className={`ps-chip-chev ${stylePopOpen ? "up" : ""}`}>▾</span>
                </button>
                <button
                  type="button"
                  className="ps-add-ref"
                  onClick={open}
                  disabled={referenceImages.length >= MAX_REFERENCE_IMAGES}
                  title={
                    referenceImages.length >= MAX_REFERENCE_IMAGES
                      ? `Maximum ${MAX_REFERENCE_IMAGES} reference images`
                      : "Attach a reference image"
                  }
                >
                  📎 Add reference
                </button>
                <div className="ps-compose-spacer" />
                <button onClick={onGenerate} className="ps-generate">Generate →</button>
              </div>
            </div>

            <div
              ref={stylePopRef}
              className={`ps-style-pop ${stylePopOpen ? "open" : ""}`}
              role="dialog"
              aria-label="Pick a type system"
              aria-hidden={!stylePopOpen}
            >
              <div className="ps-pop-head">
                <span className="ps-pop-lbl">Type system</span>
                <button className="ps-pop-close" onClick={() => setStylePopOpen(false)} aria-label="Close">×</button>
              </div>
              <div className="ps-pop-grid">
                {PRESETS.map((p) => {
                  const isSel = !customFontsOn && selectedPreset === p.key;
                  return (
                    <button
                      key={p.key}
                      className={`ps-preset-card ${isSel ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedPreset(p.key);
                        setCustomFontsOn(false);
                        setStylePopOpen(false);
                      }}
                    >
                      <div className="ps-pname" style={p.specimen}>{p.label}</div>
                      <div className="ps-pdesc">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
              <div className="ps-pop-foot">
                <label className="ps-custom-fonts">
                  <input
                    type="checkbox"
                    checked={customFontsOn}
                    onChange={(e) => setCustomFontsOn(e.target.checked)}
                  />
                  Customize fonts separately (overrides preset)
                </label>
                {customFontsOn && (
                  <div className="ps-custom-inputs">
                    <div className="ps-field">
                      <label>Headline font</label>
                      <input
                        type="text"
                        value={headlineFont}
                        onChange={(e) => setHeadlineFont(e.target.value)}
                        placeholder="e.g., Playfair Display"
                      />
                    </div>
                    <div className="ps-field">
                      <label>Body font</label>
                      <input
                        type="text"
                        value={bodyFont}
                        onChange={(e) => setBodyFont(e.target.value)}
                        placeholder="e.g., Inter"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="ps-hero-hint">
            // pick a style from the chip on the left, then generate — your conversation opens in /chat
          </div>
        </div>

        <div className="ps-orbit-dots">
          {NODES.map((n, i) => (
            <button
              key={i}
              title={n.title}
              aria-label={n.title}
              onClick={() => setSelectedNode(i)}
              className={`ps-orbit-dot ${i === selectedNode ? "active" : ""}`}
            />
          ))}
        </div>

        {selectedNode >= 0 && (
          <div className="ps-node-card show">
            <button onClick={() => setSelectedNode(-1)} aria-label="Close" className="ps-close">×</button>
            <div className="ps-card-num">0{selectedNode + 1} / 06</div>
            <h3>{NODES[selectedNode].title}</h3>
            <p>{NODES[selectedNode].desc}</p>
          </div>
        )}

        <div className="ps-scroll-cue"><span>SCROLL</span><span className="ps-cue-line" /></div>
      </div>

      <StudioStyles />
    </div>
  );
}

/** Hero-only CSS. The thread / refine / loading styles moved to /chat. */
function StudioStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes ps-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes ps-coreGlow { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
@keyframes ps-bob { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(6px)} }

.ps-orbit-stage { position: relative; overflow: hidden; }
.ps-orbit-stage > #orbit-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 1; }
.ps-hero-atmos { position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background:
    radial-gradient(ellipse 60% 50% at 50% 50%, rgba(74,108,255,0.10) 0%, transparent 60%),
    radial-gradient(ellipse 100% 100% at 50% 50%, transparent 60%, rgba(7,8,15,0.55) 100%);
}

.ps-hero { position: relative; z-index: 3; height: 100vh; min-height: 860px;
  display: flex; align-items: center; justify-content: center; overflow: visible; }
.ps-hero-content { position: relative; z-index: 4; text-align: center; max-width: 720px; padding: 0 24px; pointer-events: none; }
.ps-hero-content > * { pointer-events: auto; }

.ps-eyebrow { display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em;
  color: var(--cobalt-2); padding: 7px 14px; border: 1px solid var(--line); border-radius: 100px;
  background: rgba(20,23,43,0.6); backdrop-filter: blur(8px); margin-bottom: 30px; }
.ps-pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cobalt-2);
  box-shadow: 0 0 8px var(--cobalt-2); animation: ps-pulse 2s infinite; display: inline-block; }
.ps-h1 { font-family: var(--serif); font-weight: 500; font-size: clamp(2.7rem, 6vw, 5rem);
  line-height: 1.0; letter-spacing: -0.03em; margin-bottom: 22px; text-shadow: 0 4px 40px rgba(7,8,15,0.8); }
.ps-h1 em { font-style: italic; color: var(--cobalt-2); font-weight: 400; }
.ps-sub { font-size: 1.12rem; color: var(--text-dim); max-width: 520px; margin: 0 auto 36px;
  text-shadow: 0 2px 20px rgba(7,8,15,0.9); }

.ps-prompt-core { position: relative; max-width: 580px; margin: 0 auto; }
.ps-prompt-core::before { content: ""; position: absolute; inset: -40px;
  background: radial-gradient(ellipse at center, rgba(74,108,255,0.28) 0%, transparent 70%);
  z-index: -1; pointer-events: none; animation: ps-coreGlow 5s ease-in-out infinite; }

/* Compose panel — replaces the single-line prompt bar. Card-shaped, dark
 * cobalt-tinged border, 24px internal padding. Wraps a textarea, an optional
 * thumbnail row, optional error, and the bottom controls row. */
.ps-compose-panel { position: relative;
  display: flex; flex-direction: column; gap: 14px;
  background: rgba(18,21,40,0.85); backdrop-filter: blur(16px);
  border: 1px solid rgba(74,108,255,0.4); border-radius: 18px; padding: 20px 22px;
  box-shadow: 0 20px 60px -20px rgba(0,0,0,0.8), 0 0 40px -16px var(--cobalt-glow);
  transition: border-color .2s, box-shadow .2s; text-align: left; }
.ps-compose-panel:focus-within { border-color: var(--cobalt);
  box-shadow: 0 20px 60px -20px rgba(0,0,0,0.8), 0 0 0 3px rgba(74,108,255,0.2); }
.ps-compose-panel.drag-active { border-color: var(--cobalt-2);
  box-shadow: 0 20px 60px -20px rgba(0,0,0,0.8), 0 0 0 4px rgba(74,108,255,0.35),
    0 0 80px -10px var(--cobalt-glow); }

.ps-compose-textarea { width: 100%; min-height: 72px; resize: none;
  background: none; border: none; outline: none; color: var(--text);
  font-family: var(--sans); font-size: 1rem; line-height: 1.5;
  padding: 0; /* the panel itself provides padding */ }
.ps-compose-textarea::placeholder { color: var(--text-dim); }

.ps-thumbs-row { display: flex; flex-wrap: wrap; gap: 10px; }
.ps-thumb { position: relative; width: 60px; height: 60px; border-radius: 10px;
  overflow: hidden; border: 1px solid var(--line); background: var(--bg-3);
  flex-shrink: 0; }
.ps-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ps-thumb-remove { position: absolute; top: 2px; right: 2px; width: 20px; height: 20px;
  border-radius: 50%; background: rgba(7,8,15,0.85); color: #fff; border: 1px solid var(--line);
  font-size: 13px; line-height: 1; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s, border-color .15s, transform .15s; }
.ps-thumb-remove:hover { background: var(--cobalt); border-color: var(--cobalt); transform: scale(1.08); }

.ps-ref-error { font-family: var(--mono); font-size: 0.74rem; color: #ff8a80;
  background: rgba(244,67,54,0.08); border: 1px solid rgba(244,67,54,0.35);
  border-radius: 8px; padding: 8px 12px; }

.ps-compose-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ps-compose-spacer { flex: 1; }
.ps-add-ref { display: inline-flex; align-items: center; gap: 6px;
  background: none; border: 1px solid var(--line); color: var(--text-dim);
  padding: 7px 12px; border-radius: 8px; font-family: var(--mono);
  font-size: 0.74rem; font-weight: 500; letter-spacing: 0.04em; cursor: pointer;
  transition: all .15s; }
.ps-add-ref:hover:not(:disabled) { border-color: var(--cobalt-2); color: var(--text); }
.ps-add-ref:disabled { opacity: 0.45; cursor: not-allowed; }

.ps-generate { background: var(--cobalt); color: #fff; border: none; padding: 11px 22px;
  border-radius: 10px; font-weight: 600; font-size: 0.92rem; cursor: pointer;
  white-space: nowrap; transition: background .2s; }
.ps-generate:hover { background: var(--cobalt-2); }

/* Drop overlay — only painted while a drag is over the panel. */
.ps-drop-overlay { position: absolute; inset: 0; z-index: 10; border-radius: 18px;
  background: rgba(74,108,255,0.18); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  pointer-events: none; /* never block the file drop itself */ }
.ps-drop-overlay-inner { padding: 14px 22px; border-radius: 12px;
  background: rgba(7,8,15,0.85); border: 1px dashed var(--cobalt-2);
  color: var(--text); font-family: var(--mono); font-size: 0.86rem;
  letter-spacing: 0.06em; }

.ps-style-chip { display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
  background: rgba(74,108,255,0.14); border: 1px solid rgba(74,108,255,0.4);
  color: var(--cobalt-2); padding: 6px 10px; border-radius: 8px;
  font-family: var(--mono); font-size: 0.72rem; font-weight: 500; letter-spacing: 0.04em;
  cursor: pointer; white-space: nowrap; transition: background .15s, border-color .15s; }
.ps-style-chip:hover { background: rgba(74,108,255,0.22); border-color: var(--cobalt-2); }
.ps-chip-label { color: var(--text-faint); }
.ps-chip-current { color: var(--cobalt-2); }
.ps-chip-chev { font-size: 0.65rem; opacity: 0.7; margin-left: 2px; transition: transform .2s; }
.ps-chip-chev.up { transform: rotate(180deg); }

.ps-style-pop { position: absolute; top: calc(100% + 12px); left: 50%;
  transform: translateX(-50%) translateY(-6px); width: min(780px, calc(100vw - 40px));
  max-height: calc(100vh - 240px); overflow-y: auto; background: rgba(18,21,40,0.96);
  backdrop-filter: blur(20px); border: 1px solid var(--cobalt); border-radius: 18px; padding: 16px;
  box-shadow: 0 30px 80px -20px rgba(0,0,0,0.85), 0 0 50px -16px var(--cobalt-glow);
  z-index: 80; opacity: 0; pointer-events: none; transition: opacity .18s, transform .18s; }
.ps-style-pop.open { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0); }
.ps-pop-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.ps-pop-lbl { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.18em; color: var(--cobalt-2); text-transform: uppercase; }
.ps-pop-close { background: none; border: none; color: var(--text-faint); cursor: pointer; font-size: 1.2rem; padding: 0 4px; }
.ps-pop-close:hover { color: var(--text); }
.ps-pop-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; }

.ps-preset-card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px;
  padding: 11px 12px; cursor: pointer; text-align: left; transition: all .2s; min-height: 60px;
  display: flex; flex-direction: column; justify-content: center; color: var(--text); }
.ps-preset-card:hover { border-color: var(--cobalt-2); background: var(--surface-2); }
.ps-preset-card.selected { border-color: var(--cobalt);
  box-shadow: 0 0 0 1px var(--cobalt), 0 6px 24px -10px var(--cobalt-glow); background: var(--surface-2); }
.ps-pname { font-size: 0.92rem; line-height: 1.05; margin-bottom: 3px; color: var(--text); }
.ps-pdesc { font-family: var(--mono); font-size: 0.62rem; color: var(--text-faint); letter-spacing: 0.02em; }

.ps-pop-foot { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); }
.ps-custom-fonts { display: flex; align-items: center; gap: 10px; color: var(--text-dim);
  font-size: 0.86rem; cursor: pointer; user-select: none; }
.ps-custom-fonts input { accent-color: var(--cobalt); }
.ps-custom-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px; }
.ps-field label { display: block; font-family: var(--mono); font-size: 0.7rem; text-transform: uppercase;
  letter-spacing: 0.14em; color: var(--text-dim); margin-bottom: 7px; }
.ps-field input { width: 100%; background: var(--surface); border: 1px solid var(--line); border-radius: 10px;
  padding: 11px 14px; color: var(--text); font-family: var(--sans); font-size: 0.95rem; outline: none;
  transition: border-color .2s, box-shadow .2s; }
.ps-field input:focus { border-color: var(--cobalt); box-shadow: 0 0 0 3px rgba(74,108,255,0.15); }

.ps-hero-hint { font-family: var(--mono); font-size: 0.74rem; color: var(--text-faint); margin-top: 16px; }

.ps-orbit-dots { position: absolute; bottom: 30px; right: 36px; display: flex; gap: 10px; z-index: 5; }
.ps-orbit-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--line);
  cursor: pointer; transition: all .25s; border: none; padding: 0; }
.ps-orbit-dot:hover { background: var(--text-faint); transform: scale(1.2); }
.ps-orbit-dot.active { background: var(--cobalt); box-shadow: 0 0 12px var(--cobalt-glow); transform: scale(1.3); }

.ps-node-card { position: absolute; top: 50%; left: 50%; width: 300px;
  transform: translate(-50%, -50%) scale(1); background: rgba(20,23,43,0.96); backdrop-filter: blur(16px);
  border: 1px solid var(--cobalt); border-radius: 18px; padding: 26px; z-index: 6;
  box-shadow: 0 28px 70px -18px rgba(0,0,0,0.8), 0 0 40px -12px var(--cobalt-glow); }
.ps-node-card .ps-close { position: absolute; top: 14px; right: 16px; color: var(--text-faint);
  cursor: pointer; font-size: 1.2rem; background: none; border: none; }
.ps-node-card .ps-close:hover { color: var(--text); }
.ps-card-num { font-family: var(--mono); font-size: 0.72rem; color: var(--cobalt-2); letter-spacing: 0.1em; margin-bottom: 10px; }
.ps-node-card h3 { font-family: var(--serif); font-size: 1.5rem; font-weight: 500; margin-bottom: 10px; line-height: 1.12; }
.ps-node-card p { font-size: 0.94rem; color: var(--text-dim); }

.ps-scroll-cue { position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%); z-index: 4;
  font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.2em; color: var(--text-faint);
  display: flex; flex-direction: column; align-items: center; gap: 8px; animation: ps-bob 2.4s ease-in-out infinite; }
.ps-cue-line { width: 1px; height: 28px; background: linear-gradient(var(--cobalt-2), transparent); }

@media (max-width: 760px) { .ps-pop-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 540px) {
  .ps-hero { min-height: 720px; }
  .ps-style-pop { width: calc(100vw - 28px); }
  .ps-pop-grid { grid-template-columns: 1fr; }
  .ps-custom-inputs { grid-template-columns: 1fr; }
}
        `,
      }}
    />
  );
}
