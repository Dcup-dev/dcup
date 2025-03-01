import {
  pgEnum,
  pgTable,
  text,
} from "drizzle-orm/pg-core"
import { users } from "./users"

export const connectionEnum = pgEnum('connectors', ['GOOGLE_DRIVE', 'AWS', 'NOTION', 'SLACK', 'GMAIL', 'CONFLUENCE',]);

export const connections = pgTable("connection", {
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  service: connectionEnum("service").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiryDate: text("expiry_date").notNull()
})
