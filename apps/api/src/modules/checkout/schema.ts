import { z } from "zod";

export const CreateCheckoutSessionSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive().default(1),
      }),
    )
    .min(1, "La cesta no puede estar vacía"),
  customerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  customerEmail: z.string().email("Correo electrónico no válido"),
  customerPhone: z.string().optional().default("+34 900 000 000"),
  shippingAddress: z.object({
    street: z.string().min(3, "La dirección es obligatoria"),
    city: z.string().min(2, "La ciudad es obligatoria"),
    postalCode: z.string().min(3, "El código postal es obligatorio"),
    country: z.string().min(2, "El país es obligatorio"),
  }),
});

export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;
