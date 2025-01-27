import { NextAuthOptions } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import GithubProvider, { GithubProfile } from "next-auth/providers/github";
import FacebookProvider, { FacebookProfile } from "next-auth/providers/facebook";
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
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID!,
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
    FacebookProvider({
      clientId: env.FACEBOOK_CLIENT_ID!,
      clientSecret: env.FACEBOOK_CLIENT_SECRET!,
      profile(profile: FacebookProfile) {
        return {
          id: profile.id,
          name: profile.name,
          image: profile.picture.data.url,
          email: profile.email,
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
