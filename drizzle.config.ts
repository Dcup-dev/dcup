import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schemas/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DRIZZLE_DATABASE_URL as string,
  },
  verbose: true,
  strict: true,
} satisfies Config;
