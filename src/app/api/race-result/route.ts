import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recalcLevel } from "@/lib/difficulty";
import { RaceResultInput } from "@/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    // Guests can still race, results just aren't persisted.
    return NextResponse.json({ saved: false, reason: "guest" });
  }

  const body: RaceResultInput = await req.json();
  const userId = (session.user as { id: string }).id;

  const coinsEarned = Math.round(body.wpm / 2) + (body.won ? 50 : 10);
  const xpEarned = Math.round(body.wpm * 3 + body.acc);

  const [result, user] = await prisma.$transaction([
    prisma.raceResult.create({
      data: {
        userId,
        wpm: body.wpm,
        accuracy: body.acc,
        maxCombo: body.maxCombo,
        won: body.won,
        mode: body.mode,
      },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);

  const newXp = user.xp + xpEarned;
  const newLevel = recalcLevel(newXp);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel, coins: user.coins + coinsEarned },
  });

  return NextResponse.json({ saved: true, result, profile: updated, coinsEarned, xpEarned });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const results = await prisma.raceResult.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return NextResponse.json(results);
}
