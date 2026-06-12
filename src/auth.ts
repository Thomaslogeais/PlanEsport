import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Discord({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (user) session.user.id = user.id;
      return session;
    },
  },
  session: {
    strategy: "database",
  },
});
