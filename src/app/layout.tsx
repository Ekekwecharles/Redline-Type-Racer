import type { Metadata } from "next";
import { Orbitron, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import NavTabs from "@/components/NavTabs";
import HeaderStats from "@/components/HeaderStats";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-orbitron",
});
const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jbmono",
});

export const metadata: Metadata = {
  title: "REDLINE // Type Racer",
  description: "Race by typing. Your WPM is the throttle.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={`${orbitron.variable} ${jbMono.variable}`}>
      <body className="font-mono">
        <SessionProviderWrapper session={session}>
          <div className="max-w-5xl mx-auto px-4 pt-6 pb-16">
            <header className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div>
                <p className="font-display text-xs tracking-[5px] text-cyan uppercase mb-1">
                  Type Fast• Drive Furious
                </p>
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
