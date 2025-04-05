import crypto from "crypto";
import { NextRequest } from "next/server";
import { APIError } from "./APIError";
import { databaseDrizzle } from "@/db";
import { apiKeys } from "@/db/schemas/users";
import { eq } from "drizzle-orm";

// Create hash using email + secret
export function hashApiKey(apiKey: string) {
  return crypto
    .createHash("sha256")
    .update(apiKey + process.env.API_SECRET)
    .digest("hex");
}

// Generate a secure random API key
export function apiKeyGenerator() {
  const randomPart = crypto.randomBytes(16).toString("hex");
  return `Dcup_${randomPart}`;
}

export function compareApiKey(originKey: string, apiKey: string): boolean {
  return originKey === hashApiKey(apiKey);
}

export async function checkAuth(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.split("Bearer ")[1]) {
    throw new APIError({
      code: "unauthorized",
      status: 401,
      message: "Access denied",
    })
  }

  const keyHashed = hashApiKey(auth.split("Bearer ")[1]);
  const key = await databaseDrizzle
    .select({ userId: apiKeys.userId })
    .from(apiKeys)
    .where(eq(apiKeys.apiKey, keyHashed))
    .limit(1);
  if (!key[0]?.userId) {
    throw new APIError(
      {
        code: "forbidden",
        status: 403,
        message: "Access denied",
      },
    );
  }

  return key[0].userId;
}
