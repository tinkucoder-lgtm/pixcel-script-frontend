// /about — Metanoia's anti-slop thesis. Four-section editorial structure
// (problem → cost → fix → audiences) anchored by an orbit-canvas hero so
// the visual brand impression lands before the reader scans copy.
//
// Server component; the only client island is <OrbitBackground /> (canvas
// animation). Body sections are pure JSX so they stream as static HTML.

import Header from "../components/Header";
import Footer from "../components/Footer";
import OrbitBackground from "../components/OrbitBackground";
import CtaBand from "../components/CtaBand";

export const metadata = {
  title: "About — Metanoia",
  description:
    "Metanoia is built backwards from the visual tells of AI design. References inform, never replicate. Text comes out exact, typography stays cohesive, the result reads as designed — not generated.",
};

// Concrete examples for each of the two audience columns. Specific use
// cases land harder than abstract job titles — keeps the page from
// reading as generic positioning.
const BUSINESS_EXAMPLES = [
  "The bakery launching a Saturday market poster",
  "The salon refreshing their loyalty card",
  "The studio sending a quarterly community email",
];
const CREATOR_EXAMPLES = [
  "The Instagram reel that needs an infographic background by tomorrow",
  "The LinkedIn post that needs a hero image, not a Canva preset",
  "The YouTube thumbnail that needs to not look like every other YouTube thumbnail",
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* ====== HERO with orbit canvas background ====== */}
        <section style={heroSection}>
          <OrbitBackground />
          {/* Atmospheric vignette over the canvas — same gradient stack as
           * the home hero so the visual treatment is consistent. */}
          <div aria-hidden style={heroAtmos} />
          <div style={heroContent}>
            <div style={eyebrowStyle}>About Metanoia</div>
            <h1 style={h1Style}>
              We got tired of<br />the <em style={emStyle}>AI look.</em>
            </h1>
            <p style={heroSubStyle}>
              Most AI design tools optimize for fast. We optimized for trust.
              Here's what that means.
            </p>
          </div>
        </section>

        {/* ====== 01 — The problem ====== */}
        <Section
          eyebrow="01 / The problem"
          headline={<>AI design has tells.</>}
          body={
            <>
              <p style={paraStyle}>
                You can spot AI-generated design from across the room.
                Dead-center compositions that betray a template. Over-saturated
                gradients that scream <em style={emStyle}>rendered</em>. Mangled
                letterforms where the headline tries to say something and ends
                up saying nothing. A generic geometric sans-serif that shows up
                in every output regardless of prompt. The same three layout
                moves dressed in different colors.
              </p>
              <p style={paraStyle}>
                Once you've seen the tells, you can't unsee them. Most people
                have seen them.
              </p>
            </>
          }
        />

        {/* ====== 02 — The cost ====== */}
        <Section
          eyebrow="02 / The cost"
          headline={
            <>
              Slop reads as low effort.
              <br />
              Low effort reads as <em style={emStyle}>low trust.</em>
            </>
          }
          body={
            <>
              <p style={paraStyle}>
                The damage isn't the design — it's what the design says about
                you. A business owner who posts an AI-made logo looks like they
                couldn't be bothered. A marketer who ships slop campaigns looks
                like they're cutting corners. A content creator whose reel
                background has melting type loses the audience's benefit of the
                doubt before the second of footage plays.
              </p>
              <p style={paraStyle}>
                The work reads as a shortcut. Audiences read shortcuts as not
                caring. Your brand bleeds credibility one slop post at a time.
              </p>
            </>
          }
          dividerTop
        />

        {/* ====== 03 — The fix ====== */}
        <Section
          eyebrow="03 / The fix"
          headline={
            <>
              Treat the model as a <em style={emStyle}>tool</em>,
              <br />
              not the output.
            </>
          }
          body={
            <>
              <p style={paraStyle}>
                Metanoia is built backwards from the visual tells. We extract
                what makes a reference image yours — the typography you trust,
                the color discipline you respect, the spatial sensibility of
                designers you admire — and feed those qualities to the model
                as a brief. Your references inform what's generated; they're
                never copied into it.
              </p>
              <p style={paraStyle}>
                Your text comes out as you wrote it. Your typographic system
                comes out as you chose it. The composition comes out
                asymmetric, the color comes out restrained, and the whole
                thing reads as something a designer made — not as something a
                model dropped onto a canvas.
              </p>
            </>
          }
          dividerTop
        />

        {/* ====== 04 — Who it's for ====== */}
        <section style={{ ...sectionShell, borderTop: "1px solid var(--line)" }}>
          <div style={containerStyle}>
            <div style={sectionLabelStyle}>04 / Built for</div>
            <h2 style={sectionHeadlineStyle}>
              Two kinds of work.
              <br />
              One bar for <em style={emStyle}>quality.</em>
            </h2>
            <div className="ps-audience-grid" style={audienceGridStyle}>
              <AudienceCard
                tag="Business owners & operators"
                lede="Work where hiring a designer is overkill but the brand still has to look like someone who cares made it."
                examples={BUSINESS_EXAMPLES}
                kind="Logos · posters · marketing collateral"
              />
              <AudienceCard
                tag="Content creators & marketers"
                lede="Volume work where speed matters but slop is a tax on engagement."
                examples={CREATOR_EXAMPLES}
                kind="Reels · infographics · social posts · thumbnails"
              />
            </div>
          </div>
        </section>

        {/* ====== Closing CTA ====== */}
        <CtaBand
          heading={<>Try it on a sentence.</>}
          sub="Describe a design, pick your taste, get something you'd actually ship."
          ctaLabel="Open the Studio →"
          href="/"
        />
      </main>
      <Footer />
      {/* Mobile + spacing media queries — single block so the whole page's
       * responsive behavior is in one place. Stacks the editorial 2-col
       * sections and the audience grid to one column at the same 980px
       * breakpoint the rest of the site uses. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Cobalt-tinted bullet for each example in the audience cards.
             * Lives here (not inline) because ::before can't be set via React
             * inline style. Positioned against the list item's paddingLeft. */
            .ps-audience-grid li::before {
              content: "";
              position: absolute;
              left: 4px;
              top: 0.75em;
              width: 5px;
              height: 5px;
              border-radius: 50%;
              background: var(--cobalt-2);
              opacity: 0.85;
            }
            @media (max-width: 980px) {
              .ps-section-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
              .ps-audience-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
            }
          `,
        }}
      />
    </>
  );
}

/* --------------------------------------------------------------------------
 * Section primitive — eyebrow + headline on the left, body on the right
 * (2-col editorial spread at desktop, stacking at <980px). Used for the
 * first three numbered sections. The fourth section ("Built for") uses a
 * different shape and is inlined above.
 * ------------------------------------------------------------------------ */
function Section({
  eyebrow,
  headline,
  body,
  dividerTop,
}: {
  eyebrow: string;
  headline: React.ReactNode;
  body: React.ReactNode;
  dividerTop?: boolean;
}) {
  return (
    <section
      style={{
        ...sectionShell,
        borderTop: dividerTop ? "1px solid var(--line)" : "none",
      }}
    >
      <div style={containerStyle}>
        <div className="ps-section-grid" style={sectionGridStyle}>
          <div>
            <div style={sectionLabelStyle}>{eyebrow}</div>
            <h2 style={sectionHeadlineStyle}>{headline}</h2>
          </div>
          <div>{body}</div>
        </div>
      </div>
    </section>
  );
}

function AudienceCard({
  tag,
  lede,
  examples,
  kind,
}: {
  tag: string;
  lede: string;
  examples: string[];
  kind: string;
}) {
  return (
    <div style={audienceCardStyle}>
      <div style={audienceTagStyle}>{tag}</div>
      <p style={audienceLedeStyle}>{lede}</p>
      <ul style={audienceListStyle}>
        {examples.map((e) => (
          <li key={e} style={audienceItemStyle}>{e}</li>
        ))}
      </ul>
      <div style={audienceKindStyle}>{kind}</div>
    </div>
  );
}

/* ------------------------- styles (inline, scoped) ----------------------- */
const heroSection: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  minHeight: "78vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "160px 32px 100px",
};
const heroAtmos: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 2,
  pointerEvents: "none",
  background:
    "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(74,108,255,0.10) 0%, transparent 60%), radial-gradient(ellipse 100% 100% at 50% 50%, transparent 60%, rgba(7,8,15,0.55) 100%)",
};
const heroContent: React.CSSProperties = {
  position: "relative",
  zIndex: 3,
  textAlign: "center",
  maxWidth: 740,
};
const eyebrowStyle: React.CSSProperties = {
  display: "inline-block",
  fontFamily: "var(--mono)",
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: "var(--cobalt-2)",
  padding: "7px 14px",
  border: "1px solid var(--line)",
  borderRadius: 100,
  background: "rgba(20, 23, 43, 0.6)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  marginBottom: 28,
};
const h1Style: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontWeight: 500,
  fontSize: "clamp(2.6rem, 6vw, 4.6rem)",
  lineHeight: 1.03,
  letterSpacing: "-0.03em",
  marginBottom: 22,
  textShadow: "0 4px 40px rgba(7,8,15,0.8)",
};
const emStyle: React.CSSProperties = {
  fontStyle: "italic",
  color: "var(--cobalt-2)",
  fontWeight: 400,
};
const heroSubStyle: React.CSSProperties = {
  fontSize: "1.12rem",
  lineHeight: 1.55,
  color: "var(--text-dim)",
  maxWidth: 520,
  margin: "0 auto",
  textShadow: "0 2px 20px rgba(7,8,15,0.9)",
};

const sectionShell: React.CSSProperties = {
  padding: "110px 0",
  position: "relative",
  zIndex: 2,
  background: "var(--bg)",
};
const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "0 40px",
};
const sectionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.35fr)",
  gap: 80,
  alignItems: "start",
};
const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "0.74rem",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: "var(--cobalt-2)",
  marginBottom: 18,
};
const sectionHeadlineStyle: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontWeight: 500,
  fontSize: "clamp(1.9rem, 3.4vw, 2.85rem)",
  lineHeight: 1.08,
  letterSpacing: "-0.02em",
  color: "var(--text)",
  marginBottom: 18,
};
const paraStyle: React.CSSProperties = {
  color: "var(--text-dim)",
  fontSize: "1.05rem",
  lineHeight: 1.7,
  marginBottom: 18,
};

const audienceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 28,
  marginTop: 36,
};
const audienceCardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 18,
  padding: "32px 30px",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};
const audienceTagStyle: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "var(--cobalt-2)",
};
const audienceLedeStyle: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontStyle: "italic",
  fontSize: "1.18rem",
  lineHeight: 1.35,
  color: "var(--text)",
  margin: 0,
};
const audienceListStyle: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  borderTop: "1px solid var(--line)",
  paddingTop: 18,
};
const audienceItemStyle: React.CSSProperties = {
  // Bullet rendered via .ps-audience-grid li::before — see the global style
  // block at the bottom of the page (inline styles can't carry ::before).
  color: "var(--text-dim)",
  fontSize: "0.96rem",
  lineHeight: 1.5,
  paddingLeft: 18,
  position: "relative",
};
const audienceKindStyle: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "0.7rem",
  letterSpacing: "0.08em",
  color: "var(--text-faint)",
  marginTop: "auto",
  paddingTop: 4,
};
