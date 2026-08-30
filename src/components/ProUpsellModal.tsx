"use client";

import { useState } from "react";

interface ProUpsellModalProps {
  onClose: () => void;
  onUpgrade: () => void;
}

export default function ProUpsellModal({
  onClose,
  onUpgrade,
}: ProUpsellModalProps) {
  // Selected plan; presence of a value reveals the (fake) payment form
  const [plan, setPlan] = useState<null | { label: string; price: string }>(
    null,
  );
  // Whether the (fake) checkout has been "completed"
  const [done, setDone] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      // Close when clicking the backdrop, but not when clicking inside the modal
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-asphalt-2 border border-line rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="float-right text-dim hover:text-white text-lg"
        >
          ✕
        </button>
        <h2 className="font-display text-xl mt-0 mb-1">Go Pro</h2>
        <p className="text-xs text-dim mb-4">
          Unlock the full garage, Legend+ difficulty, and unlimited races.
        </p>

        {!done ? (
          <>
            {/* Plan picker: monthly vs yearly, yearly highlighted as the better deal */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border border-line rounded-xl p-4 text-center">
                <div className="text-xs text-dim">Monthly</div>
                <div className="font-display text-2xl my-2">
                  $6<span className="text-xs text-dim">/mo</span>
                </div>
                <button
                  onClick={() => setPlan({ label: "Monthly", price: "$6/mo" })}
                  className="border border-line rounded-lg px-4 py-2 text-xs text-fog hover:border-cyan hover:text-white"
                >
                  Select
                </button>
              </div>
              <div className="border border-amber bg-amber/5 rounded-xl p-4 text-center">
                <div className="text-xs text-dim">Yearly</div>
                <div className="font-display text-2xl my-2">
                  $48<span className="text-xs text-dim">/yr</span>
                </div>
                <button
                  onClick={() => setPlan({ label: "Yearly", price: "$48/yr" })}
                  className="bg-gradient-to-r from-violet to-cyan text-asphalt font-bold rounded-lg px-4 py-2 text-xs"
                >
                  Select
                </button>
              </div>
            </div>

            {/* Feature list to justify the upsell */}
            <ul className="text-xs text-fog space-y-1.5 mb-4">
              {[
                "All 5 cars, including the Nullpoint X1 hypercar",
                "Legend+ and fully custom difficulty tuning",
                "Unlimited multiplayer rooms",
                "Full race history and stat export",
              ].map((f) => (
                <li key={f}>
                  <span className="text-cyan">✓</span> {f}
                </li>
              ))}
            </ul>

            {/* Fake payment form, only shown once a plan is picked. No real
                validation/processing — this is a portfolio demo checkout. */}
            {plan && (
              <div className="flex flex-col gap-2.5 mt-3.5">
                <input
                  placeholder="Card number · 4242 4242 4242 4242"
                  className="w-full bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex gap-2.5">
                  <input
                    placeholder="MM/YY"
                    className="flex-1 bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="CVC"
                    className="flex-1 bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    // Grants Pro immediately, no actual charge happens
                    onUpgrade();
                    setDone(true);
                  }}
                  className="bg-gradient-to-r from-violet to-cyan text-asphalt font-display font-bold rounded-lg px-4 py-2.5 text-xs"
                >
                  Confirm {plan.label} · {plan.price}
                </button>
              </div>
            )}

            <div className="text-[11px] text-dim bg-asphalt-3 border border-dashed border-line rounded-lg px-3 py-2 mt-3">
              This is a portfolio demo checkout — no real card is charged. A
              production build would swap this for Stripe Checkout on a real
              backend.
            </div>
          </>
        ) : (
          // Success state after the fake checkout completes
          <div className="text-cyan font-display text-sm py-6 text-center">
            Welcome to Pro (demo mode — no real charge).
          </div>
        )}
      </div>
    </div>
  );
}
