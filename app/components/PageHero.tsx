// Non-fullbleed hero used on the sub-pages (about / pricing / contact).
// Eyebrow label, big serif headline with one italicized cobalt phrase, sub.
// Ported from .page-hero in design-reference/about.html.

export default function PageHero({
  label,
  title,
  sub,
}: {
  label: string;
  title: React.ReactNode;
  sub: string;
}) {
  return (
    <div
      style={{
        padding: "160px 0 70px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          content: '""',
          position: "absolute",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 760,
          height: 420,
          background:
            "radial-gradient(ellipse at center, rgba(74,108,255,0.16) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 40px", position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.76rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "var(--cobalt-2)",
            marginBottom: 16,
          }}
        >
          {label}
        </div>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: "clamp(2.4rem, 5vw, 4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            marginBottom: 18,
            position: "relative",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: "1.12rem",
            maxWidth: 560,
            margin: "0 auto",
            position: "relative",
          }}
        >
          {sub}
        </p>
      </div>
    </div>
  );
}
