import {
  boolean,
  timestamp,
  pgTable,
  text,
  integer,
  pgEnum,
  index,
  unique,
  jsonb
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm/relations";

export const planEnum = pgEnum('plan', ["FREE", 'BASIC', 'PRO', 'BUSINESS', 'ENTERPRISE', 'OS']);


export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  apiCalls: integer("api_calls").default(0).notNull(),
  plan: planEnum("plan").default("FREE").notNull(),
  customerId: text("customer_id")
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);


export const connectionEnum = pgEnum('connectors', [
  'GOOGLE_DRIVE',
  'DIRECT_UPLOAD',
  'DROPBOX',
  'AWS'
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
  metadata: text("metadata"),
  limitPages: integer("limit_pages"),
  limitFiles: integer("limit_files"),
  lastSynced: timestamp("last_synced", { withTimezone: true }),
  jobId: text("job_id"),
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

export const apiKeys = pgTable("apiKey", {
  name: text("name").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  apiKey: text("api_key").unique().notNull(),
  generatedTime: timestamp("generated_time").notNull(),
});


// ----- Relations ----
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

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  connections: many(connections),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(users, {
    fields: [session.userId],
    references: [users.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}));


export type ProcessedFilesTable = typeof processedFiles.$inferSelect
export type ConnectionTable = typeof connections.$inferSelect
