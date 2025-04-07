import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  unique,
} from "drizzle-orm/pg-core"
import { users } from "./users"
import { relations } from "drizzle-orm";
export const connectionEnum = pgEnum('connectors', [
  'GOOGLE_DRIVE',
  'AWS',
  'NOTION',
  'SLACK',
  'GMAIL',
  'CONFLUENCE',
  'DIRECT_UPLOAD'
]);

export const connections = pgTable("connection", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  service: connectionEnum("service").notNull(),
  identifier: text("identifier").unique().notNull(),
  credentials: jsonb("credentials"),
  connectionMetadata: jsonb("connection_metadata"),
  folderName: text("folder_name").default("*"),
  partition: text("partition").default("default").notNull(),
  metadata: text("metadata"),
  lastSynced: timestamp("last_synced", { withTimezone: true }),
  isSyncing: boolean("is_syncing").default(false).notNull(),
  isConfigSet: boolean("is_config_set").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
})

export const processedFiles = pgTable("pocessed_file", {
  name: text("name").notNull(),
  connectionId: text("connection_id")
    .notNull()
    .references(() => connections.id, { onDelete: "cascade" }),
  totalPages: integer("total_pages").default(0).notNull(),
  chunksIds: text("chunks_ids").array().notNull(),
}, (t) => [unique().on(t.name, t.connectionId)])

export const connectionRelations = relations(connections, ({ many, one }) => ({
  files: many(processedFiles),
  user: one(users, {
    fields: [connections.userId],
    references: [users.id]
  })
}))

export const processedFilesRelations = relations(processedFiles, ({ one }) => ({
  connection: one(connections, {
    fields: [processedFiles.connectionId],
    references: [connections.id]
  }),
}))

export type ProcessedFilesTable = typeof processedFiles.$inferSelect
export type ConnectionTable = typeof connections.$inferSelect
