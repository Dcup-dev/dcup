import { betterAuth, GithubProfile } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema";
import { databaseDrizzle } from "@/db";

const dcupEnv = process.env.DCUP_ENV

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(databaseDrizzle, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users
    }
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      plan: {
        type: "string",
        required: true,
      }
    }
  },

  socialProviders: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: (profile) => {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          plan: dcupEnv === 'CLOUD' ? 'FREE' : 'OS'
        }
      }
    },
    github: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: (profile: GithubProfile) => {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.avatar_url,
          plan: dcupEnv === 'CLOUD' ? 'FREE' : 'OS'
        }
      }
    }
  },
});
