// Reused "Launch Studio →" cobalt-glow band that closes the home, about,
// and pricing pages. Heading/sub copy varies per page so they're props.
// `href` defaults to "/" because home IS the studio now (the orbit hero
// owns the prompt + style picker that kicks off generation in /chat).

import Link from "next/link";

export default function CtaBand({
  heading,
  sub,
  ctaLabel = "Launch Studio →",
  href = "/",
}: {
  heading: React.ReactNode;
  sub: string;
  ctaLabel?: string;
  href?: string;
}) {
  return (
    <div
      style={{
        margin: "0 40px 60px",
        borderRadius: 28,
        background:
          "radial-gradient(circle at 20% 20%, rgba(74,108,255,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(43,68,196,0.25) 0%, transparent 50%), var(--bg-3)",
        border: "1px solid var(--line)",
        padding: "80px 40px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--serif)",
          fontWeight: 500,
          fontSize: "clamp(2rem, 4vw, 3.2rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          marginBottom: 18,
        }}
      >
        {heading}
      </h2>
      <p style={{ color: "var(--text-dim)", fontSize: "1.1rem", marginBottom: 32 }}>
        {sub}
      </p>
      <Link
        href={href}
        style={{
          display: "inline-block",
          background: "var(--cobalt)",
          color: "#fff",
          padding: "14px 32px",
          borderRadius: 9,
          fontSize: "1rem",
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px -4px var(--cobalt-glow)",
          transition: "all 0.2s",
        }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
