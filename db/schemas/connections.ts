import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  integer
} from "drizzle-orm/pg-core"
import { users } from "./users"

export const connectionEnum = pgEnum('connectors', ['GOOGLE_DRIVE', 'AWS', 'NOTION', 'SLACK', 'GMAIL', 'CONFLUENCE',]);
export const importMode = pgEnum("importMode", ["Fast", "Hi-res"])

export const connections = pgTable("connection", {
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  service: connectionEnum("service").notNull(),
  email: text("email").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiryDate: text("expiry_date").notNull(),
  directory: text("directory"),
  folderName: text("folder_name"),
  partition: text("partition").default("default").notNull(),
  metadata: text("metadata"),
  importMode: importMode("import_mode").default("Fast").notNull(),
  documentsCount: integer("documents_count").default(0).notNull(),
  pagesCount: integer("pages_count").default(0).notNull(),
  dateAdded: timestamp("date_added", { withTimezone: true }),
  lastSynced: timestamp("last_synced", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
})

export const ConnectionTable = connections.$inferSelect
