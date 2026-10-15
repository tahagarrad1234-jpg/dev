import Stripe from "stripe";
import { config } from "../../config";
import { logger } from "../../lib/logger";
import { createOrder, markOrderPaid, releaseOrderStock } from "../orders/service";
import type { CreateCheckoutSessionInput } from "./schema";

const stripe = config.STRIPE_SECRET_KEY
  ? new Stripe(config.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as any,
    })
  : null;

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
  userId?: string | null,
  idempotencyKey?: string,
) {
  // Step 1: Create pending order inside DB with row-locking and server prices
  const order = await createOrder(
    {
      items: input.items,
      customerName: input.customerName,
      email: input.customerEmail,
      phone: input.customerPhone || "+34 900 000 000",
      address: input.shippingAddress.street,
      city: input.shippingAddress.city,
      postalCode: input.shippingAddress.postalCode,
      country: input.shippingAddress.country,
      paymentMethod: "stripe",
    },
    userId,
  );

  // Step 2: If Stripe is not configured (offline / mock dev mode), provide fallback URL
  if (!stripe) {
    logger.warn({ orderId: order.id }, "Stripe secret key not configured; generating mock checkout redirect.");
    return {
      orderId: order.id,
      url: `${config.WEB_ORIGIN}/checkout/success?order=${order.id}&mock=true`,
      sessionId: `mock_session_${order.id}`,
    };
  }

  // Step 3: Build Stripe line items from server-verified order items
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(
    (item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.productName,
        },
        unit_amount: item.unitPriceCents,
      },
      quantity: item.quantity,
    }),
  );

  // Add insured shipping line if shipping > 0
  if (order.shippingCents > 0) {
    line_items.push({
      price_data: {
        currency: "eur",
        product_data: {
          name: "Envío Privado Blindado Asegurado",
        },
        unit_amount: order.shippingCents,
      },
      quantity: 1,
    });
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    client_reference_id: order.id,
    customer_email: input.customerEmail,
    metadata: {
      orderId: order.id,
    },
    line_items,
    allow_promotion_codes: true,
    success_url: `${config.WEB_ORIGIN}/checkout/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.WEB_ORIGIN}/checkout?cancelled=1`,
  };

  const session = await stripe.checkout.sessions.create(
    sessionParams,
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  return {
    orderId: order.id,
    sessionId: session.id,
    url: session.url,
  };
}

export async function handleStripeWebhookEvent(rawBody: Buffer, signature: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured on this server");
  }

  if (!config.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.STRIPE_WEBHOOK_SECRET,
  );

  logger.info({ eventType: event.type, eventId: event.id }, "Processing Stripe webhook event");

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.client_reference_id || session.metadata?.orderId;
      if (orderId) {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        await markOrderPaid(orderId, paymentIntentId);
        logger.info({ orderId, paymentIntentId }, "Order marked paid via Stripe webhook");
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.client_reference_id || session.metadata?.orderId;
      if (orderId) {
        await releaseOrderStock(orderId);
        logger.info({ orderId }, "Order cancelled and stock released via Stripe webhook");
      }
      break;
    }

    default:
      logger.debug({ eventType: event.type }, "Unhandled Stripe webhook event type ignored");
      break;
  }

  return { received: true };
}
