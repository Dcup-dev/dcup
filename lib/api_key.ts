import crypto from "crypto";

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
