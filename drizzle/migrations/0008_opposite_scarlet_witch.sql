CREATE INDEX "idx_purchase_order_lines_purchase_order_id" ON "purchase_order_lines" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_order_lines_stock_id" ON "purchase_order_lines" USING btree ("stock_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_client_id" ON "purchase_orders" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_invoice_date" ON "purchase_orders" USING btree ("invoice_date");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_unpaid" ON "purchase_orders" USING btree ("balance_due") WHERE "purchase_orders"."balance_due" > 0;--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_unpaid_amount" ON "purchase_orders" USING btree ("paid_amount") WHERE "purchase_orders"."paid_amount" = 0;--> statement-breakpoint
CREATE INDEX "idx_purchase_payments_order_date" ON "purchase_payments" USING btree ("purchase_order_id","payment_date");--> statement-breakpoint
CREATE INDEX "idx_purchase_return_lines_purchase_return_id" ON "purchase_return_lines" USING btree ("purchase_return_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_return_lines_purchase_order_line_id" ON "purchase_return_lines" USING btree ("purchase_order_line_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_returns_order_date" ON "purchase_returns" USING btree ("purchase_order_id","return_date");--> statement-breakpoint
CREATE INDEX "idx_sales_order_lines_sales_order_id" ON "sales_order_lines" USING btree ("sales_order_id");--> statement-breakpoint
CREATE INDEX "idx_sales_order_lines_stock_id" ON "sales_order_lines" USING btree ("stock_id");--> statement-breakpoint
CREATE INDEX "idx_sales_orders_client_id" ON "sales_orders" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_sales_orders_invoice_date" ON "sales_orders" USING btree ("invoice_date");--> statement-breakpoint
CREATE INDEX "idx_sales_orders_unpaid" ON "sales_orders" USING btree ("balance_due") WHERE "sales_orders"."balance_due" > 0;--> statement-breakpoint
CREATE INDEX "idx_sales_orders_client_balance" ON "sales_orders" USING btree ("client_id","balance_due");--> statement-breakpoint
CREATE INDEX "idx_sales_payments_order_date" ON "sales_payments" USING btree ("sales_order_id","payment_date");--> statement-breakpoint
CREATE INDEX "idx_sales_return_lines_sales_return_id" ON "sales_return_lines" USING btree ("sales_return_id");--> statement-breakpoint
CREATE INDEX "idx_sales_return_lines_sales_order_line_id" ON "sales_return_lines" USING btree ("sales_order_line_id");--> statement-breakpoint
CREATE INDEX "idx_sales_returns_order_date" ON "sales_returns" USING btree ("sales_order_id","return_date");--> statement-breakpoint
CREATE INDEX "idx_stocks_ending_stock" ON "stocks" USING btree ("ending_stock");--> statement-breakpoint
CREATE INDEX "idx_users_role_id" ON "users" USING btree ("role_id");