CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"city" varchar(50) DEFAULT '' NOT NULL,
	"phone" varchar(20),
	"mobile_phone" varchar(20),
	"address" varchar(100),
	"initial_payable_balance" integer DEFAULT 0 NOT NULL,
	"initial_receivable_balance" integer DEFAULT 0 NOT NULL,
	"ending_payable_balance" integer DEFAULT 0 NOT NULL,
	"ending_receivable_balance" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"stock_id" integer,
	"type" varchar(2) DEFAULT 'B' NOT NULL,
	"price" integer NOT NULL,
	"qty" integer NOT NULL,
	"total_price" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"invoice_number" varchar(10) NOT NULL,
	"invoice_date" timestamp with time zone NOT NULL,
	"invoice_value" integer NOT NULL,
	"invoice_discount" integer NOT NULL,
	"paid_amount" integer NOT NULL,
	"payment_discount" integer NOT NULL,
	"balance_due" integer NOT NULL,
	CONSTRAINT "purchase_orders_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "purchase_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"transaction_number" varchar(10) NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"paid_amount" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_return_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_return_id" integer NOT NULL,
	"purchase_order_line_id" integer NOT NULL,
	"type" varchar(3) DEFAULT 'BR' NOT NULL,
	"price" integer NOT NULL,
	"qty" integer NOT NULL,
	"total_price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"invoice_date" timestamp with time zone NOT NULL,
	"return_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_order_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_order_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"stock_id" integer,
	"type" varchar(2) DEFAULT 'J' NOT NULL,
	"price" integer NOT NULL,
	"qty" integer NOT NULL,
	"total_price" integer NOT NULL,
	"salesperson_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"invoice_number" varchar(10) NOT NULL,
	"invoice_date" timestamp with time zone NOT NULL,
	"invoice_value" integer NOT NULL,
	"invoice_discount" integer NOT NULL,
	"paid_amount" integer NOT NULL,
	"payment_discount" integer NOT NULL,
	"balance_due" integer NOT NULL,
	CONSTRAINT "sales_orders_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "sales_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_order_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"transaction_number" varchar(10) NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"paid_amount" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_return_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_return_id" integer NOT NULL,
	"sales_order_line_id" integer NOT NULL,
	"type" varchar(3) DEFAULT 'JR' NOT NULL,
	"price" integer NOT NULL,
	"qty" integer NOT NULL,
	"total_price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_order_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"invoice_date" timestamp with time zone NOT NULL,
	"return_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "salespersons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"front_number" integer NOT NULL,
	"invoice_number" integer NOT NULL,
	"phone_number" varchar(20),
	"sales_code" varchar(20) NOT NULL,
	CONSTRAINT "salespersons_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"initial_stock" integer NOT NULL,
	"ending_stock" integer NOT NULL,
	"product_price" integer DEFAULT 0 NOT NULL,
	"qty_in" integer DEFAULT 0 NOT NULL,
	"qty_out" integer DEFAULT 0 NOT NULL,
	"selling_price" integer,
	"unit" varchar(10) NOT NULL,
	"capital_cost" integer NOT NULL,
	CONSTRAINT "stocks_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_return_lines" ADD CONSTRAINT "purchase_return_lines_purchase_return_id_purchase_returns_id_fk" FOREIGN KEY ("purchase_return_id") REFERENCES "public"."purchase_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_return_lines" ADD CONSTRAINT "purchase_return_lines_purchase_order_line_id_purchase_order_lines_id_fk" FOREIGN KEY ("purchase_order_line_id") REFERENCES "public"."purchase_order_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_salesperson_id_salespersons_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."salespersons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_payments" ADD CONSTRAINT "sales_payments_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_payments" ADD CONSTRAINT "sales_payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_return_lines" ADD CONSTRAINT "sales_return_lines_sales_return_id_sales_returns_id_fk" FOREIGN KEY ("sales_return_id") REFERENCES "public"."sales_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_return_lines" ADD CONSTRAINT "sales_return_lines_sales_order_line_id_sales_order_lines_id_fk" FOREIGN KEY ("sales_order_line_id") REFERENCES "public"."sales_order_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;