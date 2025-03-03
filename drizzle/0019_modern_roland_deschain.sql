ALTER TABLE "connection" DROP CONSTRAINT "connection_email_unique";--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_id" PRIMARY KEY("service","email");