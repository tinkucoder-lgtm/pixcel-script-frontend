// Marketing home page — full-bleed orbit hero, six-card feature grid,
// three-step "how it works", placeholder gallery, and a Launch Studio CTA.
// Server component; only OrbitHero and Header are client islands.

import Header from "./components/Header";
import Footer from "./components/Footer";
import OrbitHero from "./components/OrbitHero";
import CtaBand from "./components/CtaBand";

const FEATURES = [
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

const STEPS = [
  {
    n: "01",
    title: "Describe it",
    desc: "Write a sentence about the design you need — the occasion, the vibe, the words. No design jargon required.",
    active: true,
  },
  {
    n: "02",
    title: "Pick a style",
    desc: "Choose one of eight curated type systems, or bring your own headline and body fonts for full control.",
  },
  {
    n: "03",
    title: "Refine & publish",
    desc: "Tweak it in plain language until it's right, then download a publish-ready, professional design.",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <OrbitHero />

        {/* ============ FEATURES ============ */}
        <section
          id="features"
          style={{
            padding: "120px 0 100px",
            position: "relative",
            zIndex: 2,
            background: "var(--bg)",
          }}
        >
          <div style={containerStyle}>
            <div style={labelStyle}>What makes it different</div>
            <h2 style={titleStyle}>Six things every design gets right.</h2>
            <p style={introStyle}>
              These aren't filters. They're the engineering decisions that separate a
              design people trust from one they instantly clock as machine-made.
            </p>
            <div className="ps-grid-3" style={grid3Style}>
              {FEATURES.map((f, i) => (
                <div key={i} className="ps-feature-card" style={featureCardStyle}>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.78rem",
                      color: "var(--cobalt-2)",
                      marginBottom: 18,
                    }}
                  >
                    0{i + 1}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "1.35rem",
                      fontWeight: 500,
                      marginBottom: 10,
                      lineHeight: 1.15,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p style={{ fontSize: "0.93rem", color: "var(--text-dim)" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section
          id="how"
          style={{
            padding: "100px 0",
            borderTop: "1px solid var(--line)",
            position: "relative",
            zIndex: 2,
            background: "var(--bg)",
          }}
        >
          <div style={containerStyle}>
            <div style={labelStyle}>How it works</div>
            <h2 style={titleStyle}>Three steps. One finished design.</h2>
            <div className="ps-grid-3" style={{ ...grid3Style, gap: 28 }}>
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  style={{
                    position: "relative",
                    paddingTop: 28,
                    borderTop: `2px solid ${s.active ? "var(--cobalt)" : "var(--line)"}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "2.8rem",
                      fontWeight: 300,
                      color: "var(--cobalt-2)",
                      lineHeight: 1,
                      marginBottom: 16,
                    }}
                  >
                    {s.n}
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>
                    {s.title}
                  </h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.95rem" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ GALLERY ============ */}
        <section
          id="gallery"
          style={{
            padding: "100px 0",
            borderTop: "1px solid var(--line)",
            position: "relative",
            zIndex: 2,
            background: "var(--bg)",
          }}
        >
          <div style={containerStyle}>
            <div style={labelStyle}>Gallery</div>
            <h2 style={titleStyle}>Made with PixelScript.</h2>
            <div className="ps-gallery-grid" style={galleryGridStyle}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="ps-gallery-tile"
                  style={{
                    aspectRatio: "4 / 5",
                    borderRadius: 14,
                    background: i % 2 === 0 ? "var(--bg-3)" : "var(--surface)",
                    border: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                    fontFamily: "var(--mono)",
                    fontSize: "0.68rem",
                    letterSpacing: "0.15em",
                    color: "var(--text-faint)",
                  }}
                >
                  PLACEHOLDER
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 22,
                fontFamily: "var(--mono)",
                fontSize: "0.78rem",
                color: "var(--text-faint)",
              }}
            >
              // Placeholder tiles — to be replaced with real generated designs
            </div>
          </div>
        </section>

        <CtaBand
          heading={
            <>
              Your next design is one
              <br />
              sentence away.
            </>
          }
          sub="Stop fighting the AI look. Start shipping designs people trust."
        />
      </main>
      <Footer />
      <ResponsiveStyles />
    </>
  );
}

// Shared section helpers — keep them out-of-band so the JSX stays readable.
const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "0 40px",
};
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "0.76rem",
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: "var(--cobalt-2)",
  marginBottom: 16,
};
const titleStyle: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontWeight: 500,
  fontSize: "clamp(2rem, 3.6vw, 3rem)",
  lineHeight: 1.08,
  letterSpacing: "-0.02em",
  marginBottom: 18,
};
const introStyle: React.CSSProperties = {
  color: "var(--text-dim)",
  fontSize: "1.06rem",
  maxWidth: 560,
};
const grid3Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 20,
  marginTop: 56,
};
const featureCardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 18,
  padding: "30px 26px",
  transition: "all 0.3s",
  position: "relative",
  overflow: "hidden",
};
const galleryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 16,
  marginTop: 50,
};

function ResponsiveStyles() {
  // Inline-style media queries aren't possible; this server-rendered <style>
  // collapses the 3-col / 4-col grids down to 1-col on tablet and below.
  return (
    <style
      // eslint-disable-next-line react/no-unknown-property
      dangerouslySetInnerHTML={{
        __html: `
        .ps-feature-card:hover {
          border-color: var(--cobalt);
          transform: translateY(-4px);
          background: var(--surface-2);
        }
        @media (max-width: 980px) {
          .ps-grid-3 { grid-template-columns: 1fr !important; }
          .ps-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 540px) {
          .ps-gallery-grid { grid-template-columns: 1fr !important; }
        }
      `,
      }}
    />
  );
}
