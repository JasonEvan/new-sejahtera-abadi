CREATE TABLE "company_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) DEFAULT 'Sejahtera Abadi' NOT NULL,
	"address" varchar(500) DEFAULT '' NOT NULL
);
