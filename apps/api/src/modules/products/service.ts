import { and, desc, asc, eq, ilike, or, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db";
import { amalProducts } from "../../db/schema";
import type { ListProductsQuery, CreateProductInput, UpdateProductInput } from "./schema";

export async function listProducts(query: ListProductsQuery) {
  const { category, q, minPrice, maxPrice, sort, page, pageSize } = query;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(amalProducts.isPublished, true)];

  if (category && category !== "All pieces") {
    conditions.push(eq(amalProducts.category, category));
  }

  if (q) {
    const searchPattern = `%${q}%`;
    conditions.push(
      or(
        ilike(amalProducts.name, searchPattern),
        ilike(amalProducts.description, searchPattern),
        ilike(amalProducts.collection, searchPattern),
      )!,
    );
  }

  if (minPrice !== undefined) {
    // If minPrice is entered in euros (e.g. 500), convert to cents (50000)
    const minCents = minPrice < 1000 ? minPrice * 100 : minPrice;
    conditions.push(gte(amalProducts.priceCents, minCents));
  }

  if (maxPrice !== undefined) {
    const maxCents = maxPrice < 1000 ? maxPrice * 100 : maxPrice;
    conditions.push(lte(amalProducts.priceCents, maxCents));
  }

  const whereClause = and(...conditions);

  let orderByClause = desc(amalProducts.createdAt);
  if (sort === "price_asc") {
    orderByClause = asc(amalProducts.priceCents);
  } else if (sort === "price_desc") {
    orderByClause = desc(amalProducts.priceCents);
  } else if (sort === "name_asc") {
    orderByClause = asc(amalProducts.name);
  }

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(amalProducts)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(amalProducts)
      .where(whereClause),
  ]);

  const total = Number(totalResult[0]?.count || 0);

  return {
    items: items.map((item) => ({
      ...item,
      price: item.priceCents / 100,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProductBySlugOrId(identifier: string) {
  const isNumeric = /^\d+$/.test(identifier);

  const product = await db
    .select()
    .from(amalProducts)
    .where(
      isNumeric
        ? or(
            eq(amalProducts.id, Number(identifier)),
            eq(amalProducts.slug, identifier),
          )
        : eq(amalProducts.slug, identifier),
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!product) return null;

  return {
    ...product,
    price: product.priceCents / 100,
  };
}

export async function createProduct(input: CreateProductInput) {
  const [created] = await db
    .insert(amalProducts)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .returning();

  return {
    ...created,
    price: created.priceCents / 100,
  };
}

export async function updateProduct(id: number, input: UpdateProductInput) {
  const [updated] = await db
    .update(amalProducts)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(amalProducts.id, id))
    .returning();

  if (!updated) return null;

  return {
    ...updated,
    price: updated.priceCents / 100,
  };
}

export async function deleteProduct(id: number) {
  const [deleted] = await db
    .delete(amalProducts)
    .where(eq(amalProducts.id, id))
    .returning();

  return deleted || null;
}
