import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and an 8+ character password are required." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name || "Racer",
      email,
      password: hashed,
      unlockedCars: ["bike"],
    },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
