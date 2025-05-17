import { defineConfig } from "cypress";
import { databaseDrizzle } from "./db";
import { apiKeys, users } from "./db/schemas/users";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { apiKeyGenerator, hashApiKey } from "./lib/api_key";
import { QdrantClient } from "@qdrant/js-client-rest";
dotenv.config({ path: ".env" });

const qdrant_collection_name = "documents"
const qdrantCLient = new QdrantClient({ url: process.env.QDRANT_DB_URL!, apiKey: process.env.QDRANT_DB_KEY });

export default defineConfig({
  retries: {
    runMode: 2,
    openMode: 0
  },
  chromeWebSecurity: false,
  watchForFileChanges: false,
  e2e: {
    setupNodeEvents(on) {
      on("task", {
        async createCollection() {
          try {
            const { collections } = await qdrantCLient.getCollections();
            if (!collections.find(col => col.name === qdrant_collection_name)) {
              await qdrantCLient.createCollection(qdrant_collection_name, {
                vectors: { size: 1536, distance: 'Cosine' },
              });
            }
          } catch { }
          return null
        },
        async deleteCollection() {
          return await qdrantCLient.deleteCollection(qdrant_collection_name)
        },
        async getPointsById({ chunkIds }: { chunkIds: string[] }) {
          return await qdrantCLient.retrieve(qdrant_collection_name, {
            ids: chunkIds,
            with_payload: true,
          })
        },
        async getPointsNumberByFileName({ fileName }: { fileName: string }) {
          const existingPoints = await qdrantCLient.scroll(qdrant_collection_name, {
            filter: {
              must: [{ key: "_document_id", match: { value: fileName } }]
            },
          });
          return existingPoints.points.length
        },
        async createApiKey({ id }: { id: string }) {
          const apiKey = apiKeyGenerator()
          const hashedKey = hashApiKey(apiKey);

          await databaseDrizzle.insert(apiKeys).values({
            userId: id,
            name: "test_API",
            generatedTime: new Date(),
            apiKey: hashedKey,
          });
          return apiKey
        },
        async uploadFile({ key, form }) {
          const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
            },
            body: form,
          });
          const result = await response.json();
          return { status: response.status, body: result };
        },

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
        async getConnections({ email }) {
          const user = await databaseDrizzle.query.users.findFirst({
            where: (u, ops) => ops.eq(u.email, email),
            with: {
              connections: {
                where: (c, ops) => ops.eq(c.isSyncing, false),
                with: {
                  files: true,
                }
              }
            }
          })

          return { conns: user?.connections || [] }
        },
        async getConnection({ email }) {
          while (true) {
            const user = await databaseDrizzle.query.users.findFirst({
              where: (u, ops) => ops.eq(u.email, email),
              with: {
                connections: {
                  where: (c, ops) => ops.eq(c.isSyncing, false),
                  with: {
                    files: true,
                  }
                }
              }
            })
            if (user?.connections && user.connections.length > 0) {
              return { conns: user.connections }
            }
          }
        }
      }
      )
    },
    baseUrl: "http://localhost:3000",
  },
  env: {
    NEXT_PUBLIC_APP_ENV: "TEST",
    DCUP_PARSER: "http://localhost:9000",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "xxxxxxxxx",
    GOOGLE_CLIENT_SECRET: "xxxxx",
    NEXT_PUBLIC_GOOGLE_API_KEY: "xxx",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: "http://localhost:3000",
    DRIZZLE_DATABASE_URL: "postgres://postgres:root@127.0.0.1:5432/dcupTest",
  }
});
