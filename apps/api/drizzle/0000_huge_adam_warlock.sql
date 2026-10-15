CREATE TABLE "amal_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "amal_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'customer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "amal_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"collection" text NOT NULL,
	"category" text NOT NULL,
	"price_cents" integer NOT NULL,
	"image" text NOT NULL,
	"tone" text NOT NULL,
	"description" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amal_products_stock_non_negative" CHECK ("amal_products"."stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "amal_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" integer,
	"product_name" text NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "amal_order_items_quantity_positive" CHECK ("amal_order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "amal_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"customer_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"payment_method" text NOT NULL,
	"stripe_payment_intent_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "amal_favorites" (
	"user_id" uuid NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amal_favorites_user_id_product_id_pk" PRIMARY KEY("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "amal_newsletter" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "amal_sessions" ADD CONSTRAINT "amal_sessions_user_id_amal_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."amal_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amal_order_items" ADD CONSTRAINT "amal_order_items_order_id_amal_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."amal_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amal_order_items" ADD CONSTRAINT "amal_order_items_product_id_amal_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."amal_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amal_orders" ADD CONSTRAINT "amal_orders_user_id_amal_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."amal_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amal_favorites" ADD CONSTRAINT "amal_favorites_user_id_amal_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."amal_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amal_favorites" ADD CONSTRAINT "amal_favorites_product_id_amal_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."amal_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "amal_sessions_expires_at_idx" ON "amal_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "amal_users_email_unique" ON "amal_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "amal_products_slug_unique" ON "amal_products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "amal_order_items_order_id_idx" ON "amal_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "amal_orders_user_id_idx" ON "amal_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "amal_orders_created_at_idx" ON "amal_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "amal_orders_status_idx" ON "amal_orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "amal_newsletter_email_unique" ON "amal_newsletter" USING btree ("email");--> statement-breakpoint
ALTER TABLE "amal_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "amal_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "amal_products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "amal_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "amal_order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "amal_favorites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "amal_newsletter" ENABLE ROW LEVEL SECURITY;