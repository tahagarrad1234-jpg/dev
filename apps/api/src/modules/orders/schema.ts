import { z } from "zod";
import { OrderStatusSchema } from "@workspace/shared";

export const orderItemInputSchema = z.object({
  productId: z.coerce.number().int().positive("ID de producto no válido"),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor que 0"),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, "El pedido debe contener al menos un artículo"),
  customerName: z.string().trim().min(2, "El nombre del cliente es obligatorio").max(100),
  email: z.string().trim().email("Formato de correo electrónico no válido"),
  phone: z.string().trim().min(5, "El teléfono de contacto es obligatorio"),
  address: z.string().trim().min(5, "La dirección de entrega es obligatoria"),
  city: z.string().trim().min(2, "La ciudad es obligatoria"),
  postalCode: z.string().trim().min(2, "El código postal es obligatorio"),
  country: z.string().trim().min(2, "El país es obligatorio"),
  paymentMethod: z.string().trim().default("card"),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const listOrdersQuerySchema = z.object({
  status: OrderStatusSchema.optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const updateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
