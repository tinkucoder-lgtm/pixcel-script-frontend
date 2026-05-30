// /contact — talk-to-us page. Email-first by design: the prominent
// hello@metanoia.app link is the focal point of the hero; the form below
// is the alternative path for people who'd rather fill in fields. No
// side info-card aside — it would dilute the email's prominence.
//
// Server component; the only client island is the OrbitBackground (canvas)
// and ContactForm (controlled inputs + mailto submission). Form posts
// nowhere; submit builds a mailto: URL with the fields percent-encoded and
// hands off to the user's mail client.

import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OrbitBackground from "../components/OrbitBackground";
import CtaBand from "../components/CtaBand";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact — Metanoia",
  description:
    "Talk to us. Partnerships, press, team plans, creator program, or feedback — we read every message.",
};

// Destination email — kept here so ContactForm and the hero link stay in
// sync if it ever moves. Real email service / inbox wiring lands later.
export const CONTACT_EMAIL = "hello@metanoia.app";

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        {/* ====== HERO with orbit background + prominent email ====== */}
        <section style={heroSection}>
          <OrbitBackground />
          <div aria-hidden style={heroAtmos} />
          <div style={heroContent}>
            <div style={eyebrowStyle}>Contact</div>
            <h1 style={h1Style}>
              Let's <em style={emStyle}>talk.</em>
            </h1>
            <p style={heroSubStyle}>
              Questions about partnerships, press, team plans, the creator
              program — or just feedback. We read every message.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="ps-mail-link"
              style={mailLinkStyle}
            >
              {CONTACT_EMAIL}
            </a>
            <div style={replyHintStyle}>
              // usually replies within 1 business day
            </div>
          </div>
        </section>

        {/* ====== Form — alternative path ====== */}
        <section style={formSection}>
          <div style={formContainerStyle}>
            <div style={formLabelStyle}>Or send a message</div>
            <h2 style={formHeadingStyle}>
              Prefer a <em style={emStyle}>form?</em>
            </h2>
            <p style={formIntroStyle}>
              Fill it in and we'll open your mail client with everything
              prefilled. No backend, no tracking — just a mailto.
            </p>
            <ContactForm destination={CONTACT_EMAIL} />
          </div>
        </section>

        {/* ====== Closing CTA ====== */}
        <CtaBand
          heading={<>Or just try it.</>}
          sub="The fastest way to get a feel for Metanoia is to describe a design and watch one come out."
          ctaLabel="Start designing →"
          href="/"
        />
      </main>
      <Footer />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ps-mail-link:hover {
              border-bottom-color: var(--cobalt-2) !important;
              color: var(--text) !important;
            }
            @media (max-width: 980px) {
              .ps-contact-hero { min-height: 540px !important; padding: 130px 20px 70px !important; }
            }
            @media (max-width: 540px) {
              .ps-contact-hero { min-height: 460px !important; }
            }
          `,
        }}
      />
    </>
  );
}

/* -------------------------- inline styles -------------------------- */
const heroSection: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  minHeight: "68vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "150px 32px 90px",
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
  maxWidth: 720,
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
  fontSize: "1.06rem",
  lineHeight: 1.55,
  color: "var(--text-dim)",
  maxWidth: 520,
  margin: "0 auto 32px",
  textShadow: "0 2px 20px rgba(7,8,15,0.9)",
};
// The hero's focal point. Big serif italic cobalt-2 — reads as the
// editorial "Drop us a line" replacement that the rest of the body type
// system can't pull off as a headline-equivalent.
const mailLinkStyle: React.CSSProperties = {
  display: "inline-block",
  fontFamily: "var(--serif)",
  fontStyle: "italic",
  fontSize: "clamp(1.4rem, 2.4vw, 2.1rem)",
  color: "var(--cobalt-2)",
  textDecoration: "none",
  borderBottom: "1px solid rgba(132,153,255,0.45)",
  padding: "0 2px 6px",
  transition: "color .2s, border-color .2s",
};
const replyHintStyle: React.CSSProperties = {
  marginTop: 18,
  fontFamily: "var(--mono)",
  fontSize: "0.72rem",
  color: "var(--text-faint)",
  letterSpacing: "0.06em",
};

const formSection: React.CSSProperties = {
  padding: "100px 0",
  borderTop: "1px solid var(--line)",
  background: "var(--bg)",
  position: "relative",
  zIndex: 2,
};
const formContainerStyle: React.CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  padding: "0 32px",
};
const formLabelStyle: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "0.74rem",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: "var(--cobalt-2)",
  marginBottom: 14,
};
const formHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontWeight: 500,
  fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)",
  letterSpacing: "-0.02em",
  color: "var(--text)",
  marginBottom: 12,
};
const formIntroStyle: React.CSSProperties = {
  color: "var(--text-dim)",
  fontSize: "1rem",
  lineHeight: 1.55,
  marginBottom: 32,
};
