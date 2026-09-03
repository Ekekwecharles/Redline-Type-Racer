"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";

// Thin client-component wrapper around NextAuth's SessionProvider.
// SessionProvider itself must run on the client, but the initial session
// (fetched server-side, e.g. in a root layout) can be passed in as a prop
// so there's no flash of unauthenticated state on first render.
export default function SessionProviderWrapper({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
