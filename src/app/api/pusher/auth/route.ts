import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher-server";

// Presence channels need a server-signed auth response before the client
// can subscribe. This is what makes cross-device, cross-network multiplayer
// possible: Pusher's infrastructure relays events between browsers anywhere
// in the world, we just vouch for who's connecting.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to race online." }, { status: 401 });
  }

  const formData = await req.formData();
  const socketId = formData.get("socket_id") as string;
  const channel = formData.get("channel_name") as string;

  const presenceData = {
    user_id: (session.user as { id: string }).id,
    user_info: { name: session.user.name || "Racer" },
  };

  const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData);
  return NextResponse.json(authResponse);
}
