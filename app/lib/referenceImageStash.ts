/**
 * In-memory handoff for reference-image File objects between Home and /chat.
 *
 * Why this exists: the home → /chat handoff for the prompt + style settings
 * goes through sessionStorage (string-only). File objects can't be serialized
 * to JSON, and converting them to base64 dataURLs would blow past
 * sessionStorage's ~5 MB quota fast (the limit here is 4 × 8 MB = 32 MB of
 * source files). Since Next.js App Router navigations are client-side
 * within the same JS process, a plain module-level binding survives the
 * route change just fine.
 *
 * Lifecycle: home calls setPendingReferenceImages(files) right before
 * router.push("/chat"); /chat calls takePendingReferenceImages() inside its
 * first-mount handoff effect (which also drains sessionStorage). The take
 * function clears the buffer in the same call so a later mount, refresh, or
 * second visit doesn't accidentally re-attach the same files.
 */

let pending: File[] = [];

export function setPendingReferenceImages(files: File[]): void {
  pending = files;
}

export function takePendingReferenceImages(): File[] {
  const out = pending;
  pending = [];
  return out;
}
