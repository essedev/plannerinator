ALTER TABLE "health_goal" RENAME TO "goal";--> statement-breakpoint
ALTER TABLE "goal" DROP CONSTRAINT "health_goal_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "idx_health_goal_user";--> statement-breakpoint
DROP INDEX "idx_health_goal_status";--> statement-breakpoint
DROP INDEX "idx_health_goal_deleted";--> statement-breakpoint
ALTER TABLE "goal" ADD COLUMN "domain" text DEFAULT 'health' NOT NULL;--> statement-breakpoint
ALTER TABLE "goal" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "goal" ADD CONSTRAINT "goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_goal_user" ON "goal" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_goal_domain" ON "goal" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_goal_status" ON "goal" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_goal_deleted" ON "goal" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "goal" DROP COLUMN "metric_type";