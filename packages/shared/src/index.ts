import { z } from "zod";

// ==========================================
// User & Auth
// ==========================================
export const UserRoleSchema = z.enum(["customer", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  createdAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;
export type UserProfile = User;

export const PublicUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

// ==========================================
// Catalog & Products
// ==========================================
export const CategoryEnum = z.enum([
  "All pieces",
  "Dress",
  "Field",
  "Diver",
  "Chronograph",
]);
export type Category = z.infer<typeof CategoryEnum>;
export type ProductCategory = Exclude<Category, "All pieces">;
export const ProductCategoryEnum = z.enum(["Dress", "Field", "Diver", "Chronograph"]);

export const FilterCategoryEnum = CategoryEnum;
export type FilterCategory = Category;


export const ProductSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  name: z.string().min(1),
  collection: z.string().min(1),
  category: ProductCategoryEnum,
  priceCents: z.number().int().nonnegative(),
  price: z.number().nonnegative(),
  image: z.string().min(1),
  tone: z.string().min(1),
  description: z.string().min(1),
  stock: z.number().int().nonnegative().default(0),
  isPublished: z.boolean().default(true),
  specs: z.record(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Product = z.infer<typeof ProductSchema>;

export interface CartItem extends Product {
  quantity: number;
}

// Canonical seed product data (single source of truth for catalogue across backend and frontend)
export const SEED_PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "the-meridian",
    name: "The Meridian",
    collection: "No. 01 / Automatic",
    category: "Dress",
    priceCents: 124000,
    price: 1240,
    image:
      "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "bone",
    description:
      "A quietly proportioned automatic in brushed steel and warm ivory.",
    stock: 12,
    isPublished: true,
  },
  {
    id: 2,
    slug: "aster-38",
    name: "Aster 38",
    collection: "No. 02 / Hand-wound",
    category: "Dress",
    priceCents: 98000,
    price: 980,
    image:
      "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "ink",
    description:
      "A slender silhouette with a midnight dial and hand-finished indices.",
    stock: 8,
    isPublished: true,
  },
  {
    id: 3,
    slug: "field-note",
    name: "Field Note",
    collection: "No. 03 / Mechanical",
    category: "Field",
    priceCents: 74500,
    price: 745,
    image:
      "https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "olive",
    description:
      "Built for the long way around, with a legible dial and canvas strap.",
    stock: 6,
    isPublished: true,
  },
  {
    id: 4,
    slug: "the-deep-200",
    name: "The Deep 200",
    collection: "No. 04 / Diver",
    category: "Diver",
    priceCents: 168000,
    price: 1680,
    image:
      "https://images.pexels.com/photos/364822/pexels-photo-364822.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "rust",
    description:
      "A disciplined tool watch with a ceramic bezel and 200m resistance.",
    stock: 10,
    isPublished: true,
  },
  {
    id: 5,
    slug: "civic-timer",
    name: "Civic Timer",
    collection: "No. 05 / Chronograph",
    category: "Chronograph",
    priceCents: 189000,
    price: 1890,
    image:
      "https://images.pexels.com/photos/47856/rolex-watch-time-luxury-47856.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "sand",
    description:
      "A measured chronograph for days that deserve to be remembered.",
    stock: 3,
    isPublished: true,
  },
  {
    id: 6,
    slug: "solstice-34",
    name: "Solstice 34",
    collection: "No. 06 / Quartz",
    category: "Dress",
    priceCents: 59000,
    price: 590,
    image:
      "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "blue",
    description:
      "A compact everyday companion with a sun-washed blue dial.",
    stock: 5,
    isPublished: true,
  },
];

export const INITIAL_PRODUCTS = SEED_PRODUCTS;

// ==========================================
// Orders & Checkout
// ==========================================
export const STANDARD_ORDER_STATUSES = [
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "Pago",
  "Preparando",
  "Enviado",
  "Entregado",
] as const;

export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const OrderStatusLegacySchema = z.enum([
  "Pago",
  "Preparando",
  "Enviado",
  "Entregado",
  "Cancelado",
  "Reembolsado",
]);
export type OrderStatusLegacy = z.infer<typeof OrderStatusLegacySchema>;

export const OrderItemSchema = z.object({
  id: z.number().int().positive().optional(),
  orderId: z.string().optional(),
  productId: z.number().int().positive(),
  productName: z.string().min(1),
  unitPriceCents: z.number().int().nonnegative(),
  unitPrice: z.number().nonnegative().optional(),
  quantity: z.number().int().positive(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string().min(1),
  userId: z.string().uuid().nullable().optional(),
  customerName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  paymentMethod: z.string().min(1),
  stripePaymentIntentId: z.string().nullable().optional(),
  status: OrderStatusSchema,
  subtotalCents: z.number().int().nonnegative().optional(),
  shippingCents: z.number().int().nonnegative().default(0).optional(),
  taxCents: z.number().int().nonnegative().default(0).optional(),
  totalCents: z.number().int().nonnegative().optional(),
  total: z.number().nonnegative(),
  createdAt: z.string(),
  items: z.array(OrderItemSchema).optional(),
});
export type Order = z.infer<typeof OrderSchema>;

// ==========================================
// Currency & Price Helpers
// ==========================================
export function centsToEuros(cents: number): number {
  return cents / 100;
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

export function money(
  amount: number,
  options?: { isCents?: boolean; currency?: string },
): string {
  const value = options?.isCents ? amount / 100 : amount;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: options?.currency ?? "EUR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}
