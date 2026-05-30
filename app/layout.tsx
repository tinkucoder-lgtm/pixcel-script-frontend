import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// next/font self-hosts each face and gives us a CSS variable per family.
// globals.css plugs those vars into --serif / --sans / --mono so the rest of
// the app (and /create) just uses var(--serif) etc. — same as the mockups.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz"],
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PixelScript — The anti-AI-slop design engine",
  description:
    "From a single sentence to a finished, downloadable design — typography you control, your exact words rendered right, no slop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${jetbrains.variable}`}
    >
      <body>
        {/* ClerkProvider goes inside <body>, not wrapping <html>, per
         * Clerk's current Next.js critical rule. No auth UI is rendered
         * here — just the provider so server actions and client hooks
         * can read the auth context. UI placement comes in a later step. */}
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
