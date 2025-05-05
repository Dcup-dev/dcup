import { NextAuthOptions } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import GithubProvider, { GithubProfile } from "next-auth/providers/github";
import { env } from "process";
import { accounts, sessions, users, verificationTokens } from "./db/schemas/users";
import { databaseDrizzle } from "./db";

const dcupEnv = env.DCUP_ENV

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
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string
      }
      return session;
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
          plan: dcupEnv === 'CLOUD' ? 'FREE' : 'OS'
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
          plan: dcupEnv === 'CLOUD' ? 'FREE' : 'OS'
        };
      },
    }),
  ]
}
