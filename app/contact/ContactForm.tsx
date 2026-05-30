"use client";

/**
 * Contact form — controlled inputs, mailto-only submission.
 *
 * Submit composes a `mailto:` URL with the form fields percent-encoded
 * into the subject + body, then navigates the window to it. The user's
 * mail client opens with everything prefilled; sending is then their
 * responsibility. No backend, no email service, no tracking. Real
 * submission lands when we have volume to justify it.
 *
 * Disabled when message is empty so the submit can't open an empty draft.
 * Field styling mirrors the home compose card (cobalt-tinged border, 12px
 * radius, focus ring) so the visual language is consistent across the site.
 */

import { useState } from "react";

export default function ContactForm({ destination }: { destination: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const trimmedMessage = message.trim();
  const canSubmit = trimmedMessage.length > 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // Build the mailto body. Each field is included only if filled in so
    // the email doesn't carry empty "Name: " / "Email: " lines.
    const lines: string[] = [];
    if (name.trim()) lines.push(`Name: ${name.trim()}`);
    if (email.trim()) lines.push(`Reply-to: ${email.trim()}`);
    if (lines.length) lines.push("");
    lines.push(trimmedMessage);
    const subj = subject.trim() || "Hello from Metanoia";
    const body = lines.join("\n");
    // mailto: URLs use percent-encoding — URLSearchParams would render
    // spaces as `+` which most mail clients tolerate but isn't strictly
    // correct, so encodeURIComponent each piece.
    const url = `mailto:${destination}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  return (
    <>
      <form onSubmit={onSubmit} style={formRowStack} noValidate>
        <Field
          label="Your name"
          type="text"
          placeholder="Jane Doe"
          value={name}
          onChange={setName}
        />
        <Field
          label="Email"
          type="email"
          placeholder="jane@company.com"
          value={email}
          onChange={setEmail}
        />
        <Field
          label="Subject"
          type="text"
          placeholder="What's this about?"
          value={subject}
          onChange={setSubject}
        />
        <div className="ps-field">
          <label style={labelStyle}>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind…"
            style={{ ...inputStyle, minHeight: 160, resize: "vertical" }}
            required
          />
        </div>
        <div style={submitRowStyle}>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              ...submitButtonStyle,
              opacity: canSubmit ? 1 : 0.45,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            Open in mail client →
          </button>
          <div style={destHintStyle}>
            // sends to {destination} via your mail app
          </div>
        </div>
      </form>
      {/* Focus ring for the cobalt-tinged inputs — inline styles can't
       * carry :focus, so this small block hangs alongside the form. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ps-field input:focus, .ps-field textarea:focus {
              border-color: var(--cobalt) !important;
              box-shadow: 0 0 0 3px rgba(74,108,255,0.15) !important;
            }
          `,
        }}
      />
    </>
  );
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="ps-field">
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

/* -------------------------- styles -------------------------- */
const formRowStack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--mono)",
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "var(--text-dim)",
  marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid rgba(74,108,255,0.25)",
  borderRadius: 12,
  padding: "13px 16px",
  color: "var(--text)",
  fontFamily: "var(--sans)",
  fontSize: "0.98rem",
  outline: "none",
  transition: "border-color .2s, box-shadow .2s",
};
const submitRowStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 10,
  marginTop: 6,
};
const submitButtonStyle: React.CSSProperties = {
  background: "var(--cobalt)",
  color: "#fff",
  padding: "14px 28px",
  borderRadius: 10,
  fontSize: "0.96rem",
  fontWeight: 600,
  border: "none",
  fontFamily: "inherit",
  boxShadow: "0 4px 20px -4px var(--cobalt-glow)",
  transition: "all 0.2s",
};
const destHintStyle: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "0.72rem",
  color: "var(--text-faint)",
  letterSpacing: "0.04em",
};
