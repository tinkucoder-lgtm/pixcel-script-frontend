// /pricing — three subscription tiers + pay-as-you-go + FAQ + CTA.
//
// Server component (no interactivity needed). Single client island is the
// orbit canvas in the hero (decorative, anchors brand). FAQ is stacked Q/A
// rather than an accordion — matches the editorial-restraint voice that
// runs through About; collapsing animation would feel like marketing-page
// noise on a page that's selling restraint.
//
// CTA destinations:
//   Free tier   → /chat   (home Generate flow)
//   Paid tiers  → /signup?plan={tier}    (placeholder until billing lands)
//   Final CTA   → /        (home Generate flow)
//   "Compare plans" link → #tiers anchor on this page

import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OrbitBackground from "../components/OrbitBackground";
import { createCheckoutSession } from "@/app/actions/checkout";

export const metadata = {
  title: "Pricing — Metanoia",
  description:
    "Three plans plus pay-as-you-go credits. Every plan ships with the full anti-AI-slop engine — the only difference is how many designs you ship.",
};

// ---------------------------------------------------------------------------
// Tier data — declarative so the JSX stays clean and the card renderer is
// reusable. `kind` drives the visual treatment (recommended card gets the
// cobalt glow and badge; everything else is the muted variant).
// ---------------------------------------------------------------------------
type Tier = {
  name: string;
  price: string;
  priceSuffix: string;
  generations: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  kind: "muted" | "recommended";
  badge?: string;
  // When set, the CTA renders a checkout form (signed-in) / SignInButton
  // (signed-out) instead of a plain Link. Value is the plan key Polar
  // maps to a product ID in actions/checkout.ts.
  polarPlan?: "creator" | "studio";
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    priceSuffix: "Free forever",
    generations: "3 generations / month",
    features: [
      "Full anti-AI-slop generation engine",
      "Reference image upload + content extraction",
      "Unlimited refinement turns per design",
      "7-day design history",
    ],
    ctaLabel: "Start free",
    ctaHref: "/chat",
    kind: "muted",
  },
  {
    name: "Creator",
    price: "$19",
    priceSuffix: "/ month",
    generations: "50 generations / month",
    features: [
      "Everything in Free",
      "30-day design history",
      "Standard generation priority",
      "Email support",
    ],
    ctaLabel: "Get Creator",
    ctaHref: "/signup?plan=creator",
    kind: "recommended",
    badge: "MOST POPULAR",
    polarPlan: "creator",
  },
  {
    name: "Studio",
    price: "$49",
    priceSuffix: "/ month",
    generations: "200 generations / month",
    features: [
      "Everything in Creator",
      "Unlimited design history",
      "Priority generation queue",
      "Commercial use license",
      "Priority support",
    ],
    ctaLabel: "Get Studio",
    ctaHref: "/signup?plan=studio",
    kind: "muted",
    polarPlan: "studio",
  },
];

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "What counts as a generation?",
    a: "Each time you click Generate or refine a design counts as one. Cached results from identical prompts don't count against your limit.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings, no questions asked. Access continues through the billing period.",
  },
  {
    q: "Do unused generations roll over?",
    a: "No, generations reset monthly. We may add rollovers later.",
  },
  {
    q: "Can I use designs commercially?",
    a: "Free and Creator: personal use. Studio: full commercial license included.",
  },
  {
    q: "How do pay-as-you-go credits work?",
    a: "Buy a credit pack, use the generations whenever. No expiry.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main>
        {/* ====== HERO with orbit background ====== */}
        <section style={heroSection}>
          <OrbitBackground />
          <div aria-hidden style={heroAtmos} />
          <div style={heroContent}>
            <div style={eyebrowStyle}>Pricing</div>
            <h1 style={h1Style}>
              Pricing as <em style={emStyle}>deliberate</em>
              <br />
              as the design.
            </h1>
            <p style={heroSubStyle}>
              Every plan ships with the full anti-AI-slop engine. The only
              difference is how many designs you ship.
            </p>
          </div>
        </section>

        {/* ====== Tier grid ====== */}
        <section id="tiers" style={tiersSection}>
          <div style={containerStyle}>
            <div className="ps-tier-grid" style={tierGridStyle}>
              {TIERS.map((t) => (
                <TierCard key={t.name} tier={t} />
              ))}
            </div>
          </div>
        </section>

        {/* ====== Pay-as-you-go callout ====== */}
        <section style={paygSection}>
          <div style={containerStyle}>
            <div className="ps-payg-card" style={paygCardStyle}>
              <div style={paygLeft}>
                <h3 style={paygHeading}>Need just <em style={emStyle}>one</em> design?</h3>
                <p style={paygBody}>
                  Pay-as-you-go credits. No subscription, no commitment. Use
                  them whenever.
                </p>
              </div>
              <div style={paygRight}>
                <div style={paygPrice}>
                  <span style={paygPriceBig}>$5</span>
                  <span style={paygPriceSmall}>for 10 generations</span>
                </div>
                <Link href="/signup?plan=payg" style={cobaltButtonStyle}>
                  Buy credits →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ====== FAQ ====== */}
        <section style={faqSection}>
          <div style={{ ...containerStyle, maxWidth: 820 }}>
            <div style={faqLabel}>Questions</div>
            <h2 style={faqHeading}>The short answers.</h2>
            <dl style={faqListStyle}>
              {FAQ_ITEMS.map((f) => (
                <div key={f.q} style={faqItemStyle}>
                  <dt style={faqQStyle}>{f.q}</dt>
                  <dd style={faqAStyle}>{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ====== Closing CTA ====== */}
        <section style={closingSection}>
          <div style={{ ...containerStyle, textAlign: "center" }}>
            <h2 style={closingHeading}>
              Ready to ship designs that <em style={emStyle}>don't look AI-made?</em>
            </h2>
            <p style={closingSub}>
              Built for business owners shipping marketing collateral and
              creators posting reels, infographics, and social.
            </p>
            <div style={closingCtaRow}>
              <Link href="/" style={cobaltButtonStyle}>Start free →</Link>
              <a href="#tiers" style={ghostLinkStyle}>Or compare plans again ↑</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      {/* Responsive — tier grid collapses to single column at 980px, PAYG
       * card stacks its two halves at the same breakpoint, FAQ already
       * lives in a narrow column so it just reflows. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 980px) {
              .ps-tier-grid { grid-template-columns: 1fr !important; gap: 18px !important; }
              .ps-tier-recommended { transform: none !important; }
              .ps-payg-card { flex-direction: column !important; gap: 22px !important; align-items: flex-start !important; }
              .ps-payg-right { width: 100%; flex-direction: row !important; justify-content: space-between !important; }
            }
            @media (max-width: 540px) {
              .ps-payg-right { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
              .ps-payg-right a { text-align: center; }
            }
          `,
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Tier card — declarative, branches only on `kind` for visual treatment.
// Recommended variant: cobalt border, cobalt glow halo, slight upward
// translate so the card sits visually above the muted ones. Badge sits in
// the top-right corner, anchored absolutely so it overflows the card border
// the way "POPULAR" badges traditionally do.
// ---------------------------------------------------------------------------
function TierCard({ tier }: { tier: Tier }) {
  const recommended = tier.kind === "recommended";
  return (
    <div
      className={recommended ? "ps-tier-recommended" : undefined}
      style={{
        ...tierCardBase,
        ...(recommended ? tierCardRecommended : {}),
      }}
    >
      {tier.badge && (
        <div style={badgeStyle}>{tier.badge}</div>
      )}
      <div style={tierNameStyle}>{tier.name}</div>
      <div style={priceRowStyle}>
        <span style={priceBigStyle}>{tier.price}</span>
        <span style={priceSuffixStyle}>{tier.priceSuffix}</span>
      </div>
      <div style={generationsStyle}>{tier.generations}</div>
      <ul style={featureListStyle}>
        {tier.features.map((f) => (
          <li key={f} style={featureItemStyle}>
            <CheckIcon />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {tier.polarPlan ? (
        /* Paid tier — wire to Polar Checkout via Server Action. Signed-in
         * users submit a form that creates a Polar checkout session and
         * redirects to the hosted payment page. Signed-out users see a
         * Clerk modal sign-in trigger styled identically to the CTA. */
        <>
          <Show when="signed-in">
            <form action={createCheckoutSession}>
              <input type="hidden" name="plan" value={tier.polarPlan} />
              <button
                type="submit"
                style={recommended ? cobaltButtonStyle : ghostButtonStyle}
              >
                {tier.ctaLabel}
              </button>
            </form>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button style={recommended ? cobaltButtonStyle : ghostButtonStyle}>
                Sign in to start
              </button>
            </SignInButton>
          </Show>
        </>
      ) : (
        /* Free tier — unchanged. Plain Link to /chat. */
        <Link
          href={tier.ctaHref}
          style={recommended ? cobaltButtonStyle : ghostButtonStyle}
        >
          {tier.ctaLabel}
        </Link>
      )}
    </div>
  );
}

// Small cobalt checkmark — inline SVG so it inherits color and ships zero
// asset weight. Sized to match the feature-list text baseline.
function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      style={{ flexShrink: 0, marginTop: 6 }}
    >
      <path
        d="M2.5 7.2 L5.6 10.2 L11.5 3.8"
        stroke="var(--cobalt-2)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------- styles (inline) ----------------------------- */
const heroSection: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  minHeight: "64vh",
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
  maxWidth: 760,
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
  marginBottom: 26,
};
const h1Style: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontWeight: 500,
  fontSize: "clamp(2.4rem, 5.4vw, 4.2rem)",
  lineHeight: 1.04,
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
  fontSize: "1.08rem",
  lineHeight: 1.55,
  color: "var(--text-dim)",
  maxWidth: 560,
  margin: "0 auto",
  textShadow: "0 2px 20px rgba(7,8,15,0.9)",
};

const tiersSection: React.CSSProperties = {
  padding: "90px 0 60px",
  background: "var(--bg)",
  position: "relative",
  zIndex: 2,
};
const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "0 40px",
};
const tierGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 22,
  alignItems: "stretch",
};

const tierCardBase: React.CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 16,
  padding: "32px 30px",
  gap: 18,
};
// Recommended card sits ~6px above the others on desktop with a cobalt
// border + diffuse halo. Same glow shape as the home Generate button so
// the visual signal is consistent across the product.
const tierCardRecommended: React.CSSProperties = {
  borderColor: "var(--cobalt)",
  background:
    "linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%)",
  boxShadow:
    "0 0 0 1px var(--cobalt), 0 20px 60px -20px var(--cobalt-glow), 0 0 40px -10px rgba(74,108,255,0.35)",
  transform: "translateY(-6px)",
};
const badgeStyle: React.CSSProperties = {
  position: "absolute",
  top: -12,
  right: 24,
  background: "var(--cobalt)",
  color: "#fff",
  fontFamily: "var(--mono)",
  fontSize: "0.64rem",
  fontWeight: 600,
  letterSpacing: "0.14em",
  padding: "5px 12px",
  borderRadius: 6,
  boxShadow: "0 4px 16px -4px var(--cobalt-glow)",
};
const tierNameStyle: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontWeight: 500,
  fontSize: "1.6rem",
  letterSpacing: "-0.01em",
  color: "var(--text)",
};
const priceRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 10,
  marginTop: -6,
};
const priceBigStyle: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontWeight: 500,
  fontSize: "2.8rem",
  letterSpacing: "-0.02em",
  color: "var(--text)",
  lineHeight: 1,
};
const priceSuffixStyle: React.CSSProperties = {
  fontFamily: "var(--sans)",
  fontSize: "0.94rem",
  color: "var(--text-faint)",
};
const generationsStyle: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "0.78rem",
  letterSpacing: "0.06em",
  color: "var(--cobalt-2)",
  textTransform: "uppercase",
  padding: "10px 0 4px",
  borderTop: "1px solid var(--line)",
};
const featureListStyle: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  flex: 1,
};
const featureItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  color: "var(--text-dim)",
  fontSize: "0.94rem",
  lineHeight: 1.5,
};

// Buttons — cobalt for recommended/primary, ghost (outline) for muted/secondary.
// 14px vertical padding ensures the 44px+ tap target the spec requires.
const cobaltButtonStyle: React.CSSProperties = {
  display: "inline-block",
  textAlign: "center",
  background: "var(--cobalt)",
  color: "#fff",
  padding: "14px 22px",
  borderRadius: 10,
  fontSize: "0.95rem",
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  boxShadow: "0 4px 20px -4px var(--cobalt-glow)",
  transition: "all 0.2s",
};
const ghostButtonStyle: React.CSSProperties = {
  display: "inline-block",
  textAlign: "center",
  background: "transparent",
  color: "var(--text)",
  padding: "14px 22px",
  borderRadius: 10,
  fontSize: "0.95rem",
  fontWeight: 600,
  border: "1px solid var(--line)",
  cursor: "pointer",
  transition: "all 0.2s",
};
const ghostLinkStyle: React.CSSProperties = {
  color: "var(--text-dim)",
  fontSize: "0.92rem",
  textDecoration: "none",
  borderBottom: "1px dashed var(--line)",
  paddingBottom: 2,
};

/* --- pay-as-you-go callout --- */
const paygSection: React.CSSProperties = {
  padding: "30px 0 80px",
  background: "var(--bg)",
};
const paygCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 40,
  padding: "36px 40px",
  borderRadius: 20,
  border: "1px solid rgba(74,108,255,0.4)",
  background:
    "radial-gradient(circle at 0% 50%, rgba(74,108,255,0.16) 0%, transparent 50%), var(--surface)",
  boxShadow: "0 0 60px -30px var(--cobalt-glow)",
};
const paygLeft: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};
const paygHeading: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontWeight: 500,
  fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)",
  letterSpacing: "-0.02em",
  color: "var(--text)",
  marginBottom: 8,
};
const paygBody: React.CSSProperties = {
  color: "var(--text-dim)",
  fontSize: "0.98rem",
  lineHeight: 1.55,
};
const paygRight: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 16,
  flexShrink: 0,
};
const paygPrice: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
};
const paygPriceBig: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontWeight: 500,
  fontSize: "2.2rem",
  color: "var(--text)",
  letterSpacing: "-0.02em",
};
const paygPriceSmall: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "0.78rem",
  color: "var(--text-faint)",
  letterSpacing: "0.06em",
};

/* --- FAQ --- */
const faqSection: React.CSSProperties = {
  padding: "80px 0",
  borderTop: "1px solid var(--line)",
  background: "var(--bg)",
};
const faqLabel: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "0.74rem",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: "var(--cobalt-2)",
  marginBottom: 16,
};
const faqHeading: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontWeight: 500,
  fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
  letterSpacing: "-0.02em",
  color: "var(--text)",
  marginBottom: 36,
};
const faqListStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
};
const faqItemStyle: React.CSSProperties = {
  padding: "22px 0",
  borderTop: "1px solid var(--line)",
};
const faqQStyle: React.CSSProperties = {
  fontFamily: "var(--sans)",
  fontWeight: 600,
  fontSize: "1.04rem",
  color: "var(--text)",
  marginBottom: 8,
};
const faqAStyle: React.CSSProperties = {
  color: "var(--text-dim)",
  fontSize: "0.96rem",
  lineHeight: 1.6,
  margin: 0,
};

/* --- closing CTA --- */
const closingSection: React.CSSProperties = {
  padding: "100px 0 130px",
  borderTop: "1px solid var(--line)",
  background: "var(--bg)",
};
const closingHeading: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontWeight: 500,
  fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)",
  letterSpacing: "-0.02em",
  color: "var(--text)",
  marginBottom: 18,
  lineHeight: 1.1,
};
const closingSub: React.CSSProperties = {
  color: "var(--text-dim)",
  fontSize: "1.04rem",
  lineHeight: 1.6,
  maxWidth: 580,
  margin: "0 auto 32px",
};
const closingCtaRow: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
};
