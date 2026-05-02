CREATE TABLE "login_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_fingerprint" varchar(255) NOT NULL,
	"device_label" varchar(255),
	"approval_token" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "login_requests_approval_token_unique" UNIQUE("approval_token")
);
--> statement-breakpoint
CREATE TABLE "trusted_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_fingerprint" varchar(255) NOT NULL,
	"device_token" varchar(255) NOT NULL,
	"device_label" varchar(255),
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trusted_devices_device_token_unique" UNIQUE("device_token")
);
--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "display_name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "module" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "login_requests" ADD CONSTRAINT "login_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trusted_devices" ADD CONSTRAINT "trusted_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;