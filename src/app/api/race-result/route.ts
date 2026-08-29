import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recalcLevel } from "@/lib/difficulty";
import { RaceResultInput } from "@/types";

// POST /api/race-result — record a finished race for the signed-in user,
// award coins/XP for it, and return the updated profile. Guests hit this
// too (results just aren't persisted, since there's no user to attach them to).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    // Guests can still race, results just aren't persisted.
    return NextResponse.json({ saved: false, reason: "guest" });
  }

  const body: RaceResultInput = await req.json();
  const userId = (session.user as { id: string }).id;

  // Same reward formulas used client-side for guests (see useProfile),
  // kept here as the source of truth for authenticated users
  const coinsEarned = Math.round(body.wpm / 2) + (body.won ? 50 : 10);
  const xpEarned = Math.round(body.wpm * 3 + body.acc);

  // Create the race result and fetch the current user atomically, so the
  // XP/coin update below is based on consistent data
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

  // Apply the earned XP/level/coins to the user record
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel, coins: user.coins + coinsEarned },
  });

  return NextResponse.json({
    saved: true,
    result,
    profile: updated,
    coinsEarned,
    xpEarned,
  });
}

// GET /api/race-result — fetch the signed-in user's most recent race results
export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const results = await prisma.raceResult.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return NextResponse.json(results);
}
