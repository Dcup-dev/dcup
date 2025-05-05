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
        async addNewUser({ id, email, name, image }) {
          await databaseDrizzle
            .insert(users)
            .values({ id, email, name, image })
            .onConflictDoNothing()

          const user = await databaseDrizzle.query.users.findFirst({
            where: eq(users.email, email)
          })

          return { id: user?.id, email, name, image }
        }
      }
      )
    },
    baseUrl: "http://localhost:3000",
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: "http://localhost:3000",
    DRIZZLE_DATABASE_URL: "postgres://postgres:root@127.0.0.1:5432/dcupTest",
  }
});
