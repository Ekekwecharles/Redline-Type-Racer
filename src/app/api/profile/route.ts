import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile — fetch the signed-in user's profile plus their most
// recent race results (used to derive stats/achievements client-side)
export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    // Only pull the last 12 races, most recent first, to keep the payload small
    include: { raceResults: { orderBy: { createdAt: "desc" }, take: 12 } },
  });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}

// PATCH /api/profile — partially update the signed-in user's profile.
// Only whitelisted fields can be set, so a client can't smuggle in
// arbitrary/protected columns (e.g. id, email, xp) via the request body.
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const allowed = [
    "name",
    "selectedCar",
    "unlockedCars",
    "coins",
    "isPro",
  ] as const;
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const updated = await prisma.user.update({
    where: { id: (session.user as { id: string }).id },
    data,
  });

  return NextResponse.json(updated);
}
