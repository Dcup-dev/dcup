import { defineConfig } from "cypress";
import { databaseDrizzle } from "./db";
import { users } from "./db/schemas/users";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
dotenv.config({ path: ".env" });

export default defineConfig({
  chromeWebSecurity: false,
  e2e: {
    setupNodeEvents(on) {
      on("task", {
        async addNewUser({ email, name, image, plan }) {
          await databaseDrizzle
            .insert(users)
            .values({ email, name, image, plan })
            .onConflictDoNothing()

          const user = await databaseDrizzle.query.users.findFirst({
            where: eq(users.email, email)
          })
          return { id: user?.id, email, name, image }
        },

        async deleteUser({ email }) {
          await databaseDrizzle.delete(users).where(eq(users.email, email))
          return { email }
        },

        async getConnection({ email }) {
          const user = await databaseDrizzle.query.users.findFirst({
            where: (u, ops) => ops.eq(u.email, email),
            with: {
              connections: true,
            }
          })
          return { conns: user?.connections }
        }
      }
      )
    },
    baseUrl: "http://localhost:3000",
  },
  env: {
    APP_ENV: "TEST",
    DCUP_PARSER: "http://localhost:9000",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "xxxxxxxxx",
    GOOGLE_CLIENT_SECRET: "xxxxx",
    NEXT_PUBLIC_GOOGLE_API_KEY: "xxx",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: "http://localhost:3000",
    DRIZZLE_DATABASE_URL: "postgres://postgres:root@127.0.0.1:5432/dcupTest",
  }
});
