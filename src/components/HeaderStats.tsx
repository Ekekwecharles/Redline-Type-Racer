"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useProfile } from "@/hooks/useProfile";
import ProUpsellModal from "./ProUpsellModal";

export default function HeaderStats() {
  const { status } = useSession();
  const { profile, isGuest, upgradeToPro } = useProfile();
  const [showPro, setShowPro] = useState(false);

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <div className="flex items-center gap-1.5 bg-asphalt-2 border border-line rounded-full px-3.5 py-1.5 text-xs text-cyan">
        LVL <b className="font-display">{profile.level}</b>
      </div>
      <div className="flex items-center gap-1.5 bg-asphalt-2 border border-line rounded-full px-3.5 py-1.5 text-xs text-amber">
        ◆ <b className="font-display">{profile.coins}</b>
      </div>
      <button
        onClick={() => setShowPro(true)}
        className={`font-display text-[11px] tracking-wider font-bold rounded-full px-4 py-2.5 ${
          profile.isPro
            ? "bg-asphalt-2 text-amber border border-amber"
            : "bg-gradient-to-r from-amber to-pink text-[#12070a]"
        }`}
      >
        {profile.isPro ? "PRO ACTIVE" : "Upgrade to Pro"}
      </button>

      {isGuest ? (
        <Link href="/login" className="font-display text-[11px] tracking-wider text-fog border border-line rounded-full px-4 py-2.5 hover:border-cyan hover:text-white">
          Sign In
        </Link>
      ) : (
        <button
          onClick={() => signOut()}
          className="font-display text-[11px] tracking-wider text-fog border border-line rounded-full px-4 py-2.5 hover:border-pink hover:text-white"
        >
          Sign Out
        </button>
      )}

      {showPro && <ProUpsellModal onClose={() => setShowPro(false)} onUpgrade={upgradeToPro} />}
    </div>
  );
}
