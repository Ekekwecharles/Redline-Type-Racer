import PusherClient from "pusher-js";

let client: PusherClient | null = null;

// One socket per browser tab, reused across room joins.
export function getPusherClient(): PusherClient {
  if (!client) {
    client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });
  }
  return client;
}
