"use client";

// Shared site header — fixed bar with logo, nav, sign-in, Launch Studio.
// Active route is highlighted via usePathname; mobile drawer slides in
// at <980px via a local open/close state. Mirrors design-reference markup.

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const launchStudio = () => router.push("/create");

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 40px",
          background: "rgba(7, 8, 15, 0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(36, 42, 74, 0.6)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--serif)",
            fontWeight: 600,
            fontSize: "1.32rem",
            letterSpacing: "-0.01em",
            color: "var(--text)",
          }}
        >
          <LogoMark />
          Pixel<span style={{ color: "var(--cobalt-2)" }}>Script</span>
        </Link>

        <nav className="ps-nav-main" style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div
            className="ps-nav-links"
            style={{ display: "flex", gap: 26, fontSize: "0.93rem", color: "var(--text-dim)" }}
          >
            {NAV.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  style={{
                    color: active ? "var(--text)" : "var(--text-dim)",
                    transition: "color 0.2s",
                  }}
                >
                  {n.label}
                  {active && (
                    <div
                      style={{
                        height: 2,
                        background: "var(--cobalt)",
                        borderRadius: 2,
                        marginTop: 3,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="ps-header-actions" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a
            href="#"
            className="ps-btn-ghost"
            style={{ fontSize: "0.93rem", color: "var(--text-dim)", transition: "color 0.2s" }}
            onClick={(e) => e.preventDefault()}
          >
            Sign in
          </a>
          <button
            className="ps-btn-cobalt"
            onClick={launchStudio}
            style={{
              background: "var(--cobalt)",
              color: "#fff",
              padding: "9px 18px",
              borderRadius: 9,
              fontSize: "0.9rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 20px -4px var(--cobalt-glow)",
              transition: "all 0.2s",
            }}
          >
            Launch Studio
          </button>
          <button
            aria-label="Open menu"
            className="ps-hamburger"
            onClick={() => setDrawerOpen(true)}
            style={{
              display: "none",
              flexDirection: "column",
              gap: 5,
              cursor: "pointer",
              background: "none",
              border: "none",
            }}
          >
            <span style={hamSpan} />
            <span style={hamSpan} />
            <span style={hamSpan} />
          </button>
        </div>
      </header>

      {/* Mobile drawer — hidden on desktop via CSS in <style jsx global>. */}
      <div
        className="ps-drawer"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 280,
          background: "var(--bg-2)",
          borderLeft: "1px solid var(--line)",
          zIndex: 200,
          padding: 30,
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <button
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          style={{
            alignSelf: "flex-end",
            background: "none",
            border: "none",
            color: "var(--text)",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          ×
        </button>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setDrawerOpen(false)}
            style={{ fontSize: "1.05rem", color: "var(--text-dim)" }}
          >
            {n.label}
          </Link>
        ))}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setDrawerOpen(false);
          }}
          style={{ fontSize: "0.95rem", color: "var(--text-dim)" }}
        >
          Sign in
        </a>
        <button
          onClick={() => {
            setDrawerOpen(false);
            launchStudio();
          }}
          style={{
            width: "100%",
            background: "var(--cobalt)",
            color: "#fff",
            padding: "11px 18px",
            borderRadius: 9,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px -4px var(--cobalt-glow)",
          }}
        >
          Launch Studio
        </button>
      </div>

      {/* Responsive show/hide for desktop links vs hamburger.
       * Inline styles can't express media queries, so this small style block
       * carries the breakpoints — same 980px / 540px split as the mockups. */}
      <style jsx global>{`
        .ps-hamburger span {
          width: 24px;
          height: 2px;
          background: var(--text);
          border-radius: 2px;
          transition: 0.3s;
        }
        .ps-btn-cobalt:hover {
          background: var(--cobalt-2);
          transform: translateY(-1px);
          box-shadow: 0 6px 26px -4px var(--cobalt-glow);
        }
        .ps-btn-ghost:hover {
          color: var(--text);
        }
        .ps-nav-links a:hover {
          color: var(--text);
        }
        @media (max-width: 980px) {
          .ps-nav-links,
          .ps-header-actions .ps-btn-ghost,
          .ps-header-actions .ps-btn-cobalt {
            display: none !important;
          }
          .ps-hamburger {
            display: flex !important;
          }
          .ps-drawer {
            display: flex !important;
          }
          header {
            padding: 16px 24px !important;
          }
        }
      `}</style>
    </>
  );
}

const hamSpan: React.CSSProperties = {
  width: 24,
  height: 2,
  background: "var(--text)",
  borderRadius: 2,
  transition: "0.3s",
};

function LogoMark() {
  // Square gradient tile with an inset white border — pulled from the
  // mockup's .logo-mark + ::after. Reused in the footer too.
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: 7,
        background: "linear-gradient(135deg, var(--cobalt) 0%, var(--cobalt-deep) 100%)",
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
  );
}
