// Shared site footer — logo + copyright. Server component (no interactivity).

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line)",
        padding: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "var(--text-faint)",
        fontSize: "0.86rem",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "var(--serif)",
          fontWeight: 600,
          fontSize: "1.05rem",
          color: "var(--text)",
          letterSpacing: "-0.01em",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background:
              "linear-gradient(135deg, var(--cobalt) 0%, var(--cobalt-deep) 100%)",
            boxShadow: "0 0 18px var(--cobalt-glow)",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 6,
              borderRadius: 3,
              border: "1.5px solid rgba(255,255,255,0.85)",
            }}
          />
        </div>
        Metanoia
      </div>
      <div>© 2026 Metanoia · The anti-AI-slop design engine</div>
    </footer>
  );
}
