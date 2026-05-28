// /about — story + four-stat grid + three principles + CTA.
// Server component (Header is the only client island).

import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import CtaBand from "../components/CtaBand";

export const metadata = {
  title: "About — PixelScript",
  description:
    "PixelScript exists to kill the AI slop look and make marketing design anyone can trust come out of a single sentence.",
};

const STATS = [
  { big: "~2 min", suffix: null, lbl: "Sentence to finished design" },
  { big: "8", suffix: null, lbl: "Curated type systems" },
  { big: "2–3", suffix: "/10", lbl: 'On the "obviously AI" scale' },
  { big: "100%", suffix: null, lbl: "Your words, your fonts" },
];

const VALUES = [
  {
    n: "01",
    title: "Designed, not generated",
    desc: "If it reads as machine-made, it failed. Every output is judged against a human design bar.",
  },
  {
    n: "02",
    title: "Typography is everything",
    desc: "The fastest tell of AI design is the type. We treat fonts as a first-class control, not an afterthought.",
  },
  {
    n: "03",
    title: "Honest about limits",
    desc: 'We promise "professionally designed," not "undetectable." Real expectations build real trust.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          label="About us"
          title={
            <>
              We got tired of
              <br />
              the{" "}
              <em style={{ fontStyle: "italic", color: "var(--cobalt-2)", fontWeight: 400 }}>
                AI look.
              </em>
            </>
          }
          sub={'PixelScript exists to kill the "slop look" — and make marketing design anyone can trust come out of a single sentence.'}
        />

        <section
          style={{
            padding: "100px 0",
            borderTop: "1px solid var(--line)",
            position: "relative",
            zIndex: 2,
            background: "var(--bg)",
          }}
        >
          <div style={containerStyle}>
            <div className="ps-about-grid" style={aboutGridStyle}>
              <div>
                <p style={paragraphStyle}>
                  Every AI image tool produces the same thing: over-glowing, dead-center,
                  vaguely-symmetrical designs with mangled text that anyone can spot from
                  across the room.
                </p>
                <p style={paragraphStyle}>
                  PixelScript is built backwards from that problem. We engineered the
                  generation around every visual tell — the glow, the symmetry, the
                  garbled type — so what comes out reads as{" "}
                  <em style={{ color: "var(--cobalt-2)", fontStyle: "italic" }}>designed</em>,
                  not generated. Real typography you control. Your exact words, spelled
                  right. Complete aesthetics, not random filters.
                </p>
                <p style={paragraphStyle}>
                  The honest bar: it looks professionally designed, not lazy. That's the
                  thing the market actually pays for — and that's the only bar we care
                  about.
                </p>
              </div>
              <div className="ps-stats" style={statsStyle}>
                {STATS.map((s) => (
                  <div key={s.lbl} style={statStyle}>
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: "2.4rem",
                        fontWeight: 500,
                        color: "var(--cobalt-2)",
                        lineHeight: 1,
                        marginBottom: 8,
                      }}
                    >
                      {s.big}
                      {s.suffix && <span style={{ fontSize: "1.2rem" }}>{s.suffix}</span>}
                    </div>
                    <div style={{ fontSize: "0.86rem", color: "var(--text-dim)" }}>
                      {s.lbl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            padding: "100px 0",
            borderTop: "1px solid var(--line)",
            position: "relative",
            zIndex: 2,
            background: "var(--bg)",
          }}
        >
          <div style={containerStyle}>
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
              What we believe
            </div>
            <h2
              style={{
                fontFamily: "var(--serif)",
                fontWeight: 500,
                fontSize: "clamp(2rem, 3.6vw, 3rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                marginBottom: 18,
              }}
            >
              Principles we build on.
            </h2>
            <div className="ps-values" style={valuesStyle}>
              {VALUES.map((v) => (
                <div key={v.n} style={valueCardStyle}>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.78rem",
                      color: "var(--cobalt-2)",
                      marginBottom: 14,
                    }}
                  >
                    {v.n}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "1.25rem",
                      fontWeight: 500,
                      marginBottom: 10,
                    }}
                  >
                    {v.title}
                  </h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.93rem" }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CtaBand
          heading={
            <>
              Come build designs
              <br />
              people trust.
            </>
          }
          sub="See what a single sentence can turn into."
        />
      </main>
      <Footer />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 980px) {
              .ps-about-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
              .ps-values { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 540px) {
              .ps-stats { grid-template-columns: 1fr !important; }
            }
          `,
        }}
      />
    </>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "0 40px",
};
const aboutGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr",
  gap: 60,
  alignItems: "center",
};
const paragraphStyle: React.CSSProperties = {
  color: "var(--text-dim)",
  marginBottom: 18,
  fontSize: "1.04rem",
};
const statsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 22,
};
const statStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 16,
  padding: "26px 22px",
};
const valuesStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 20,
  marginTop: 30,
};
const valueCardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 18,
  padding: "28px 24px",
};
