"use client";

/**
 * /signup — placeholder destination for Pricing CTAs (?plan=creator/studio/payg).
 *
 * Exists so the Pricing buttons don't 404 today. Real billing/auth wiring
 * lands later. Reads ?plan from the URL via window.location to avoid the
 * useSearchParams Suspense-boundary requirement (same pattern as /create).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

const PLAN_COPY: Record<string, { label: string; sub: string }> = {
  creator: {
    label: "Creator",
    sub: "$19 / month — 50 generations, 30-day history, email support.",
  },
  studio: {
    label: "Studio",
    sub: "$49 / month — 200 generations, unlimited history, commercial license.",
  },
  payg: {
    label: "Pay-as-you-go credits",
    sub: "$5 for 10 generations. No subscription, no expiry.",
  },
};

export default function SignupPage() {
  const [plan, setPlan] = useState<string | null>(null);

  // Read ?plan client-side — same pattern as /create. Avoids the Suspense
  // boundary requirement around next/navigation's useSearchParams.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = new URLSearchParams(window.location.search).get("plan");
    setPlan(fromUrl);
  }, []);

  const copy = plan ? PLAN_COPY[plan] : null;

  return (
    <>
      <Header />
      <main
        style={{
          minHeight: "calc(100vh - 200px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "140px 24px 80px",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            maxWidth: 540,
            textAlign: "center",
            padding: "44px 36px",
            border: "1px solid var(--line)",
            borderRadius: 18,
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "var(--cobalt-2)",
              marginBottom: 14,
            }}
          >
            {copy ? copy.label : "Sign up"}
          </div>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 500,
              fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
              letterSpacing: "-0.02em",
              color: "var(--text)",
              marginBottom: 14,
              lineHeight: 1.1,
            }}
          >
            Billing isn't live yet.
          </h1>
          <p
            style={{
              color: "var(--text-dim)",
              fontSize: "1rem",
              lineHeight: 1.6,
              marginBottom: 8,
            }}
          >
            {copy?.sub ?? "Pick a plan from the pricing page to continue."}
          </p>
          <p
            style={{
              color: "var(--text-faint)",
              fontSize: "0.9rem",
              lineHeight: 1.5,
              marginBottom: 28,
            }}
          >
            We're wiring up payments now — in the meantime, the free tier
            covers everything you need to ship a few designs.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-block",
                background: "var(--cobalt)",
                color: "#fff",
                padding: "13px 28px",
                borderRadius: 10,
                fontSize: "0.95rem",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 4px 20px -4px var(--cobalt-glow)",
              }}
            >
              Try it free in the Studio →
            </Link>
            <Link
              href="/pricing"
              style={{
                color: "var(--text-dim)",
                fontSize: "0.9rem",
                textDecoration: "none",
                borderBottom: "1px dashed var(--line)",
                paddingBottom: 2,
              }}
            >
              ← Back to pricing
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
