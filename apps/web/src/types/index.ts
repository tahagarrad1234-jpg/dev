export type Category = "All pieces" | "Dress" | "Field" | "Diver" | "Chronograph";

export interface Product {
  id: number;
  name: string;
  collection: string;
  category: Exclude<Category, "All pieces">;
  price: number;
  image: string;
  tone: string;
  description: string;
  stock?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export type OrderStatus = "Pago" | "Preparando" | "Enviado" | "Entregado";

export interface OrderItem {
  id?: number;
  orderId?: string;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId?: string | null;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  paymentMethod: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items?: OrderItem[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  createdAt: string;
}
