ALTER TABLE "user" ADD COLUMN "api_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_api_key_unique" UNIQUE("api_key");