ALTER TABLE "connection" DROP CONSTRAINT "connection_id";--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_email_service_unique" UNIQUE("email","service");