"use client";

/**
 * /chat — the conversational design page.
 *
 * Owns ALL conversation state: the turns array, the first generation kickoff
 * from the sessionStorage handoff, refinement chaining, retry/cancel/download.
 *
 * Mounted via router.push('/chat') from OrbitStudio after Generate. The home
 * writes the initial payload to sessionStorage under HANDOFF_KEY; this page
 * reads-then-clears it on first mount and fires the first /api/generate-design
 * call automatically. Direct navigation to /chat (no handoff) shows a friendly
 * empty state with a link back home, so the route never feels broken.
 *
 * Top bar is intentionally minimal — just the PixelScript wordmark on the
 * left and a "← New chat" button on the right that routes to /. No shared
 * Header / Footer / nav — the chat surface is the only thing on screen.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Clerk v7 uses <Show when="signed-in"|"signed-out"> instead of v6's
// <SignedIn>/<SignedOut>. Same semantics.
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { MetanoiaLogo } from "../components/MetanoiaLogo";
import { takePendingReferenceImages } from "../lib/referenceImageStash";
import { saveGeneration } from "@/app/actions/generations";
import { checkGenerationQuota, type QuotaInfo } from "@/app/actions/quota";

const API_BASE = "https://jayadeepreddy1-metanoia-backend.hf.space";
// Two endpoints — the JSON one for prompt-only generations, the multipart
// one when the user attached reference images. The frontend picks based on
// presence of files; the wire format mirrors the backend's split.
const API_GENERATE_JSON = `${API_BASE}/api/generate-design`;
const API_GENERATE_MULTIPART = `${API_BASE}/api/generate-design-with-references`;
// sessionStorage key the home page writes to before navigating here.
// Schema kept simple — same shape /api/generate-design expects.
export const CHAT_HANDOFF_KEY = "pixelscript:newChat";

/** Structured taste-signals brief returned by the multipart endpoint when
 * the user uploaded references. All axes are strings; missing axes come
 * back as empty strings (the chat panel hides empty rows). */
export type ReferenceBrief = {
  typographic_mood: string;
  color_discipline: string;
  spatial_pacing: string;
  emotional_register: string;
  designer_sensibility: string;
};

/** Verbatim text content extracted from the user's references. Two singletons
 * (brand/headline picked by first-non-empty across N images) and three lists
 * (concatenated + deduplicated). Empty strings / empty lists when not present. */
export type ReferenceContent = {
  brand_name: string;
  primary_headline: string;
  secondary_headlines: string[];
  body_copy: string;
  callouts: string[];
};

function hasAnyContent(c: ReferenceContent | null | undefined): c is ReferenceContent {
  if (!c) return false;
  return Boolean(
    c.brand_name?.trim() ||
    c.primary_headline?.trim() ||
    c.body_copy?.trim() ||
    (c.secondary_headlines?.length ?? 0) > 0 ||
    (c.callouts?.length ?? 0) > 0,
  );
}

type Handoff = {
  description: string;
  styleLabel: string;
  font_preset?: string;
  headline_font?: string;
  body_font?: string;
};

type LoadingState = { kind: "loading"; aborter: AbortController };
type SuccessState = {
  kind: "success";
  imageUrl: string;
  endedAt: number;
  // Populated only on the first turn of a chat that started with reference
  // images. Brief renders the "READING YOUR REFERENCES AS" panel;
  // content renders the "TEXT EXTRACTED FROM REFERENCES" panel below it.
  referenceBrief?: ReferenceBrief | null;
  referenceContent?: ReferenceContent | null;
};
type ErrorState = { kind: "error"; message: string; httpStatus: number | null };

type Turn = {
  id: string;
  userPrompt: string;
  styleLabel: string;
  isRefinement: boolean;
  startedAt: number;
  state: LoadingState | SuccessState | ErrorState;
};

// Phase narrative driven by elapsed seconds (mirrors /create).
function phaseNarrative(elapsedS: number): string {
  if (elapsedS < 15) return "Sending prompt to Vertex AI…";
  if (elapsedS < 45) return "Composing layout…";
  if (elapsedS < 90) return "Setting type and balancing color…";
  if (elapsedS < 120) return "Final pass — rendering typography…";
  return "Still working — Gemini takes a moment for premium output";
}
function fmtTimer(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Verbatim text content the system extracted from the user's references.
 * Rendered directly below the brief panel when at least one field has
 * content. Long body copy is truncated at 140 chars with an ellipsis so the
 * panel stays compact and quiet — the full text still flows into the
 * generation prompt. Same visual treatment as ReferenceBriefPanel so they
 * read as two related read-outs of the same input. */
function ReferenceContentPanel({ content }: { content: ReferenceContent }) {
  const bodyShown = content.body_copy && content.body_copy.length > 140
    ? content.body_copy.slice(0, 140) + "…"
    : content.body_copy;
  return (
    <div className="ps-reference-content">
      <div className="label">TEXT EXTRACTED FROM REFERENCES</div>
      {content.brand_name && (
        <div className="row"><span>Brand</span>{content.brand_name}</div>
      )}
      {content.primary_headline && (
        <div className="row"><span>Headline</span>{content.primary_headline}</div>
      )}
      {content.secondary_headlines.length > 0 && (
        <div className="row"><span>Sub</span>{content.secondary_headlines.join(" | ")}</div>
      )}
      {content.body_copy && (
        <div className="row"><span>Body</span>{bodyShown}</div>
      )}
      {content.callouts.length > 0 && (
        <div className="row"><span>Callouts</span>{content.callouts.join(" | ")}</div>
      )}
    </div>
  );
}

/** Small quiet metadata panel rendered above a generated design when the
 * first turn carried reference images. Shows the synthesized brief axes —
 * skipping any axis that came back empty so vague briefs don't display
 * empty rows. Labeled "READING YOUR REFERENCES AS" so the user sees how
 * the system interpreted their taste signals. */
function ReferenceBriefPanel({ brief }: { brief: ReferenceBrief }) {
  const rows: Array<[string, string]> = [
    ["Type", brief.typographic_mood],
    ["Color", brief.color_discipline],
    ["Space", brief.spatial_pacing],
    ["Feeling", brief.emotional_register],
    ["Maker", brief.designer_sensibility],
  ];
  const populated = rows.filter(([, v]) => (v || "").trim().length > 0);
  if (populated.length === 0) return null;
  return (
    <div className="ps-reference-brief">
      <div className="label">READING YOUR REFERENCES AS</div>
      {populated.map(([k, v]) => (
        <div key={k} className="row">
          <span>{k}</span>
          {v}
        </div>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [refineText, setRefineText] = useState("");
  // Persisted across all turns of this chat session — the font choice the
  // user picked on home before clicking Generate. Used on every refinement
  // call so Gemini keeps the typography consistent.
  const [fontSettings, setFontSettings] = useState<{
    font_preset?: string;
    headline_font?: string;
    body_font?: string;
    styleLabel: string;
  } | null>(null);

  // DB chat ID — null on first turn (saveGeneration creates the row), populated
  // afterward so refinements append to the same chat row. The ref shadow
  // exists because callBackend's useCallback closes over an empty deps list;
  // reading the ref inside avoids the stale-closure trap without forcing
  // callBackend (and every downstream useCallback) to re-create on chatId change.
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const currentChatIdRef = useRef<string | null>(null);
  useEffect(() => { currentChatIdRef.current = currentChatId; }, [currentChatId]);

  // Quota state + ref shadow. Same stale-closure reasoning as currentChatId:
  // callBackend's useCallback closes over an empty deps list, so reading the
  // ref inside the guard sees the freshest value without recreating the
  // callback. Modal visibility is plain state — only the gate path reads it.
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const quotaRef = useRef<QuotaInfo | null>(null);
  useEffect(() => { quotaRef.current = quota; }, [quota]);

  // Fetch quota on mount + after every fresh chat starts. Per spec, the
  // dep is currentChatId — refines within the same chat don't refetch, so
  // the displayed used/limit may lag mid-session. Acknowledged client-side
  // limitation; backend-side enforcement is the Phase 2 hardening task.
  useEffect(() => {
    checkGenerationQuota()
      .then(setQuota)
      .catch((err) => console.error('Failed to fetch quota:', err));
  }, [currentChatId]);

  // 1Hz tick — only runs while a turn is loading, drives timer/phase rerender.
  const [, setTick] = useState(0);
  useEffect(() => {
    const anyLoading = turns.some((t) => t.state.kind === "loading");
    if (!anyLoading) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [turns]);

  // Refs
  const refineInputRef = useRef<HTMLInputElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  // Guard against React StrictMode's intentional double-effect-fire in dev:
  // we read+clear sessionStorage once, this ref makes the second pass a no-op
  // (otherwise the second pass would see the cleared key and bounce home).
  const initializedRef = useRef(false);

  // Auto-scroll to newest turn.
  useEffect(() => {
    if (turns.length === 0) return;
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length]);

  // ===== Single backend call shared by first-gen + refinement + retry =====
  // When `referenceImages` is non-empty the request goes out as multipart
  // FormData (with each file appended as `reference_images[]`). Otherwise
  // it's the same JSON request /chat has always made. Refinement and retry
  // paths never pass referenceImages, so they stay on the JSON path.
  const callBackend = useCallback(async (args: {
    forTurnId: string;
    apiDescription: string;
    previousImageUrl?: string;
    fonts: NonNullable<typeof fontSettings>;
    aborter: AbortController;
    referenceImages?: File[];
  }) => {
    const { forTurnId, apiDescription, previousImageUrl, fonts, aborter, referenceImages } = args;

    // Quota gate — runs BEFORE the fetch. Every entry point (first-mount
    // kickoff, refine, retry) funnels through here, so a single gate covers
    // them all. Fails OPEN when quota is null (initial fetch hasn't
    // returned yet) so we never wrongly block a request we couldn't verify.
    // When blocked we also drop the optimistic loading turn — entry points
    // push the turn BEFORE calling callBackend, and a blocked request
    // that never fetches would otherwise spin forever.
    if (quotaRef.current && !quotaRef.current.allowed) {
      setTurns((prev) => prev.filter((t) => t.id !== forTurnId));
      setShowLimitModal(true);
      return;
    }

    let body: BodyInit;
    const headers: Record<string, string> = {};
    if (referenceImages && referenceImages.length > 0) {
      const fd = new FormData();
      fd.append("description", apiDescription);
      if (fonts.font_preset) {
        fd.append("font_preset", fonts.font_preset);
      } else {
        if (fonts.headline_font) fd.append("headline_font", fonts.headline_font);
        if (fonts.body_font) fd.append("body_font", fonts.body_font);
      }
      if (previousImageUrl) fd.append("previous_image_url", previousImageUrl);
      referenceImages.forEach((f) => fd.append("reference_images[]", f, f.name));
      body = fd;
      // Intentionally NO Content-Type header — the browser writes it with
      // the correct multipart boundary.
    } else {
      const obj: Record<string, string | undefined> = { description: apiDescription };
      if (fonts.font_preset) {
        obj.font_preset = fonts.font_preset;
      } else {
        obj.headline_font = fonts.headline_font;
        obj.body_font = fonts.body_font;
      }
      if (previousImageUrl) obj.previous_image_url = previousImageUrl;
      body = JSON.stringify(obj);
      headers["Content-Type"] = "application/json";
    }

    // Multipart goes to the dedicated route; JSON keeps the original URL.
    const url = referenceImages && referenceImages.length > 0
      ? API_GENERATE_MULTIPART
      : API_GENERATE_JSON;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: aborter.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        let message = "";
        if (Array.isArray(data?.detail)) {
          message = data.detail
            .map((e: { msg: string; loc: unknown[] }) =>
              `${(e.loc || []).slice(1).join(".") || "field"}: ${e.msg}`,
            )
            .join("; ");
        } else if (data?.error && data?.detail) {
          message = `${data.error} — ${data.detail}`;
        } else {
          message = `HTTP ${res.status}`;
        }
        setTurns((prev) => prev.map((t) =>
          t.id === forTurnId
            ? { ...t, state: { kind: "error", message, httpStatus: res.status } }
            : t,
        ));
        return;
      }
      const imageUrl = `${API_BASE}${data.image_url}?t=${Date.now()}`;
      // reference_brief + reference_content are present on the multipart
      // response (each possibly null if the corresponding extraction
      // returned nothing). Stash both on the turn so the chat renders the
      // two read-out panels above the image.
      const referenceBrief: ReferenceBrief | null =
        data.reference_brief && typeof data.reference_brief === "object"
          ? (data.reference_brief as ReferenceBrief)
          : null;
      const referenceContent: ReferenceContent | null =
        data.reference_content && typeof data.reference_content === "object"
          ? (data.reference_content as ReferenceContent)
          : null;
      setTurns((prev) => prev.map((t) =>
        t.id === forTurnId
          ? {
              ...t,
              state: {
                kind: "success",
                imageUrl,
                endedAt: Date.now(),
                referenceBrief,
                referenceContent,
              },
            }
          : t,
      ));
      // Fire-and-forget DB persistence. Persistence failure must not block
      // the user — log and continue. The first save (no chatId) creates a
      // chat row and returns its id, which we stash so subsequent
      // refinements append to the same chat. The stored imageUrl is the
      // canonical /outputs|/cached path (no `?t=` cache-buster — that's a
      // client display hack, useless for replay).
      saveGeneration({
        prompt: apiDescription,
        imageUrl: `${API_BASE}${data.image_url}`,
        stylePreset: fonts.font_preset ?? null,
        referenceBrief,
        referenceContent,
        cacheHit: data.cache_hit ?? false,
        chatId: currentChatIdRef.current ?? undefined,
      })
        .then((result) => {
          if (!currentChatIdRef.current) setCurrentChatId(result.chatId);
        })
        .catch((err) => {
          console.error("Failed to persist generation to DB:", err);
        });
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === "AbortError") {
        // Remove the aborted turn entirely — matches user intent.
        setTurns((prev) => prev.filter((t) => t.id !== forTurnId));
        return;
      }
      setTurns((prev) => prev.map((t) =>
        t.id === forTurnId
          ? {
              ...t,
              state: { kind: "error", message: `Network error: ${e?.message ?? "unknown"}`, httpStatus: null },
            }
          : t,
      ));
    }
  }, []);

  // ===== First-mount handoff: read sessionStorage, kick off first call =====
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(CHAT_HANDOFF_KEY) : null;
    if (!raw) return; // direct navigation — page will render empty state
    sessionStorage.removeItem(CHAT_HANDOFF_KEY);

    let payload: Handoff;
    try {
      payload = JSON.parse(raw) as Handoff;
    } catch {
      return;
    }
    if (!payload?.description?.trim()) return;

    const fonts = {
      font_preset: payload.font_preset,
      headline_font: payload.headline_font,
      body_font: payload.body_font,
      styleLabel: payload.styleLabel,
    };
    setFontSettings(fonts);

    // Reference images flow through a module-level stash (set by home before
    // it called router.push). Drain it here; if non-empty the first call
    // upgrades to multipart, otherwise stays JSON.
    const refs = takePendingReferenceImages();

    const aborter = new AbortController();
    const id = `t-${Date.now()}`;
    const newTurn: Turn = {
      id,
      userPrompt: payload.description.trim(),
      styleLabel: payload.styleLabel,
      isRefinement: false,
      startedAt: Date.now(),
      state: { kind: "loading", aborter },
    };
    setTurns([newTurn]);
    callBackend({
      forTurnId: id,
      apiDescription: payload.description.trim(),
      fonts,
      aborter,
      referenceImages: refs.length > 0 ? refs : undefined,
    });
  }, [callBackend]);

  // ===== Compose API description (original + bulleted refinements) =====
  const composeApiDescription = useCallback(
    (base: string, refs: string[]): string => {
      if (refs.length === 0) return base;
      return `${base}\n\nAdditional instructions:\n${refs
        .map((r) => `- ${r}`)
        .join("\n")}`;
    },
    [],
  );

  // ===== Refine: append to original description + previous_image_url =====
  const onRefine = useCallback(() => {
    const v = refineText.trim();
    if (!v) {
      refineInputRef.current?.focus();
      return;
    }
    const original = turns[0]?.userPrompt ?? "";
    if (!original || !fontSettings) return;

    const refinementsSoFar: string[] = turns
      .filter((t) => t.isRefinement && t.state.kind !== "error")
      .map((t) => t.userPrompt)
      .concat(v);

    let lastImageUrl: string | undefined;
    for (let i = turns.length - 1; i >= 0; i--) {
      const s = turns[i].state;
      if (s.kind === "success") {
        lastImageUrl = s.imageUrl;
        break;
      }
    }

    const aborter = new AbortController();
    const id = `t-${Date.now()}`;
    const newTurn: Turn = {
      id,
      userPrompt: v,
      styleLabel: fontSettings.styleLabel,
      isRefinement: true,
      startedAt: Date.now(),
      state: { kind: "loading", aborter },
    };
    setTurns((prev) => [...prev, newTurn]);
    setRefineText("");
    callBackend({
      forTurnId: id,
      apiDescription: composeApiDescription(original, refinementsSoFar),
      // Strip API_BASE + ?t= cache-buster so the backend gets the bare
      // /outputs/<file>.png path it knows how to resolve.
      previousImageUrl: lastImageUrl
        ?.replace(API_BASE, "")
        .replace(/\?t=\d+$/, ""),
      fonts: fontSettings,
      aborter,
    });
  }, [refineText, turns, fontSettings, callBackend, composeApiDescription]);

  // ===== Retry a failed turn =====
  const onRetry = useCallback(
    (turnId: string) => {
      if (!fontSettings) return;
      const idx = turns.findIndex((t) => t.id === turnId);
      if (idx < 0) return;
      const failed = turns[idx];
      const aborter = new AbortController();
      setTurns((prev) => prev.map((t) =>
        t.id === turnId
          ? { ...t, state: { kind: "loading", aborter }, startedAt: Date.now() }
          : t,
      ));
      const original = turns[0]?.userPrompt ?? failed.userPrompt;
      if (failed.isRefinement) {
        const refs = turns
          .slice(0, idx)
          .filter((t) => t.isRefinement && t.state.kind !== "error")
          .map((t) => t.userPrompt)
          .concat(failed.userPrompt);
        let lastImageUrl: string | undefined;
        for (let i = idx - 1; i >= 0; i--) {
          const s = turns[i].state;
          if (s.kind === "success") {
            lastImageUrl = s.imageUrl;
            break;
          }
        }
        callBackend({
          forTurnId: turnId,
          apiDescription: composeApiDescription(original, refs),
          previousImageUrl: lastImageUrl
            ?.replace(API_BASE, "")
            .replace(/\?t=\d+$/, ""),
          fonts: fontSettings,
          aborter,
        });
      } else {
        callBackend({
          forTurnId: turnId,
          apiDescription: failed.userPrompt,
          fonts: fontSettings,
          aborter,
        });
      }
    },
    [turns, fontSettings, callBackend, composeApiDescription],
  );

  // ===== Cancel a loading turn =====
  const onCancel = useCallback(
    (turnId: string) => {
      const t = turns.find((x) => x.id === turnId);
      if (t?.state.kind === "loading") t.state.aborter.abort();
    },
    [turns],
  );

  // ===== Download =====
  const onDownload = useCallback(
    async (imageUrl: string, turnIdx: number) => {
      try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `pixelscript-${turnIdx + 1}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      } catch {
        window.open(imageUrl, "_blank");
      }
    },
    [],
  );

  const hasAnySuccess = useMemo(
    () => turns.some((t) => t.state.kind === "success"),
    [turns],
  );

  return (
    <>
      {/* Minimal top bar — logo left, New chat right. Sticky so the user
       * always has an exit even mid-scroll. */}
      <header className="ps-chat-bar">
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          <MetanoiaLogo className="ps-brand-logo" />
        </Link>
        {/* Right-side group: New chat + Clerk auth UI. Wrapping these in
         * one flex container keeps `.ps-chat-bar`'s `justify-content:
         * space-between` doing the right thing (logo left, group right). */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="ps-chat-newbtn"
            onClick={() => router.push("/")}
            aria-label="Start a new chat"
          >
            ← New chat
          </button>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="ps-header-signin">Sign in</button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: { avatarBox: { width: '32px', height: '32px' } }
              }}
            />
          </Show>
        </div>
      </header>

      <main className="ps-chat-main">
        <div className="ps-thread">
          {turns.length === 0 && (
            <div className="ps-thread-empty-card">
              <div className="ps-thread-empty-title">No chat in progress</div>
              <div className="ps-thread-empty-sub">
                Conversations start from the home page — describe a design, pick
                a style, and hit Generate.
              </div>
              <Link href="/" className="ps-thread-empty-cta">
                ← Back to home
              </Link>
            </div>
          )}

          {turns.map((t, idx) => {
            const elapsedS =
              t.state.kind === "loading"
                ? Math.floor((Date.now() - t.startedAt) / 1000)
                : t.state.kind === "success"
                  ? Math.max(1, Math.floor((t.state.endedAt - t.startedAt) / 1000))
                  : 0;
            return (
              <div key={t.id} className="ps-turn-wrap">
                <div className="ps-turn ps-turn-user">
                  <div className="ps-bubble">
                    {t.userPrompt}
                    <div className="ps-bubble-meta">
                      Style · {t.styleLabel}
                      {t.isRefinement ? " · refinement" : ""}
                    </div>
                  </div>
                </div>
                <div className="ps-turn ps-turn-ai">
                  <div className="ps-avatar" />
                  <div className="ps-ai-body">
                    {t.state.kind === "loading" && (
                      <div className="ps-loading-block">
                        <div className="ps-loading-orb" />
                        <div className="ps-phase">
                          {phaseNarrative(elapsedS)}
                        </div>
                        <div className="ps-timer">{fmtTimer(elapsedS)}</div>
                        <button
                          className="ps-btn-outline ps-small"
                          onClick={() => onCancel(t.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {t.state.kind === "success" && (
                      <>
                        {t.state.referenceBrief && (
                          <ReferenceBriefPanel brief={t.state.referenceBrief} />
                        )}
                        {hasAnyContent(t.state.referenceContent) && (
                          <ReferenceContentPanel content={t.state.referenceContent} />
                        )}
                        <div className="ps-result-img">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.state.imageUrl} alt={`Generated design ${idx + 1}`} />
                        </div>
                        <div className="ps-result-actions">
                          <button
                            className="ps-btn-outline"
                            onClick={() =>
                              onDownload(
                                (t.state as SuccessState).imageUrl,
                                idx,
                              )
                            }
                          >
                            ↓ Download
                          </button>
                          <button
                            className="ps-btn-outline"
                            onClick={() => router.push("/")}
                          >
                            Generate another
                          </button>
                        </div>
                        <div className="ps-timer ps-tiny">
                          // generated in {fmtTimer(elapsedS)}
                        </div>
                      </>
                    )}
                    {t.state.kind === "error" && (
                      <div className="ps-error-block">
                        <div className="ps-error-msg">
                          <strong>
                            Generation failed
                            {t.state.httpStatus ? ` (HTTP ${t.state.httpStatus})` : ""}.
                          </strong>
                          <div className="ps-error-detail">{t.state.message}</div>
                        </div>
                        <button
                          className="ps-btn-cobalt ps-small"
                          onClick={() => onRetry(t.id)}
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={threadEndRef} />
        </div>

        {hasAnySuccess && (
          <div className="ps-refine-bar">
            <div className="ps-refine-inner">
              <input
                ref={refineInputRef}
                type="text"
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onRefine();
                }}
                placeholder="Refine the latest design — e.g., make the background darker"
              />
              <button onClick={onRefine}>Send →</button>
            </div>
            <div className="ps-refine-hint">
              // each refinement adds a new turn — your earlier designs stay above
            </div>
            {quota && (
              <span className="ps-quota-indicator">
                {quota.used} / {quota.limit} designs used this month
              </span>
            )}
          </div>
        )}

        {/* Quota-exceeded modal. Backdrop click + Close button + Esc would
         * also dismiss; Esc not wired here because the refine input
         * already owns keyboard focus, but stopPropagation on the inner
         * panel keeps backdrop-clicks clean. */}
        {showLimitModal && (
          <div
            className="ps-limit-modal-backdrop"
            onClick={() => setShowLimitModal(false)}
          >
            <div
              className="ps-limit-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="ps-limit-modal-heading"
            >
              <h2 id="ps-limit-modal-heading">
                You've used all {quota?.limit} {quota?.planTier === "free" ? "free " : ""}
                designs this month
              </h2>
              <p>
                Your quota resets on the 1st of next month. Upgrade to keep
                designing today.
              </p>
              <div className="ps-limit-actions">
                <Link href="/pricing" className="ps-limit-upgrade">
                  See plans →
                </Link>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="ps-limit-dismiss"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <ChatStyles />
    </>
  );
}

/** All chat-only CSS. Uses the design tokens from globals.css. */
function ChatStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes ps-orbPulse { 0%,100%{transform:scale(1);opacity:0.9} 50%{transform:scale(1.12);opacity:1} }

.ps-chat-bar { position: sticky; top: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 28px;
  background: rgba(7, 8, 15, 0.85); backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(36, 42, 74, 0.6); }
.ps-brand-logo { height: 60px; width: auto; display: block; }
.ps-chat-newbtn { background: none; border: 1px solid var(--line); color: var(--text-dim);
  padding: 8px 14px; border-radius: 9px; font-family: inherit; font-size: 0.86rem;
  font-weight: 500; cursor: pointer; transition: all .2s; }
.ps-chat-newbtn:hover { color: var(--text); border-color: var(--cobalt-2); }
.ps-header-signin {
  background: transparent;
  color: var(--text);
  border: 1px solid rgba(255,255,255,0.15);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.2s, background 0.2s;
}
.ps-header-signin:hover {
  border-color: var(--cobalt);
  background: rgba(255,255,255,0.03);
}

.ps-chat-main { min-height: calc(100vh - 60px); padding: 30px 0 140px;
  background: var(--bg); }

.ps-thread { max-width: 880px; margin: 0 auto; padding: 0 24px; }

.ps-thread-empty-card { text-align: center; padding: 80px 24px;
  border: 1px dashed var(--line); border-radius: 18px; background: var(--surface);
  margin-top: 60px; }
.ps-thread-empty-title { font-family: var(--serif); font-size: 1.5rem; font-weight: 500;
  margin-bottom: 12px; color: var(--text); }
.ps-thread-empty-sub { color: var(--text-dim); font-size: 0.98rem; max-width: 420px;
  margin: 0 auto 24px; line-height: 1.5; }
.ps-thread-empty-cta { display: inline-block; background: var(--cobalt); color: #fff;
  padding: 11px 22px; border-radius: 9px; font-weight: 600; font-size: 0.92rem;
  text-decoration: none; box-shadow: 0 4px 20px -4px var(--cobalt-glow);
  transition: background .2s; }
.ps-thread-empty-cta:hover { background: var(--cobalt-2); }

.ps-turn-wrap { margin: 28px 0; }
.ps-turn-user { display: flex; justify-content: flex-end; }
.ps-bubble { background: var(--surface-2); border: 1px solid var(--line); color: var(--text);
  padding: 14px 18px; border-radius: 16px 16px 4px 16px; max-width: 78%; }
.ps-bubble-meta { font-family: var(--mono); font-size: 0.7rem; color: var(--text-faint);
  letter-spacing: 0.1em; text-transform: uppercase; margin-top: 8px; }
.ps-turn-ai { display: flex; gap: 14px; align-items: flex-start; }
.ps-avatar { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--cobalt) 0%, var(--cobalt-deep) 100%);
  box-shadow: 0 0 18px var(--cobalt-glow); position: relative; margin-top: 2px; }
.ps-avatar::after { content: ""; position: absolute; inset: 8px; border-radius: 4px;
  border: 1.5px solid rgba(255,255,255,0.85); }
.ps-ai-body { flex: 1; background: var(--surface); border: 1px solid var(--line);
  border-radius: 16px; padding: 18px; min-width: 0; }

.ps-loading-block { display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 40px 16px; }
.ps-loading-orb { width: 56px; height: 56px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #a9bbff, #4a6cff 50%, #2b44c4);
  box-shadow: 0 0 30px var(--cobalt-glow); animation: ps-orbPulse 1.4s ease-in-out infinite; }
.ps-phase { font-family: var(--mono); font-size: 0.84rem; color: var(--cobalt-2);
  letter-spacing: 0.06em; text-align: center; }
.ps-timer { font-family: var(--mono); font-size: 0.74rem; color: var(--text-faint); }
.ps-timer.ps-tiny { margin-top: 10px; font-size: 0.7rem; }

/* Brief + content panels — same quiet treatment so they read as two
 * read-outs of the same input. Content panel sits 8px below the brief
 * panel via its own margin-top so the gap is consistent regardless of
 * whether the brief panel rendered (in which case the content panel's
 * margin-top overrides the brief's margin-bottom). */
.ps-reference-brief,
.ps-reference-content {
  padding: 14px 18px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1.55;
}
.ps-reference-brief { margin-bottom: 14px; }
.ps-reference-content { margin-bottom: 14px; }
/* Adjacency selector — only collapse the gap when both panels render.
 * brief.margin-bottom 14 + adjacency -6 = 8px gap, per spec. */
.ps-reference-brief + .ps-reference-content { margin-top: -6px; }
.ps-reference-brief .label,
.ps-reference-content .label {
  font-size: 0.66rem; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--text-dim); margin-bottom: 10px;
}
.ps-reference-brief .row,
.ps-reference-content .row {
  display: flex; gap: 10px; padding: 3px 0; color: var(--text);
}
.ps-reference-brief .row span,
.ps-reference-content .row span {
  flex-shrink: 0; width: 80px; color: var(--text-dim);
}

.ps-result-img { width: 100%; aspect-ratio: 1/1; border-radius: 12px; overflow: hidden;
  display: block; background: var(--bg-3); }
.ps-result-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ps-result-actions { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.ps-btn-outline { background: none; border: 1px solid var(--line); color: var(--text);
  border-radius: 9px; font-weight: 600; font-size: 0.85rem; cursor: pointer;
  padding: 9px 16px; transition: all .2s; font-family: inherit; }
.ps-btn-outline:hover { border-color: var(--cobalt-2); color: var(--cobalt-2); }
.ps-btn-cobalt { background: var(--cobalt); color: #fff; border: none; padding: 9px 16px;
  border-radius: 9px; font-weight: 600; font-size: 0.85rem; cursor: pointer;
  transition: background .2s; box-shadow: 0 4px 20px -4px var(--cobalt-glow);
  font-family: inherit; }
.ps-btn-cobalt:hover { background: var(--cobalt-2); }
.ps-small { padding: 7px 14px !important; font-size: 0.78rem !important; }

.ps-error-block { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
.ps-error-msg { background: rgba(244, 67, 54, 0.08); border: 1px solid rgba(244, 67, 54, 0.4);
  border-radius: 10px; padding: 14px 16px; color: var(--text); }
.ps-error-msg strong { display: block; margin-bottom: 6px; color: #ff8a80; font-weight: 600; }
.ps-error-detail { color: var(--text-dim); font-size: 0.88rem; word-break: break-word; }

.ps-refine-bar { position: sticky; bottom: 14px; z-index: 60; margin: 0 auto;
  max-width: 880px; padding: 0 24px; }
.ps-refine-inner { background: rgba(20, 23, 43, 0.92); backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(74,108,255,0.4); border-radius: 16px;
  padding: 9px 9px 9px 18px; display: flex; align-items: center; gap: 8px;
  box-shadow: 0 20px 60px -20px rgba(0,0,0,0.8), 0 0 40px -20px var(--cobalt-glow); }
.ps-refine-inner input { flex: 1; background: none; border: none; outline: none;
  color: var(--text); font-family: var(--sans); font-size: 0.98rem; min-width: 0; }
.ps-refine-inner input::placeholder { color: var(--text-faint); }
.ps-refine-inner button { background: var(--cobalt); color: #fff; border: none;
  padding: 11px 18px; border-radius: 10px; font-weight: 600; font-size: 0.88rem;
  cursor: pointer; transition: background .2s; }
.ps-refine-inner button:hover { background: var(--cobalt-2); }
.ps-refine-hint { text-align: center; font-family: var(--mono); font-size: 0.7rem;
  color: var(--text-faint); margin-top: 8px; letter-spacing: 0.05em; }

/* Quota indicator — small unobtrusive line beneath the refine hint.
 * Slightly dimmer than the hint so it reads as ambient status, not copy. */
.ps-quota-indicator {
  display: block;
  text-align: center;
  margin-top: 4px;
  color: var(--text-dim);
  font-size: 12px;
  opacity: 0.7;
}

/* Limit-exceeded modal. Fixed backdrop covers the viewport, panel is
 * centered, cobalt-bordered, restrained padding. Sits at z-index 200 so
 * it covers the sticky refine bar (which is z-index 60). */
.ps-limit-modal-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.ps-limit-modal {
  max-width: 460px; width: 100%;
  background: var(--surface);
  border: 1px solid var(--cobalt);
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 30px 80px -20px rgba(0,0,0,0.85),
              0 0 60px -16px var(--cobalt-glow);
}
.ps-limit-modal h2 {
  font-family: var(--serif); font-weight: 500;
  font-size: 1.4rem; line-height: 1.2; letter-spacing: -0.01em;
  color: var(--text); margin-bottom: 12px;
}
.ps-limit-modal p {
  color: var(--text-dim); font-size: 0.95rem; line-height: 1.55;
  margin-bottom: 22px;
}
.ps-limit-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ps-limit-upgrade {
  background: var(--cobalt); color: #fff;
  padding: 11px 20px; border-radius: 8px;
  font-size: 0.9rem; font-weight: 600;
  text-decoration: none;
  box-shadow: 0 4px 20px -4px var(--cobalt-glow);
  transition: background .2s;
}
.ps-limit-upgrade:hover { background: var(--cobalt-2); }
.ps-limit-dismiss {
  background: transparent; color: var(--text-dim);
  border: 1px solid var(--line);
  padding: 11px 18px; border-radius: 8px;
  font-family: inherit; font-size: 0.9rem; font-weight: 500;
  cursor: pointer; transition: all .2s;
}
.ps-limit-dismiss:hover { color: var(--text); border-color: var(--cobalt-2); }

@media (max-width: 980px) {
  .ps-brand-logo { height: 48px; }
}
@media (max-width: 540px) {
  .ps-bubble { max-width: 90%; }
  .ps-chat-bar { padding: 12px 18px; }
}
        `,
      }}
    />
  );
}
