// /pricing — 3 tiers (Starter / Pro / Studio) + FAQ + CTA.
// All tier buttons route to /create except "Contact us" (→ /contact).

import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import CtaBand from "../components/CtaBand";

export const metadata = {
  title: "Pricing — PixelScript",
  description: "Simple plans for solo creators, growing brands, and teams. Cancel anytime.",
};

type Tier = {
  name: string;
  amount: string;
  period: string;
  features: string[];
  cta: { label: string; href: string; variant: "outline" | "cobalt" };
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    amount: "$0",
    period: "/mo",
    features: ["5 designs per month", "All 8 type systems", "Standard resolution", "Community support"],
    cta: { label: "Get started", href: "/create", variant: "outline" },
  },
  {
    name: "Pro",
    amount: "$19",
    period: "/mo",
    features: [
      "Unlimited designs",
      "Custom font uploads",
      "High resolution export",
      "Refinement history",
      "Priority generation",
    ],
    cta: { label: "Start Pro", href: "/create", variant: "cobalt" },
    featured: true,
  },
  {
    name: "Studio",
    amount: "$49",
    period: "/mo",
    features: ["Everything in Pro", "Team workspace", "Brand kit lock-in", "API access", "Dedicated support"],
    cta: { label: "Contact us", href: "/contact", variant: "outline" },
  },
];

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Plans are month-to-month with no lock-in — downgrade or cancel whenever you like.",
  },
  {
    q: "Do I own the designs I make?",
    a: "Every design you generate is yours to use for personal or commercial projects.",
  },
  {
    q: "What happens when I hit my free limit?",
    a: "You can wait for the next month's reset or upgrade to Pro for unlimited generations.",
  },
  {
    q: "Can I use my own fonts?",
    a: "On Pro and above, yes — upload custom headline and body fonts for full typographic control.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          label="Pricing"
          title={
            <>
              Start free.
              <br />
              Scale when{" "}
              <em style={{ fontStyle: "italic", color: "var(--cobalt-2)", fontWeight: 400 }}>
                you're ready.
              </em>
            </>
          }
          sub="Simple plans for solo creators, growing brands, and teams. Cancel anytime."
        />

        <section
          style={{
            padding: "20px 0 100px",
            position: "relative",
            zIndex: 2,
            background: "var(--bg)",
          }}
        >
          <div style={containerStyle}>
            <div className="ps-price-grid" style={priceGridStyle}>
              {TIERS.map((t) => (
                <div
                  key={t.name}
                  style={{
                    background: t.featured
                      ? "linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%)"
                      : "var(--surface)",
                    border: `1px solid ${t.featured ? "var(--cobalt)" : "var(--line)"}`,
                    borderRadius: 18,
                    padding: "32px 28px",
                    transition: "all 0.3s",
                    boxShadow: t.featured ? "0 20px 50px -20px var(--cobalt-glow)" : "none",
                    position: "relative",
                  }}
                >
                  {t.featured && (
                    <div
                      style={{
                        position: "absolute",
                        top: -11,
                        left: 28,
                        background: "var(--cobalt)",
                        color: "#fff",
                        fontFamily: "var(--mono)",
                        fontSize: "0.64rem",
                        letterSpacing: "0.12em",
                        padding: "4px 10px",
                        borderRadius: 6,
                      }}
                    >
                      POPULAR
                    </div>
                  )}
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "var(--text-dim)",
                      marginBottom: 14,
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "2.8rem",
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    {t.amount}
                    <span
                      style={{
                        fontSize: "1rem",
                        color: "var(--text-faint)",
                        fontFamily: "var(--sans)",
                      }}
                    >
                      {" "}
                      {t.period}
                    </span>
                  </div>
                  <ul style={{ listStyle: "none", margin: "24px 0" }}>
                    {t.features.map((f) => (
                      <li
                        key={f}
                        style={{
                          fontSize: "0.92rem",
                          color: "var(--text-dim)",
                          padding: "8px 0 8px 24px",
                          position: "relative",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            color: "var(--cobalt-2)",
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={t.cta.href}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "center",
                      padding: 12,
                      borderRadius: 9,
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      ...(t.cta.variant === "cobalt"
                        ? {
                            background: "var(--cobalt)",
                            color: "#fff",
                            border: "none",
                            boxShadow: "0 4px 20px -4px var(--cobalt-glow)",
                          }
                        : {
                            background: "none",
                            border: "1px solid var(--line)",
                            color: "var(--text)",
                          }),
                    }}
                  >
                    {t.cta.label}
                  </Link>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 24,
                textAlign: "center",
                fontFamily: "var(--mono)",
                fontSize: "0.76rem",
                color: "var(--text-faint)",
              }}
            >
              // Tiers are placeholder — business model still being decided
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
                textAlign: "center",
              }}
            >
              FAQ
            </div>
            <h2
              style={{
                fontFamily: "var(--serif)",
                fontWeight: 500,
                fontSize: "clamp(2rem, 3.6vw, 3rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                marginBottom: 18,
                textAlign: "center",
              }}
            >
              Questions, answered.
            </h2>
            <div style={{ maxWidth: 760, margin: "40px auto 0" }}>
              {FAQ.map((f) => (
                <div
                  key={f.q}
                  style={{ borderTop: "1px solid var(--line)", padding: "24px 0" }}
                >
                  <h3 style={{ fontSize: "1.08rem", marginBottom: 8 }}>{f.q}</h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.96rem" }}>{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CtaBand
          heading={
            <>
              Try it free.
              <br />
              No card required.
            </>
          }
          sub="Five designs a month, on the house."
        />
      </main>
      <Footer />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 980px) {
              .ps-price-grid { grid-template-columns: 1fr !important; }
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
const priceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 20,
  marginTop: 56,
};
