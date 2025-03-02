import { NextAuthOptions } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import GithubProvider, { GithubProfile } from "next-auth/providers/github";
import { env } from "process";
import { accounts, sessions, users, verificationTokens } from "./db/schemas/users";
import { databaseDrizzle } from "./db";


export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },

  adapter: DrizzleAdapter(databaseDrizzle, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    session: async ({ session, token }) => {
      if (session) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as "Free" | "Basic" | "Pro" | "Business" | "Enterprise";
        session.user.volume = token.volume as number;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.volume = user.volume;
      } else {
        const dbUser = await databaseDrizzle.query.users.findFirst({
          where: (u, opt) => opt.eq(u.id, token.id as string),
        });
        if (dbUser) {
          token.plan = dbUser.plan;
          token.volume = dbUser.volume;
        }
      }
      return token;
    },
  },
  providers: [
    GoogleProvider({
      clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      profile(profile: GoogleProfile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    GithubProvider({
      clientId: env.AUTH_GITHUB_ID!,
      clientSecret: env.AUTH_GITHUB_SECRET!,
      profile(profile: GithubProfile) {
        return {
          id: profile.id.toString(),
          name: profile.name,
          image: profile.avatar_url,
          email: profile.email,
        };
      },
    }),
  ]
}
