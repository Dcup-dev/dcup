ALTER TABLE "connection" RENAME COLUMN "documents" TO "documents_count";--> statement-breakpoint
ALTER TABLE "connection" RENAME COLUMN "pages" TO "pages_count";--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;