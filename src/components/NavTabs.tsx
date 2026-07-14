"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Race" },
  { href: "/garage", label: "Garage" },
  { href: "/multiplayer", label: "Multiplayer" },
  { href: "/profile", label: "Profile" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-line">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`font-display text-xs tracking-widest uppercase px-4 py-3 whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active
                ? "text-white border-cyan"
                : "text-dim border-transparent hover:text-fog"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
