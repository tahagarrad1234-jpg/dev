import { z } from "zod";
import { ProductCategoryEnum } from "@workspace/shared";

export const listProductsQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().trim().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z
    .enum(["price_asc", "price_desc", "newest", "name_asc"])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  slug: z
    .string()
    .trim()
    .min(1, "El slug es obligatorio")
    .regex(/^[a-z0-9-]+$/, "El slug debe contener solo letras minúsculas, números y guiones"),
  collection: z.string().trim().min(1, "La colección es obligatoria"),
  category: ProductCategoryEnum,
  priceCents: z.coerce.number().int().nonnegative("El precio en céntimos debe ser >= 0"),
  image: z.string().trim().min(1, "La URL de la imagen es obligatoria"),
  tone: z.string().trim().min(1, "El tono es obligatorio"),
  description: z.string().trim().min(1, "La descripción es obligatoria"),
  stock: z.coerce.number().int().nonnegative().default(0),
  isPublished: z.boolean().default(true),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
