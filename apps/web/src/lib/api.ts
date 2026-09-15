import type { Product, Order, OrderStatus } from "@/types";

export const initialProducts: Product[] = [
  {
    id: 1,
    name: "The Meridian",
    collection: "No. 01 / Automatic",
    category: "Dress",
    price: 1240,
    image:
      "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "bone",
    description:
      "A quietly proportioned automatic in brushed steel and warm ivory.",
    stock: 12,
  },
  {
    id: 2,
    name: "Aster 38",
    collection: "No. 02 / Hand-wound",
    category: "Dress",
    price: 980,
    image:
      "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "ink",
    description:
      "A slender silhouette with a midnight dial and hand-finished indices.",
    stock: 8,
  },
  {
    id: 3,
    name: "Field Note",
    collection: "No. 03 / Mechanical",
    category: "Field",
    price: 745,
    image:
      "https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "olive",
    description:
      "Built for the long way around, with a legible dial and canvas strap.",
    stock: 6,
  },
  {
    id: 4,
    name: "The Deep 200",
    collection: "No. 04 / Diver",
    category: "Diver",
    price: 1680,
    image:
      "https://images.pexels.com/photos/364822/pexels-photo-364822.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "rust",
    description:
      "A disciplined tool watch with a ceramic bezel and 200m resistance.",
    stock: 10,
  },
  {
    id: 5,
    name: "Civic Timer",
    collection: "No. 05 / Chronograph",
    category: "Chronograph",
    price: 1890,
    image:
      "https://images.pexels.com/photos/47856/rolex-watch-time-luxury-47856.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "sand",
    description:
      "A measured chronograph for days that deserve to be remembered.",
    stock: 3,
  },
  {
    id: 6,
    name: "Solstice 34",
    collection: "No. 06 / Quartz",
    category: "Dress",
    price: 590,
    image:
      "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "blue",
    description: "A compact everyday companion with a sun-washed blue dial.",
    stock: 5,
  },
];

export const initialOrders: Order[] = [
  {
    id: "AM-1048",
    customerName: "Sofia Martin",
    email: "sofia@example.com",
    phone: "+34 600 111 222",
    address: "Gran Via 42",
    city: "Madrid",
    postalCode: "28013",
    country: "ES",
    paymentMethod: "card",
    total: 1240,
    status: "Pago",
    createdAt: "Hoy, 10:42",
  },
  {
    id: "AM-1047",
    customerName: "Lucas Bernard",
    email: "lucas@example.com",
    phone: "+33 600 222 333",
    address: "Rue de la Paix 15",
    city: "Paris",
    postalCode: "75002",
    country: "FR",
    paymentMethod: "card",
    total: 1680,
    status: "Preparando",
    createdAt: "Ayer, 16:18",
  },
  {
    id: "AM-1046",
    customerName: "Elena Rossi",
    email: "elena@example.com",
    phone: "+39 300 444 555",
    address: "Via Montenapoleone 8",
    city: "Milano",
    postalCode: "20121",
    country: "IT",
    paymentMethod: "card",
    total: 1035,
    status: "Enviado",
    createdAt: "Ayer, 09:12",
  },
  {
    id: "AM-1045",
    customerName: "Daniel Kim",
    email: "daniel@example.com",
    phone: "+1 555 0199",
    address: "5th Avenue 720",
    city: "New York",
    postalCode: "10019",
    country: "US",
    paymentMethod: "card",
    total: 745,
    status: "Pago",
    createdAt: "12 Jun, 14:06",
  },
];

const LOCAL_PRODUCTS_KEY = "amal_local_products";
const LOCAL_ORDERS_KEY = "amal_local_orders";

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch("/api/products");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Backend offline or local fallback
  }

  const saved = localStorage.getItem(LOCAL_PRODUCTS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Ignore
    }
  }
  return initialProducts;
}

export function saveLocalProducts(products: Product[]): void {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await fetch("/api/orders");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {
    // Fallback
  }

  const saved = localStorage.getItem(LOCAL_ORDERS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Ignore
    }
  }
  return initialOrders;
}

export function saveLocalOrders(orders: Order[]): void {
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

export async function createOrder(orderData: Omit<Order, "id" | "createdAt" | "status">): Promise<Order> {
  const newOrder: Order = {
    ...orderData,
    id: `AM-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "Pago",
    createdAt: "Hoy, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOrder),
    });
    if (res.ok) {
      const serverOrder = await res.json();
      return serverOrder;
    }
  } catch {
    // Local save
  }

  const current = await fetchOrders();
  const updated = [newOrder, ...current];
  saveLocalOrders(updated);
  return newOrder;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  try {
    await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch {
    // Fallback
  }

  const current = await fetchOrders();
  const updated = current.map((o) => (o.id === orderId ? { ...o, status } : o));
  saveLocalOrders(updated);
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
    return true;
  }
}
