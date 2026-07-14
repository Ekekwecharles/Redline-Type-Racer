import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    include: { raceResults: { orderBy: { createdAt: "desc" }, take: 12 } },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const allowed = ["name", "selectedCar", "unlockedCars", "coins", "isPro"] as const;
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
