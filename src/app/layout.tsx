import type { Metadata } from "next";
import { Orbitron, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import NavTabs from "@/components/NavTabs";
import HeaderStats from "@/components/HeaderStats";

// Loads Orbitron from next/font/google and generates a CSS variable
// named --font-orbitron. orbitron.variable is NOT that variable itself,
// it's a generated class name that, when applied to an element, defines
// --font-orbitron on that element (and everything inside it).
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-orbitron",
});

// Same idea for JetBrains Mono, exposed as --font-jbmono.
const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jbmono",
});

export const metadata: Metadata = {
  title: "REDLINE // Type Racer",
  description: "Race by typing. Your WPM is the throttle.",
};

// RootLayout is a Server Component (note: async function body, no "use client").
// Being a Server Component lets it call auth() directly on the server,
// no client-side fetch or loading state needed to know who's logged in.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Reads and decrypts the session cookie on the server. Returns the
  // Session object if logged in, or null otherwise. Runs before any HTML
  // is sent to the browser.
  const session = await auth();

  return (
    // Applying both .variable classes here puts --font-orbitron and
    // --font-jbmono into scope for the entire document, since CSS variables
    // cascade down to all descendants. Without this, font-display and
    // font-mono (defined in tailwind.config.ts) would fall back to their
    // generic fallback fonts (sans-serif / monospace).
    <html lang="en" className={`${orbitron.variable} ${jbMono.variable}`}>
      <body className="font-mono">
        {/* SessionProviderWrapper is a Client Component. Rendering a Client
            Component from a Server Component is fine and doesn't force
            RootLayout to become client-side too. It wraps next-auth's
            SessionProvider, which needs React Context and internal state
            to track and refresh the session in the browser. The
            server-fetched `session` is passed in as the initial value so
            there's no loading flicker on first render. */}
        <SessionProviderWrapper session={session}>
          <div className="max-w-5xl mx-auto px-4 pt-6 pb-16">
            <header className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div>
                <p className="font-display text-xs tracking-[5px] text-cyan uppercase mb-1">
                  Type Fast• Drive Furious
                </p>
                {/* Gradient text: bg-clip-text + text-transparent clips the
                    background gradient to the shape of the letters and
                    hides the solid text color so the gradient shows through */}
                <h1 className="font-display font-black text-3xl sm:text-4xl bg-gradient-to-r from-red-500 via-cyan to-violet bg-clip-text text-transparent tracking-wide">
                  REDLINE
                </h1>
              </div>
              <HeaderStats />
            </header>
            <NavTabs />
            <main className="mt-5">{children}</main>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
