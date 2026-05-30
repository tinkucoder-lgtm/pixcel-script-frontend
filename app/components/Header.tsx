"use client";

// Shared site header — fixed bar with wordmark, nav, sign-in, Launch Studio.
// Active route is highlighted via usePathname; mobile drawer slides in
// at <980px via a local open/close state.

// Clerk v7 replaces the legacy <SignedIn>/<SignedOut> components with a
// unified <Show when="signed-in" | "signed-out"> API. Same semantics,
// different export — the spec was written against the v6 API.
import { Show, SignInButton, UserButton } from '@clerk/nextjs';
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { MetanoiaLogo } from "./MetanoiaLogo";

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

  const isActive = (href: string) => {
    if (!pathname) return false;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

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
          padding: "5px 40px",
          background: "rgba(7, 8, 15, 0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(36, 42, 74, 0.6)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <MetanoiaLogo className="ps-brand-logo" />
        </Link>

        <nav
          className="ps-nav-main"
          style={{ display: "flex", alignItems: "center", gap: 30 }}
        >
          <div
            className="ps-nav-links"
            style={{
              display: "flex",
              gap: 26,
              fontSize: "0.93rem",
              color: "var(--text-dim)",
            }}
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

        <div
          className="ps-header-actions"
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        >
          <a
            href="#"
            className="ps-btn-ghost"
            style={{
              fontSize: "0.93rem",
              color: "var(--text-dim)",
              transition: "color 0.2s",
            }}
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
          {/* Clerk auth UI — sits after Launch Studio per spec. Show is the
           * Clerk v7 replacement for the legacy <SignedIn>/<SignedOut>. */}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="ps-header-signin">Sign in</button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            {/* Clerk v7 dropped the `afterSignOutUrl` prop; UserButton's
             * default already redirects to "/" after sign-out, which is
             * what the spec wanted. */}
            <UserButton
              appearance={{
                elements: { avatarBox: { width: '32px', height: '32px' } }
              }}
            />
          </Show>
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
        {/* Clerk auth in mobile drawer — full-width Sign in button for
         * tap-target sanity; UserButton kept at its native size and
         * left-aligned to match the rest of the drawer items. */}
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button
              className="ps-header-signin"
              style={{ width: "100%" }}
              onClick={() => setDrawerOpen(false)}
            >
              Sign in
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <div style={{ display: "flex", alignItems: "center" }}>
            <UserButton
              appearance={{
                elements: { avatarBox: { width: '32px', height: '32px' } }
              }}
            />
          </div>
        </Show>
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

      <style jsx global>{`
        .ps-brand-logo {
          height: 60px;
          width: auto;
          display: block;
        }
        .ps-header-signin {
          background: transparent;
          color: var(--text);
          border: 1px solid rgba(255,255,255,0.15);
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.2s, background 0.2s;
        }
        .ps-header-signin:hover {
          border-color: var(--cobalt);
          background: rgba(255,255,255,0.03);
        }
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
            padding: 9px 24px !important;
          }
          .ps-brand-logo {
            height: 48px;
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

