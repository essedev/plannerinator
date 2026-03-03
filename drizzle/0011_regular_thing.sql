CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings', 'cash', 'investment', 'credit_card', 'other');--> statement-breakpoint
CREATE TYPE "public"."expense_frequency" AS ENUM('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual');--> statement-breakpoint
CREATE TYPE "public"."investment_type" AS ENUM('etf', 'stock', 'bond', 'fund', 'other');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense', 'transfer');--> statement-breakpoint
CREATE TABLE "annual_revenue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"year" integer NOT NULL,
	"total_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_expenses" numeric(12, 2) DEFAULT '0' NOT NULL,
	"taxable_income" numeric(12, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_annual_revenue_user_year" UNIQUE("user_id","year")
);
--> statement-breakpoint
CREATE TABLE "bank_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" DEFAULT 'checking' NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"initial_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "budget" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"category_id" uuid NOT NULL,
	"month" date NOT NULL,
	"planned_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_budget_user_category_month" UNIQUE("user_id","category_id","month")
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"icon" text,
	"color" text,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"company" text,
	"vat_number" text,
	"default_rate" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crypto_holding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric(18, 8) NOT NULL,
	"purchase_price" numeric(12, 2),
	"exchange" text,
	"wallet_type" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "f24_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp with time zone,
	"period" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "finance_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"pension_fund" jsonb DEFAULT '{}'::jsonb,
	"investment_strategy" jsonb DEFAULT '{}'::jsonb,
	"risk_profile" jsonb DEFAULT '{}'::jsonb,
	"vehicles" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "finance_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "fixed_expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"frequency" "expense_frequency" DEFAULT 'monthly' NOT NULL,
	"due_day" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fixed_expense_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "investment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "investment_type" DEFAULT 'etf' NOT NULL,
	"ticker" text,
	"quantity" numeric(12, 6),
	"purchase_price" numeric(12, 2),
	"purchase_date" date,
	"current_value" numeric(12, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recurring_invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"client_id" uuid NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"frequency" "expense_frequency" DEFAULT 'monthly' NOT NULL,
	"next_due_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tax_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"regime" text DEFAULT 'forfettario' NOT NULL,
	"ateco_code" text,
	"ateco_description" text,
	"coefficiente_redditivita" numeric(5, 2),
	"inps_rate" numeric(5, 2),
	"inps_minimum" numeric(10, 2),
	"tax_rate" numeric(5, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" date NOT NULL,
	"description" text,
	"category_id" uuid,
	"bank_account_id" uuid,
	"to_account_id" uuid,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "work_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"job_title" text,
	"company_name" text,
	"partita_iva" text,
	"hourly_rate" numeric(10, 2),
	"monthly_rate" numeric(10, 2),
	"skills" jsonb DEFAULT '[]'::jsonb,
	"specializations" jsonb DEFAULT '[]'::jsonb,
	"work_history" jsonb DEFAULT '[]'::jsonb,
	"income_targets" jsonb DEFAULT '[]'::jsonb,
	"plan_b" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "annual_revenue" ADD CONSTRAINT "annual_revenue_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_parent_id_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crypto_holding" ADD CONSTRAINT "crypto_holding_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "f24_payment" ADD CONSTRAINT "f24_payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_settings" ADD CONSTRAINT "finance_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_expense" ADD CONSTRAINT "fixed_expense_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_expense" ADD CONSTRAINT "fixed_expense_group_id_fixed_expense_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."fixed_expense_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_expense_group" ADD CONSTRAINT "fixed_expense_group_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment" ADD CONSTRAINT "investment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoice" ADD CONSTRAINT "recurring_invoice_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoice" ADD CONSTRAINT "recurring_invoice_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_profile" ADD CONSTRAINT "tax_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_bank_account_id_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_to_account_id_bank_account_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."bank_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_profile" ADD CONSTRAINT "work_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_annual_revenue_user" ON "annual_revenue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_bank_account_user" ON "bank_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_bank_account_active" ON "bank_account" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_bank_account_deleted" ON "bank_account" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_budget_user" ON "budget" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_budget_month" ON "budget" USING btree ("month");--> statement-breakpoint
CREATE INDEX "idx_budget_category" ON "budget" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_category_user" ON "category" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_category_type" ON "category" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_category_parent" ON "category" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_category_deleted" ON "category" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_client_user" ON "client" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_client_active" ON "client" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_client_deleted" ON "client" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_crypto_holding_user" ON "crypto_holding" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_crypto_holding_symbol" ON "crypto_holding" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "idx_crypto_holding_deleted" ON "crypto_holding" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_f24_payment_user" ON "f24_payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_f24_payment_date" ON "f24_payment" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_f24_payment_paid" ON "f24_payment" USING btree ("is_paid");--> statement-breakpoint
CREATE INDEX "idx_f24_payment_deleted" ON "f24_payment" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_finance_settings_user" ON "finance_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_fixed_expense_user" ON "fixed_expense" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_fixed_expense_group" ON "fixed_expense" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_fixed_expense_active" ON "fixed_expense" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_fixed_expense_deleted" ON "fixed_expense" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_fixed_expense_group_user" ON "fixed_expense_group" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_fixed_expense_group_deleted" ON "fixed_expense_group" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_investment_user" ON "investment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_investment_type" ON "investment" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_investment_deleted" ON "investment" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_recurring_invoice_user" ON "recurring_invoice" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recurring_invoice_client" ON "recurring_invoice" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_recurring_invoice_active" ON "recurring_invoice" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_recurring_invoice_deleted" ON "recurring_invoice" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_tax_profile_user" ON "tax_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_user" ON "transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_date" ON "transaction" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_transaction_type" ON "transaction" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_transaction_category" ON "transaction" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_account" ON "transaction" USING btree ("bank_account_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_deleted" ON "transaction" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_work_profile_user" ON "work_profile" USING btree ("user_id");