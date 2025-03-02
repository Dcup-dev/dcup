ALTER TABLE "connection" DROP CONSTRAINT "connection_service_unique";--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_email_unique" UNIQUE("email");