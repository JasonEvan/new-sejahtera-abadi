CREATE INDEX "idx_login_requests_user_id" ON "login_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_login_requests_approval_token" ON "login_requests" USING btree ("approval_token");--> statement-breakpoint
CREATE INDEX "idx_login_requests_status" ON "login_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_trusted_devices_user_id" ON "trusted_devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_trusted_devices_fingerprint" ON "trusted_devices" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_trusted_devices_token" ON "trusted_devices" USING btree ("device_token");