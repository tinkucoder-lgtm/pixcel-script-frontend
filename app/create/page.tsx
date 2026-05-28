"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// Backend endpoint (single source; swap for prod via env var later)
const API_BASE = "http://localhost:8002";

// Mirrors backend/config/font_presets.py — keep in sync with FONT_PRESETS keys.
// Each preset has a `previewStyle` whose CSS approximates the preset's vibe
// using OS-default fonts (no web-font load needed), so the card itself is a
// type specimen — users see the style, don't just read a label.
const PRESETS: Array<{
  key: string;
  displayName: string;
  headlineSample: string;
  bodySample: string;
  previewStyle: React.CSSProperties;
}> = [
  {
    key: "editorial-elegant",
    displayName: "Editorial Elegant",
    headlineSample: "High-contrast editorial serif (Didot/Bodoni)",
    bodySample: "Clean humanist sans-serif",
    previewStyle: { fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontWeight: 400 },
  },
  {
    key: "modern-minimal",
    displayName: "Modern Minimal",
    headlineSample: "Bold clean geometric sans-serif",
    bodySample: "Light geometric sans-serif",
    previewStyle: { fontFamily: "system-ui, -apple-system, 'Helvetica Neue', sans-serif", fontWeight: 300, letterSpacing: "-0.02em" },
  },
  {
    key: "warm-handcrafted",
    displayName: "Warm Handcrafted",
    headlineSample: "Friendly hand-lettered brush script",
    bodySample: "Rounded humanist sans-serif",
    previewStyle: { fontFamily: "'Comic Sans MS', 'Marker Felt', 'Bradley Hand', cursive", fontWeight: 700 },
  },
  {
    key: "classic-serif",
    displayName: "Classic Serif",
    headlineSample: "Traditional old-style serif (Garamond/Caslon)",
    bodySample: "Complementary old-style serif at text weight",
    previewStyle: { fontFamily: "'Times New Roman', Times, serif", fontWeight: 400 },
  },
  {
    key: "bold-impact",
    displayName: "Bold Impact",
    headlineSample: "Heavy condensed sans-serif",
    bodySample: "Clean neutral grotesque sans-serif",
    previewStyle: { fontFamily: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif", fontWeight: 900, letterSpacing: "0.02em", textTransform: "uppercase" },
  },
  {
    key: "vintage-retro",
    displayName: "Vintage Retro",
    headlineSample: "Retro display slab-serif",
    bodySample: "Vintage-style sans-serif",
    previewStyle: { fontFamily: "'Courier New', Courier, 'Lucida Console', monospace", fontWeight: 700 },
  },
  {
    key: "luxury-refined",
    displayName: "Luxury Refined",
    headlineSample: "Elegant thin serif, generous letter-spacing",
    bodySample: "Refined sans-serif with small caps",
    previewStyle: { fontFamily: "Garamond, 'Hoefler Text', 'Times New Roman', serif", fontVariant: "small-caps", letterSpacing: "0.18em", fontWeight: 400 },
  },
  {
    key: "playful-friendly",
    displayName: "Playful Friendly",
    headlineSample: "Rounded playful display font",
    bodySample: "Friendly rounded sans-serif",
    previewStyle: { fontFamily: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif", fontWeight: 700, letterSpacing: "-0.01em" },
  },
];

type UiState =
  | { kind: "idle" }
  | { kind: "loading"; elapsedS: number; aborter: AbortController }
  | { kind: "success" }  // current image is derived from imageHistory[historyIndex]
  | { kind: "error"; message: string; httpStatus: number | null };

// Loading-state phase narrative driven by elapsed seconds
function phaseNarrative(elapsedS: number): string {
  if (elapsedS < 15) return "Sending prompt to Vertex AI…";
  if (elapsedS < 45) return "Generating composition…";
  if (elapsedS < 90) return "Rendering typography and details…";
  if (elapsedS < 120) return "Still working — Gemini takes a moment for premium output";
  return "Vertex AI is slow today. You can keep waiting or cancel.";
}

export default function CreatePage() {
  const [description, setDescription] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("editorial-elegant");
  const [useCustomFonts, setUseCustomFonts] = useState(false);
  const [customHeadlineFont, setCustomHeadlineFont] = useState("");
  const [customBodyFont, setCustomBodyFont] = useState("");
  const [ui, setUi] = useState<UiState>({ kind: "idle" });
  // Refinement chain — accumulated across iterations of the same Generate.
  // Cleared on fresh Generate and on Generate-another.
  const [refinements, setRefinements] = useState<string[]>([]);
  const [refineInput, setRefineInput] = useState("");
  // Version history — every successful generation pushes the new URL here.
  // Prev/Next navigate without re-generating; Refining from a non-latest
  // position truncates "future" history (linear undo/redo model).
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const currentImageUrl = imageHistory[historyIndex] ?? null;
  const canGoPrev = ui.kind === "success" && historyIndex > 0;
  const canGoNext = ui.kind === "success" && historyIndex < imageHistory.length - 1;

  // Prefill `description` from `?description=…` on first mount — used when the
  // marketing home's hero prompt-bar links here. Only seeds when empty so we
  // never clobber whatever the user has typed mid-session.
  const searchParams = useSearchParams();
  useEffect(() => {
    const fromUrl = searchParams.get("description");
    if (fromUrl && description === "") setDescription(fromUrl);
    // intentionally run once on mount; later URL changes shouldn't overwrite
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drive the elapsed timer when loading
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (ui.kind !== "loading") {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    tickRef.current = setInterval(() => {
      setUi((s) => (s.kind === "loading" ? { ...s, elapsedS: s.elapsedS + 1 } : s));
    }, 1000);
    return () => {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
  }, [ui.kind]);

  const canGenerate =
    description.trim().length > 0 &&
    (useCustomFonts
      ? customHeadlineFont.trim().length > 0 && customBodyFont.trim().length > 0
      : selectedPreset.length > 0) &&
    ui.kind !== "loading";

  function buildDescriptionForApi(extraRefinements: string[]): string {
    // Compose: original description + accumulated refinements (if any).
    // Each refinement listed as a bullet under "Additional instructions:".
    const base = description.trim();
    if (extraRefinements.length === 0) return base;
    const refsBlock = extraRefinements.map((r) => `- ${r}`).join("\n");
    return `${base}\n\nAdditional instructions:\n${refsBlock}`;
  }

  async function callGenerate(refinementsForThisCall: string[]) {
    const aborter = new AbortController();
    setUi({ kind: "loading", elapsedS: 0, aborter });

    // IMPORTANT: every call through this function — initial Generate AND
    // every Refine iteration — MUST include the font fields. The form state
    // (useCustomFonts/selectedPreset/customHeadlineFont/customBodyFont)
    // persists across refinements, and we re-read it here on every call so
    // the backend always knows which fonts to use. Don't change this to
    // omit font fields on refinement requests — without them, Gemini
    // defaults to a generic sans-serif and the typography breaks.
    const body: Record<string, string | undefined> = {
      description: buildDescriptionForApi(refinementsForThisCall),
    };
    // headline and subtext are now backend-optional; the form doesn't collect
    // them, so we don't include them. When omitted, the backend tells Gemini
    // to invent appropriate text.
    if (useCustomFonts) {
      body.headline_font = customHeadlineFont.trim();
      body.body_font = customBodyFont.trim();
    } else {
      body.font_preset = selectedPreset;
    }
    // Refinement: send the currently-displayed image as previous_image_url so
    // Gemini modifies it instead of generating a fresh design. Strip the
    // API_BASE prefix and ?t= cache-buster to get the canonical /outputs/...
    // path the backend resolves on disk.
    if (refinementsForThisCall.length > 0 && currentImageUrl) {
      body.previous_image_url = currentImageUrl
        .replace(API_BASE, "")
        .replace(/\?t=\d+$/, "");
    }

    try {
      const res = await fetch(`${API_BASE}/api/generate-design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: aborter.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        let message = "";
        if (Array.isArray(data?.detail)) {
          // Pydantic validation errors (422)
          message = data.detail.map((e: { msg: string; loc: unknown[] }) =>
            `${(e.loc || []).slice(1).join(".") || "field"}: ${e.msg}`,
          ).join("; ");
        } else if (data?.error && data?.detail) {
          // Our custom {error, detail} shape
          message = `${data.error} — ${data.detail}`;
        } else {
          message = `HTTP ${res.status}`;
        }
        setUi({ kind: "error", message, httpStatus: res.status });
        return;
      }
      const newImageUrl = `${API_BASE}${data.image_url}?t=${Date.now()}`;
      // Linear undo/redo: if the user is mid-history (navigated back), drop
      // the "future" entries past the current index before appending the new
      // image. Otherwise we'd branch the history graph.
      setImageHistory((prev) => {
        const truncated = prev.slice(0, historyIndex + 1);
        const next = [...truncated, newImageUrl];
        setHistoryIndex(next.length - 1);
        return next;
      });
      setUi({ kind: "success" });
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === "AbortError") {
        setUi({ kind: "idle" });
        return;
      }
      setUi({
        kind: "error",
        message: `Network error: ${e?.message ?? "unknown"}`,
        httpStatus: null,
      });
    }
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    // Fresh Generate: clear refinements AND history. New session.
    setRefinements([]);
    setRefineInput("");
    setImageHistory([]);
    setHistoryIndex(0);
    await callGenerate([]);
  }

  async function handleRefine() {
    const text = refineInput.trim();
    if (!text || ui.kind === "loading") return;
    const next = [...refinements, text];
    setRefinements(next);
    setRefineInput("");
    await callGenerate(next);
  }

  function handleCancel() {
    if (ui.kind === "loading") ui.aborter.abort();
  }

  function handleReset() {
    setUi({ kind: "idle" });
    setRefinements([]);
    setRefineInput("");
    setImageHistory([]);
    setHistoryIndex(0);
  }

  function handlePrev() {
    if (canGoPrev) setHistoryIndex(historyIndex - 1);
  }

  function handleNext() {
    if (canGoNext) setHistoryIndex(historyIndex + 1);
  }

  // --- styles (inline, matching existing page.tsx convention) ---
  const COBALT = "#4a6cff";
  const BG = "#0f0f1a";
  const PANEL = "#13131f";
  const BORDER = "#1e1e3a";
  const TEXT = "#e8e8f0";
  const MUTED = "#9CA3AF";

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "system-ui, sans-serif", padding: 32 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            PixelScript <span style={{ color: COBALT }}>/ create</span>
          </h1>
          <p style={{ color: MUTED, margin: "8px 0 0 0", fontSize: 14 }}>
            Generate a premium design with Gemini 3 Pro Image. Typical latency 45–90s.
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* LEFT: form */}
          <section style={{ background: PANEL, padding: 24, borderRadius: 12, border: `1px solid ${BORDER}` }}>
            <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 20 }}>Brief</h2>

            <Field label="Description" required hint="Describe the design you want. The headline and supporting text will be invented by the model to fit; refine afterwards if you want different copy.">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Instagram post for an artisan coffee roaster announcing a new single-origin Ethiopian roast"
                rows={4}
                style={textareaStyle(BORDER, BG, TEXT)}
                disabled={ui.kind === "loading"}
              />
            </Field>

            <Field label="Type system">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {PRESETS.map((p) => {
                  const isSelected = !useCustomFonts && selectedPreset === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => { setUseCustomFonts(false); setSelectedPreset(p.key); }}
                      disabled={ui.kind === "loading"}
                      style={{
                        background: isSelected ? "rgba(74,108,255,0.10)" : BG,
                        border: `1px solid ${isSelected ? COBALT : BORDER}`,
                        borderRadius: 8,
                        padding: "14px 14px",
                        textAlign: "left",
                        color: TEXT,
                        cursor: ui.kind === "loading" ? "wait" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {/* The specimen — preset name rendered in the actual style */}
                      <div
                        style={{
                          ...p.previewStyle,
                          fontSize: 20,
                          lineHeight: 1.1,
                          color: isSelected ? COBALT : TEXT,
                        }}
                      >
                        {p.displayName}
                      </div>
                      {/* Plain caption (always system font so it's readable) */}
                      <div style={{ color: MUTED, fontSize: 11, marginTop: 6, lineHeight: 1.4, fontFamily: "system-ui, sans-serif" }}>
                        {p.headlineSample}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="">
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: MUTED, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={useCustomFonts}
                  onChange={(e) => setUseCustomFonts(e.target.checked)}
                  disabled={ui.kind === "loading"}
                />
                Customize fonts separately (overrides preset)
              </label>
            </Field>

            {useCustomFonts && (
              <>
                <Field label="Headline font description" hint="Plain-language description, e.g. 'a heavy condensed sans-serif'.">
                  <input
                    value={customHeadlineFont}
                    onChange={(e) => setCustomHeadlineFont(e.target.value)}
                    placeholder="a heavy condensed sans-serif with strong presence"
                    style={inputStyle(BORDER, BG, TEXT)}
                    disabled={ui.kind === "loading"}
                  />
                </Field>
                <Field label="Body font description">
                  <input
                    value={customBodyFont}
                    onChange={(e) => setCustomBodyFont(e.target.value)}
                    placeholder="a clean humanist sans-serif"
                    style={inputStyle(BORDER, BG, TEXT)}
                    disabled={ui.kind === "loading"}
                  />
                </Field>
              </>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "14px 20px",
                background: canGenerate ? COBALT : "#2d2d4a",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: canGenerate ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              {ui.kind === "loading" ? "Generating…" : "Generate design →"}
            </button>
          </section>

          {/* RIGHT: result panel */}
          <section style={{ background: PANEL, padding: 24, borderRadius: 12, border: `1px solid ${BORDER}`, minHeight: 500, display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 20 }}>Result</h2>

            {ui.kind === "idle" && (
              <EmptyState text="Fill in the brief and click Generate. Results appear here." muted={MUTED} />
            )}

            {ui.kind === "loading" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 16 }}>
                <div style={{ fontSize: 56, fontWeight: 700, color: COBALT, fontVariantNumeric: "tabular-nums" }}>
                  {formatElapsed(ui.elapsedS)}
                </div>
                <div style={{ color: MUTED, fontSize: 14 }}>{phaseNarrative(ui.elapsedS)}</div>
                {ui.elapsedS >= 120 && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={{
                      marginTop: 8,
                      padding: "8px 16px",
                      background: "transparent",
                      color: TEXT,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 13,
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            {ui.kind === "success" && currentImageUrl && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Version nav: prev / counter / next, shown when there's more than one version */}
                {imageHistory.length > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={!canGoPrev}
                      style={{
                        padding: "6px 12px",
                        background: "transparent",
                        color: canGoPrev ? TEXT : MUTED,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 6,
                        cursor: canGoPrev ? "pointer" : "not-allowed",
                        fontFamily: "inherit",
                        fontSize: 12,
                      }}
                    >
                      ← Previous
                    </button>
                    <div style={{ fontSize: 12, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
                      Version <span style={{ color: COBALT, fontWeight: 600 }}>{historyIndex + 1}</span> of {imageHistory.length}
                    </div>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canGoNext}
                      style={{
                        padding: "6px 12px",
                        background: "transparent",
                        color: canGoNext ? TEXT : MUTED,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 6,
                        cursor: canGoNext ? "pointer" : "not-allowed",
                        fontFamily: "inherit",
                        fontSize: 12,
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}

                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: BG, borderRadius: 8, padding: 12, border: `1px solid ${BORDER}` }}>
                  <img
                    src={currentImageUrl}
                    alt={`Generated design (version ${historyIndex + 1})`}
                    style={{ maxWidth: "100%", maxHeight: 480, borderRadius: 6 }}
                  />
                </div>

                {/* Refinement input — primary "after" action since users iterate */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Refine this design
                    {refinements.length > 0 && (
                      <span style={{ marginLeft: 8, color: COBALT, textTransform: "none", letterSpacing: 0 }}>
                        ({refinements.length} refinement{refinements.length === 1 ? "" : "s"} applied)
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={refineInput}
                      onChange={(e) => setRefineInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRefine(); }}
                      placeholder='e.g. "make the background darker" or "use larger text"'
                      style={{ ...inputStyle(BORDER, BG, TEXT), flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleRefine}
                      disabled={!refineInput.trim()}
                      style={{
                        padding: "10px 18px",
                        background: refineInput.trim() ? COBALT : "#2d2d4a",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        cursor: refineInput.trim() ? "pointer" : "not-allowed",
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>

                {/* Download + Generate-another below the refinement input */}
                <div style={{ display: "flex", gap: 12 }}>
                  <a
                    href={currentImageUrl}
                    download={`pixelscript-design-v${historyIndex + 1}.png`}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      background: "transparent",
                      color: TEXT,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8,
                      textDecoration: "none",
                      textAlign: "center",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    ⬇ Download v{historyIndex + 1}
                  </a>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      background: "transparent",
                      color: TEXT,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Generate another
                  </button>
                </div>
              </div>
            )}

            {ui.kind === "error" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12 }}>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>
                  Generation failed{ui.httpStatus ? ` (HTTP ${ui.httpStatus})` : ""}
                </div>
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)", color: "#FCA5A5", padding: 14, borderRadius: 8, fontSize: 13, lineHeight: 1.5, maxWidth: 420 }}>
                  {ui.message}
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    marginTop: 8,
                    padding: "8px 16px",
                    background: "transparent",
                    color: TEXT,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                  }}
                >
                  Try again
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// --- tiny helpers ---

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}{required && <span style={{ color: "#E74694" }}> *</span>}
        </div>
      )}
      {children}
      {hint && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function EmptyState({ text, muted }: { text: string; muted: string }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontSize: 14, textAlign: "center", padding: 24 }}>
      {text}
    </div>
  );
}

function inputStyle(border: string, bg: string, text: string): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 6,
    color: text,
    fontSize: 14,
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
}

function textareaStyle(border: string, bg: string, text: string): React.CSSProperties {
  return {
    ...inputStyle(border, bg, text),
    resize: "vertical",
    lineHeight: 1.5,
  };
}

function formatElapsed(s: number): string {
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}
