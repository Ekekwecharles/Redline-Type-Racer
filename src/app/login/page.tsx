"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "register") {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/");
  }

  return (
    <div className="max-w-sm mx-auto bg-asphalt-2 border border-line rounded-2xl p-6 mt-6">
      <h2 className="font-display text-lg mb-1">{mode === "signin" ? "Sign In" : "Create Account"}</h2>
      <p className="text-xs text-dim mb-4">
        {mode === "signin" ? "Sign in to save progress and race online." : "Set up an account to unlock cloud saves and multiplayer."}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {mode === "register" && (
          <input
            placeholder="Driver name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-sm"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-sm"
        />
        {error && <p className="text-pink text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="font-display text-[11px] tracking-wider font-bold bg-gradient-to-r from-violet to-cyan text-asphalt rounded-lg px-4 py-2.5 mt-1 disabled:opacity-50"
        >
          {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "signin" ? "register" : "signin")}
        className="text-xs text-dim underline mt-3.5"
      >
        {mode === "signin" ? "Need an account? Register" : "Already have an account? Sign in"}
      </button>

      <a href="/" className="block text-xs text-dim underline mt-2">
        Continue as guest instead
      </a>
    </div>
  );
}
