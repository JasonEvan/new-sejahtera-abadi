ALTER TABLE "permissions" ADD COLUMN "display_name" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "module" varchar(100) DEFAULT '' NOT NULL;