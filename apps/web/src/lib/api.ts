import type { Order, OrderStatus } from "@workspace/shared";

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const res = await fetch(`/api/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error("No se pudo actualizar el estado del pedido");
  }
}

export async function subscribeNewsletter(email: string): Promise<boolean> {
  try {
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
