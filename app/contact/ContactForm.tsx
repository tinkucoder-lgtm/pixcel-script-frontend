"use client";

// Client-only piece of /contact — controlled inputs and a mock submit.
// Lives separately so /contact/page.tsx can stay a server component and
// export the right <title>.

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thanks — this form is a mock. Email hello@pixelscript.app for real.");
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label="Your name" type="text" placeholder="Jane Doe" value={name} onChange={setName} />
      <Field label="Email" type="email" placeholder="jane@company.com" value={email} onChange={setEmail} />
      <Field
        label="Subject"
        type="text"
        placeholder="What's this about?"
        value={subject}
        onChange={setSubject}
      />
      <div>
        <label style={labelStyle}>Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's on your mind…"
          style={{ ...fieldInputStyle, minHeight: 140, resize: "vertical" }}
        />
      </div>
      <button
        type="submit"
        style={{
          alignSelf: "flex-start",
          background: "var(--cobalt)",
          color: "#fff",
          padding: "13px 28px",
          borderRadius: 9,
          fontSize: "0.95rem",
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px -4px var(--cobalt-glow)",
          transition: "all 0.2s",
        }}
      >
        Send message →
      </button>
    </form>
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
        style={fieldInputStyle}
      />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--mono)",
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "var(--text-dim)",
  marginBottom: 8,
};
const fieldInputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: "13px 15px",
  color: "var(--text)",
  fontFamily: "var(--sans)",
  fontSize: "0.98rem",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};
