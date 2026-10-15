import { sql } from "drizzle-orm";
import { db, pool } from "./index";
import { amalProducts } from "./schema";
import { SEED_PRODUCTS } from "./seed-data";
import { config } from "../config";
import { logger } from "../lib/logger";

async function main() {
  const isProduction = config.NODE_ENV === "production";
  const hasForceFlag = process.argv.includes("--force");

  if (isProduction && !hasForceFlag) {
    logger.error(
      "Seed execution blocked: running seed in production requires the '--force' flag.",
    );
    console.error(
      "❌ ERROR: El comando seed está bloqueado en entorno de producción. Añade '--force' para forzar la ejecución.",
    );
    process.exit(1);
  }

  logger.info(
    { productCount: SEED_PRODUCTS.length },
    "Seeding products into amal_products (idempotent upsert by slug)...",
  );

  for (const product of SEED_PRODUCTS) {
    await db
      .insert(amalProducts)
      .values({
        slug: product.slug,
        name: product.name,
        collection: product.collection,
        category: product.category,
        priceCents: product.priceCents,
        image: product.image,
        tone: product.tone,
        description: product.description,
        stock: product.stock,
        isPublished: product.isPublished,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: amalProducts.slug,
        set: {
          name: sql`excluded.name`,
          collection: sql`excluded.collection`,
          category: sql`excluded.category`,
          priceCents: sql`excluded.price_cents`,
          image: sql`excluded.image`,
          tone: sql`excluded.tone`,
          description: sql`excluded.description`,
          stock: sql`excluded.stock`,
          isPublished: sql`excluded.is_published`,
          updatedAt: sql`now()`,
        },
      });
  }

  logger.info("Database seeding completed successfully");
  console.log(
    `✅ ${SEED_PRODUCTS.length} productos insertados/actualizados correctamente en amal_products.`,
  );
}

main()
  .then(() => pool.end())
  .catch((err) => {
    logger.error({ err }, "Seed failed");
    console.error("Error durante el seed:", err);
    pool.end();
    process.exit(1);
  });