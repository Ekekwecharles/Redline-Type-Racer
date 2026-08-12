import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// NextAuth() is a factory function. We pass it our config (adapter, session
// strategy, providers, callbacks), and it returns back a set of ready-made
// functions wired to that config. We didn't write auth(), signIn(), etc.
// ourselves, NextAuth builds them internally based on what we configure here.
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Connects NextAuth to our database via Prisma. Used for account linking
  // and user creation, not for reading sessions (since we're using JWT
  // sessions below, not database sessions).
  adapter: PrismaAdapter(prisma),

  // Tells NextAuth to store session data in a signed, encrypted JWT cookie
  // instead of a database row. This is what auth() decrypts and reads later.
  session: { strategy: "jwt" },

  // Redirects unauthenticated users to our custom /login page instead of
  // NextAuth's default built-in login page.
  pages: { signIn: "/login" },

  providers: [
    // Email and password based login (as opposed to Google, GitHub, etc.)
    Credentials({
      name: "credentials",

      // Defines what fields NextAuth expects when signIn("credentials", {...})
      // is called. Mostly used for NextAuth's default UI, not enforced here.
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // This function runs whenever someone tries to log in. It's the only
      // piece of the login logic we actually wrote ourselves.
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        // Bail out early if either field is missing.
        if (!email || !password) return null;

        // Look up the user by email in MongoDB via Prisma.
        const user = await prisma.user.findUnique({ where: { email } });

        // No matching user, or user has no password on file (e.g. signed up
        // via a different method). Either way, reject the login.
        if (!user || !user.password) return null;

        // Compare the submitted plain-text password against the hashed
        // password stored in the database.
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // Returning a user object here tells NextAuth the login succeeded.
        // This return value is what gets passed into the jwt() callback below
        // as the "user" argument, but only on this initial sign-in.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    // Runs whenever a JWT is created or updated (on login, and on every
    // subsequent request that touches the session). "user" is only present
    // on the very first call, right after authorize() succeeds.
    async jwt({ token, user }) {
      // Persist the user's id into the token itself, since the default
      // token doesn't include it. This makes it available in later requests
      // even though "user" won't be passed in again after initial login.
      if (user) token.id = (user as { id: string }).id;
      return token;
    },

    // Runs whenever a session is checked (e.g. every time auth() or
    // useSession() is called). Takes the data stored in the JWT and shapes
    // it into the final session object our app actually uses.
    async session({ session, token }) {
      // Copy the id from the token onto session.user, since NextAuth's
      // default session type doesn't include id, we added it manually.
      if (session.user)
        (session.user as typeof session.user & { id: string }).id =
          token.id as string;
      return session;
    },
  },
});
