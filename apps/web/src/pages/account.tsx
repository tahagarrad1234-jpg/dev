import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  User,
  LogOut,
  Package,
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle2,
  Truck,
  ChevronDown,
  ChevronUp,
  RotateCw,
  MapPin,
  Lock,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/features/auth/use-auth";
import { useCart } from "@/features/cart/use-cart";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/features/catalog/components/cart-drawer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { money, type Product } from "@workspace/shared";

interface SavedAddress {
  id: string;
  title: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

const ADDRESSES_STORAGE_KEY = "amal_saved_addresses_v1";

export default function AccountPage() {
  const { user, isLoading, isAuthenticated, logout, isAdmin } = useAuth();
  const { cartCount, setCartOpen, addToCart } = useCart();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Active section tab
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "security" | "privacy">("orders");

  // Expanded order accordion
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Profile edit state
  const [displayName, setDisplayName] = useState("");
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Saved addresses
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => {
    try {
      const raw = localStorage.getItem(ADDRESSES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    title: "Domicilio",
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "ES",
    phone: "",
  });

  // GDPR export state
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user]);

  // Save addresses to localStorage
  const saveAddresses = (newAddrs: SavedAddress[]) => {
    setAddresses(newAddrs);
    try {
      localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(newAddrs));
    } catch {
      // Ignored
    }
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressForm.name || !newAddressForm.address || !newAddressForm.postalCode) {
      return;
    }
    const newEntry: SavedAddress = {
      id: `addr_${Date.now()}`,
      title: newAddressForm.title || "Domicilio",
      name: newAddressForm.name,
      address: newAddressForm.address,
      city: newAddressForm.city,
      postalCode: newAddressForm.postalCode,
      country: newAddressForm.country || "ES",
      phone: newAddressForm.phone,
      isDefault: addresses.length === 0,
    };
    saveAddresses([...addresses, newEntry]);
    setNewAddressForm({
      title: "Domicilio",
      name: "",
      address: "",
      city: "",
      postalCode: "",
      country: "ES",
      phone: "",
    });
    setIsAddingAddress(false);
  };

  const handleDeleteAddress = (id: string) => {
    saveAddresses(addresses.filter((a) => a.id !== id));
  };

  const handleSetDefaultAddress = (id: string) => {
    saveAddresses(
      addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      })),
    );
  };

  // Orders Query
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", "my-orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders/me");
      if (!res.ok) {
        // Fallback to /api/orders
        const fallback = await fetch("/api/orders");
        if (!fallback.ok) return [];
        const fJson = await fallback.json();
        return Array.isArray(fJson) ? fJson : fJson?.orders || fJson?.items || [];
      }
      const json = await res.json();
      return Array.isArray(json) ? json : json?.orders || json?.items || [];
    },
    enabled: isAuthenticated,
  });

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Re-order handler: add all items from past order to current cart
  const handleReorder = (order: any) => {
    if (!order.items || order.items.length === 0) return;

    for (const item of order.items) {
      const dummyProduct: Product = {
        id: item.productId,
        slug: `watch-${item.productId}`,
        name: item.productName || "Pieza AMAL",
        collection: "Colección Atelier",
        price: item.unitPrice,
        priceCents: Math.round(item.unitPrice * 100),
        category: "Dress",
        image: "/assets/the-meridian.webp",
        description: "Pieza recuperada de su historial de pedidos.",
        tone: "gold",
        stock: 5,
        isPublished: true,
      };
      addToCart(dummyProduct, item.quantity || 1);
    }
    setCartOpen(true);
  };

  // Handle display name update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar perfil");
      }
      setProfileMessage({ type: "success", text: "Nombre de perfil actualizado correctamente." });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (err) {
      setProfileMessage({ type: "error", text: (err as Error).message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Las contraseñas nuevas no coinciden." });
      return;
    }
    if (newPassword.length < 10) {
      setPasswordMessage({ type: "error", text: "La nueva contraseña debe tener al menos 10 caracteres." });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar la contraseña.");
      }
      setPasswordMessage({ type: "success", text: "Su contraseña ha sido modificada con éxito." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage({ type: "error", text: (err as Error).message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // GDPR Data Portability & Erasure
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error("No se pudo generar el archivo de exportación.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `amal_datos_personales_${user?.id || "export"}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "¿Está seguro de que desea eliminar su cuenta y todos sus datos personales? Esta acción es irreversible conforme al derecho de supresión del RGPD.",
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/account/me", { method: "DELETE" });
      if (!res.ok) throw new Error("Error al procesar la solicitud de eliminación.");
      alert("Su cuenta y datos han sido eliminados satisfactoriamente.");
      window.location.href = "/";
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  const orders = ordersData || [];

  const getStatusStep = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "pending" || s === "pendiente") return 1;
    if (s === "paid" || s === "pago") return 2;
    if (s === "preparing" || s === "preparando") return 3;
    if (s === "shipped" || s === "enviado") return 4;
    if (s === "delivered" || s === "entregado") return 5;
    return 1;
  };

  const getStatusLabel = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return "Recibido";
    if (s === "paid") return "Pago Confirmado";
    if (s === "preparing") return "En Preparación";
    if (s === "shipped") return "Enviado";
    if (s === "delivered") return "Entregado";
    if (s === "cancelled") return "Cancelado";
    if (s === "refunded") return "Reembolsado";
    return status || "Procesado";
  };

  return (
    <div className="site-wrapper">
      <AnnouncementBar />
      <Header cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

      <main style={{ maxWidth: "1050px", margin: "2rem auto 5rem", padding: "0 1.5rem", minHeight: "60vh" }}>
        <Link href="/" className="back-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", color: "var(--color-muted, #999)", fontSize: "0.9rem", textDecoration: "none" }}>
          <ArrowLeft size={16} />
          <span>Volver al catálogo</span>
        </Link>

        {/* Profile Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem", borderBottom: "1px solid var(--color-border, rgba(255,255,255,0.08))", paddingBottom: "2rem", marginBottom: "2.5rem" }}>
          <div>
            <span className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem", color: "var(--gold-deep, #c9a66a)" }}>
              ESPACIO PERSONAL ATELIER
            </span>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 300, margin: "0.5rem 0" }}>
              Bienvenido, {user.name || user.email.split("@")[0]}
            </h1>
            <p style={{ color: "var(--color-muted, #888)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>{user.email}</span>
              {isAdmin && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.5rem", background: "rgba(139,38,62,0.2)", borderRadius: "4px", color: "#ff8da1", fontSize: "0.75rem" }}>
                  <Shield size={12} /> Administrador
                </span>
              )}
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            {isAdmin && (
              <Link href="/admin" className="button button-ghost">
                Panel de Administración
              </Link>
            )}
            <button
              type="button"
              className="button button-ghost"
              onClick={logout}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              data-testid="button-account-logout"
            >
              <LogOut size={15} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-border, rgba(255,255,255,0.08))", marginBottom: "2.5rem", overflowX: "auto" }}>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            style={{
              padding: "0.75rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "orders" ? "2px solid var(--gold-deep, #c9a66a)" : "2px solid transparent",
              color: activeTab === "orders" ? "var(--color-fg, #fff)" : "var(--color-muted, #888)",
              cursor: "pointer",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              whiteSpace: "nowrap",
            }}
          >
            <Package size={16} />
            <span>Mis Pedidos ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("addresses")}
            style={{
              padding: "0.75rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "addresses" ? "2px solid var(--gold-deep, #c9a66a)" : "2px solid transparent",
              color: activeTab === "addresses" ? "var(--color-fg, #fff)" : "var(--color-muted, #888)",
              cursor: "pointer",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              whiteSpace: "nowrap",
            }}
          >
            <MapPin size={16} />
            <span>Direcciones ({addresses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            style={{
              padding: "0.75rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "security" ? "2px solid var(--gold-deep, #c9a66a)" : "2px solid transparent",
              color: activeTab === "security" ? "var(--color-fg, #fff)" : "var(--color-muted, #888)",
              cursor: "pointer",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              whiteSpace: "nowrap",
            }}
          >
            <Lock size={16} />
            <span>Perfil y Seguridad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            style={{
              padding: "0.75rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "privacy" ? "2px solid var(--gold-deep, #c9a66a)" : "2px solid transparent",
              color: activeTab === "privacy" ? "var(--color-fg, #fff)" : "var(--color-muted, #888)",
              cursor: "pointer",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              whiteSpace: "nowrap",
            }}
          >
            <Shield size={16} />
            <span>Privacidad RGPD</span>
          </button>
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === "orders" && (
          <section className="account-orders">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={20} color="var(--gold-deep, #c9a66a)" />
                <h2 style={{ fontSize: "1.5rem", fontWeight: 400, margin: 0 }}>Historial de adquisiciones</h2>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--color-muted, #888)" }}>
                Garantía oficial de 5 años activa en cada pieza
              </span>
            </div>

            {ordersLoading ? (
              <p>Cargando pedidos registrados...</p>
            ) : orders.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {orders.map((order: any) => {
                  const isExpanded = !!expandedOrders[order.id];
                  const currentStep = getStatusStep(order.status);
                  const isFinished = (order.status || "").toLowerCase() === "delivered";

                  return (
                    <div
                      key={order.id}
                      style={{
                        background: "var(--color-surface, rgba(255,255,255,0.02))",
                        border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                      data-testid={`account-order-${order.id}`}
                    >
                      {/* Order Header Summary */}
                      <div
                        style={{
                          padding: "1.5rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "1rem",
                          borderBottom: isExpanded ? "1px solid var(--color-border, rgba(255,255,255,0.06))" : "none",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <strong style={{ fontSize: "1.15rem", letterSpacing: "0.02em" }}>
                              Pedido #{order.id}
                            </strong>
                            <span
                              style={{
                                padding: "0.2rem 0.6rem",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                background: isFinished
                                  ? "rgba(40, 167, 69, 0.15)"
                                  : "rgba(201, 166, 106, 0.15)",
                                color: isFinished ? "#51cf66" : "var(--gold-deep, #c9a66a)",
                              }}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </div>

                          <div style={{ color: "var(--color-muted, #888)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
                            Fecha: {order.createdAt ? new Date(order.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "Reciente"} • {order.items?.length || 1} artículo(s)
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 600, fontSize: "1.2rem", color: "var(--color-fg, #fff)" }}>
                              {money(order.total)}
                            </div>
                            <span style={{ fontSize: "0.8rem", color: "var(--color-muted, #888)" }}>
                              IVA (21%) incluido
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              type="button"
                              className="button button-ghost"
                              onClick={() => handleReorder(order)}
                              title="Añadir estas piezas nuevamente a la bolsa"
                              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                            >
                              <RotateCw size={14} />
                              <span>Volver a pedir</span>
                            </button>

                            <button
                              type="button"
                              className="button button-ghost"
                              onClick={() => toggleOrderExpand(order.id)}
                              style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.6rem" }}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Stepper */}
                      <div
                        style={{
                          padding: "1.25rem 1.5rem",
                          background: "rgba(0,0,0,0.15)",
                          borderBottom: isExpanded ? "1px solid var(--color-border, rgba(255,255,255,0.06))" : "none",
                        }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", position: "relative" }}>
                          {[
                            { step: 1, label: "Confirmado", icon: Clock },
                            { step: 2, label: "En Atelier", icon: Shield },
                            { step: 3, label: "Enviado", icon: Truck },
                            { step: 4, label: "Entregado", icon: CheckCircle2 },
                          ].map((s) => {
                            const isPassed = currentStep >= s.step;
                            const IconComponent = s.icon;
                            return (
                              <div key={s.step} style={{ textAlign: "center", position: "relative" }}>
                                <div
                                  style={{
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "50%",
                                    margin: "0 auto 0.5rem",
                                    display: "grid",
                                    placeItems: "center",
                                    background: isPassed ? "var(--gold-deep, #c9a66a)" : "rgba(255,255,255,0.05)",
                                    color: isPassed ? "#111" : "rgba(255,255,255,0.3)",
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  <IconComponent size={14} />
                                </div>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: isPassed ? 500 : 400,
                                    color: isPassed ? "var(--color-fg, #fff)" : "var(--color-muted, #666)",
                                  }}
                                >
                                  {s.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Tracking Link if dispatched */}
                        {order.trackingNumber && (
                          <div
                            style={{
                              marginTop: "1rem",
                              padding: "0.75rem 1rem",
                              background: "rgba(201, 166, 106, 0.08)",
                              borderRadius: "6px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.85rem",
                            }}
                          >
                            <span>
                              Transporte asegurado: <strong>{order.carrier || "DHL Express"}</strong> • Seguimiento:{" "}
                              <code>{order.trackingNumber}</code>
                            </span>
                            <a
                              href={`https://www.dhl.com/es-es/home/tracking.html?tracking-id=${order.trackingNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--gold-deep, #c9a66a)", textDecoration: "none" }}
                            >
                              <span>Rastrear</span>
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Expanded Order Detail Drawer */}
                      {isExpanded && (
                        <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.01)" }}>
                          <h4 style={{ fontSize: "0.95rem", fontWeight: 500, margin: "0 0 1rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-muted, #aaa)" }}>
                            Piezas incluidas en el encargo
                          </h4>

                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                            {order.items?.map((item: any) => (
                              <div
                                key={item.id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "0.75rem 1rem",
                                  background: "rgba(255,255,255,0.02)",
                                  borderRadius: "6px",
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>
                                    {item.productName || "Guardatiempo AMAL"}
                                  </div>
                                  <div style={{ fontSize: "0.8rem", color: "var(--color-muted, #888)", marginTop: "0.2rem" }}>
                                    Cantidad: {item.quantity} × {money(item.unitPrice)}
                                  </div>
                                </div>
                                <div style={{ fontWeight: 600 }}>
                                  {money(item.unitPrice * item.quantity)}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem", borderTop: "1px solid var(--color-border, rgba(255,255,255,0.06))", paddingTop: "1.25rem" }}>
                            <div>
                              <h5 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--color-muted, #888)", margin: "0 0 0.5rem" }}>
                                Dirección de entrega
                              </h5>
                              <p style={{ fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
                                {order.customerName}<br />
                                {order.address}<br />
                                {order.postalCode} {order.city}, {order.country || "España"}<br />
                                {order.phone && <span>Tel: {order.phone}</span>}
                              </p>
                            </div>

                            <div>
                              <h5 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--color-muted, #888)", margin: "0 0 0.5rem" }}>
                                Desglose económico
                              </h5>
                              <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--color-muted, #888)" }}>Subtotal</span>
                                  <span>{money(order.subtotal || order.total * 0.826)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--color-muted, #888)" }}>Envío asegurado</span>
                                  <span>{order.shipping > 0 ? money(order.shipping) : "Gratuito"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--color-muted, #888)" }}>IVA estimado (21%)</span>
                                  <span>{money(order.tax || order.total * 0.174)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.3rem", marginTop: "0.2rem" }}>
                                  <span>Total pagado</span>
                                  <span style={{ color: "var(--gold-deep, #c9a66a)" }}>{money(order.total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--color-surface, rgba(255,255,255,0.02))", borderRadius: "12px", border: "1px solid var(--color-border, rgba(255,255,255,0.08))" }}>
                <Package size={36} color="var(--color-muted, #666)" style={{ margin: "0 auto 1rem" }} />
                <h3>Aún no tienes pedidos registrados</h3>
                <p style={{ color: "var(--color-muted, #888)", margin: "0.5rem auto 1.5rem", maxWidth: "380px" }}>
                  Cuando adquieras tu primera pieza AMAL, podrás hacer el seguimiento completo de su preparación y envío desde aquí.
                </p>
                <Link href="/" className="button button-primary">
                  Ver colección
                </Link>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: SAVED ADDRESSES */}
        {activeTab === "addresses" && (
          <section className="account-addresses">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPin size={20} color="var(--gold-deep, #c9a66a)" />
                <h2 style={{ fontSize: "1.5rem", fontWeight: 400, margin: 0 }}>Libreta de direcciones</h2>
              </div>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Plus size={15} />
                <span>{isAddingAddress ? "Cancelar" : "Añadir dirección"}</span>
              </button>
            </div>

            {/* Add Address Form */}
            {isAddingAddress && (
              <form
                onSubmit={handleAddAddress}
                style={{
                  padding: "1.5rem",
                  background: "var(--color-surface, rgba(255,255,255,0.03))",
                  border: "1px solid var(--color-border, rgba(255,255,255,0.1))",
                  borderRadius: "8px",
                  marginBottom: "2rem",
                }}
              >
                <h3 style={{ fontSize: "1.1rem", fontWeight: 500, margin: "0 0 1rem" }}>
                  Nueva dirección de entrega
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--color-muted, #aaa)", marginBottom: "0.3rem" }}>
                      Etiqueta (ej. Casa, Atelier, Oficina)
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={newAddressForm.title}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, title: e.target.value })}
                      placeholder="Domicilio habitual"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--color-muted, #aaa)", marginBottom: "0.3rem" }}>
                      Nombre completo destinatario
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={newAddressForm.name}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, name: e.target.value })}
                      placeholder="Nombre y apellidos"
                      required
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--color-muted, #aaa)", marginBottom: "0.3rem" }}>
                      Dirección y número (con piso/puerta si aplica)
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={newAddressForm.address}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                      placeholder="Paseo de Gràcia 45, 3º 2ª"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--color-muted, #aaa)", marginBottom: "0.3rem" }}>
                      Ciudad
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={newAddressForm.city}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                      placeholder="Barcelona"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--color-muted, #aaa)", marginBottom: "0.3rem" }}>
                      Código Postal
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={newAddressForm.postalCode}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, postalCode: e.target.value })}
                      placeholder="08007"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--color-muted, #aaa)", marginBottom: "0.3rem" }}>
                      Teléfono de contacto
                    </label>
                    <input
                      type="tel"
                      className="input"
                      value={newAddressForm.phone}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>

                <div style={{ marginTop: "1.25rem", display: "flex", gap: "1rem" }}>
                  <button type="submit" className="button button-primary">
                    Guardar dirección
                  </button>
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => setIsAddingAddress(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Addresses List */}
            {addresses.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      padding: "1.5rem",
                      background: "var(--color-surface, rgba(255,255,255,0.02))",
                      border: addr.isDefault
                        ? "1px solid var(--gold-deep, #c9a66a)"
                        : "1px solid var(--color-border, rgba(255,255,255,0.08))",
                      borderRadius: "8px",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <strong style={{ fontSize: "1.05rem" }}>{addr.title}</strong>
                        {addr.isDefault && (
                          <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(201, 166, 106, 0.15)", color: "var(--gold-deep, #c9a66a)" }}>
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.9rem", color: "var(--color-muted, #ccc)", lineHeight: 1.5, margin: "0.5rem 0 1rem" }}>
                        {addr.name}<br />
                        {addr.address}<br />
                        {addr.postalCode} {addr.city}, {addr.country || "España"}<br />
                        {addr.phone && <span style={{ color: "var(--color-muted, #888)" }}>Tel: {addr.phone}</span>}
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem" }}>
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          style={{ background: "none", border: "none", color: "var(--gold-deep, #c9a66a)", fontSize: "0.85rem", cursor: "pointer", padding: 0 }}
                        >
                          Hacer predeterminada
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--color-muted, #888)" }}>Dirección principal</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        style={{ background: "none", border: "none", color: "var(--oxblood, #ff6b6b)", cursor: "pointer", padding: "0.2rem" }}
                        title="Eliminar dirección"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                <MapPin size={32} color="var(--color-muted, #666)" style={{ margin: "0 auto 0.75rem" }} />
                <h4>No tienes direcciones guardadas</h4>
                <p style={{ color: "var(--color-muted, #888)", fontSize: "0.9rem", margin: "0.5rem auto 1rem", maxWidth: "340px" }}>
                  Guarda tus destinos frecuentes para completar tus futuros pedidos con un solo toque.
                </p>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setIsAddingAddress(true)}
                >
                  Añadir primera dirección
                </button>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: PROFILE & SECURITY */}
        {activeTab === "security" && (
          <section className="account-security">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
              {/* Profile Details Form */}
              <div
                style={{
                  padding: "1.75rem",
                  background: "var(--color-surface, rgba(255,255,255,0.02))",
                  border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <User size={18} color="var(--gold-deep, #c9a66a)" />
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 400, margin: 0 }}>Datos de contacto</h3>
                </div>

                <form onSubmit={handleUpdateProfile}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--color-muted, #888)", marginBottom: "0.3rem" }}>
                      Nombre de cliente
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Su nombre"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--color-muted, #888)", marginBottom: "0.3rem" }}>
                      Correo electrónico (identificador de cuenta)
                    </label>
                    <input
                      type="email"
                      className="input"
                      value={user.email}
                      disabled
                      style={{ opacity: 0.6, cursor: "not-allowed" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--color-muted, #666)", display: "block", marginTop: "0.25rem" }}>
                      El correo se gestiona bajo los estándares de seguridad de Supabase Auth.
                    </span>
                  </div>

                  {profileMessage && (
                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "6px",
                        marginBottom: "1rem",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: profileMessage.type === "success" ? "rgba(40, 167, 69, 0.15)" : "rgba(220, 53, 69, 0.15)",
                        color: profileMessage.type === "success" ? "#51cf66" : "#ff6b6b",
                      }}
                    >
                      {profileMessage.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                      <span>{profileMessage.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? "Actualizando..." : "Guardar cambios"}
                  </button>
                </form>
              </div>

              {/* Password Change Form */}
              <div
                style={{
                  padding: "1.75rem",
                  background: "var(--color-surface, rgba(255,255,255,0.02))",
                  border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <Lock size={18} color="var(--gold-deep, #c9a66a)" />
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 400, margin: 0 }}>Modificar contraseña</h3>
                </div>

                <form onSubmit={handleChangePassword}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--color-muted, #888)", marginBottom: "0.3rem" }}>
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      className="input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--color-muted, #888)", marginBottom: "0.3rem" }}>
                      Nueva contraseña (mínimo 10 caracteres)
                    </label>
                    <input
                      type="password"
                      className="input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--color-muted, #888)", marginBottom: "0.3rem" }}>
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      className="input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  {passwordMessage && (
                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "6px",
                        marginBottom: "1rem",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: passwordMessage.type === "success" ? "rgba(40, 167, 69, 0.15)" : "rgba(220, 53, 69, 0.15)",
                        color: passwordMessage.type === "success" ? "#51cf66" : "#ff6b6b",
                      }}
                    >
                      {passwordMessage.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                      <span>{passwordMessage.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="button button-ghost"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "Modificando..." : "Actualizar contraseña"}
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: PRIVACY & GDPR */}
        {activeTab === "privacy" && (
          <section
            className="account-gdpr"
            style={{
              padding: "2rem",
              background: "var(--color-surface, rgba(255,255,255,0.02))",
              border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Shield size={20} color="var(--gold-deep, #c9a66a)" />
              <h2 style={{ fontSize: "1.35rem", fontWeight: 400, margin: 0 }}>
                Privacidad y Control de Datos Personales (RGPD UE)
              </h2>
            </div>
            <p style={{ color: "var(--color-muted, #888)", fontSize: "0.9rem", maxWidth: "680px", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Conforme al Reglamento General de Protección de Datos (RGPD) y la LOPDGDD, usted mantiene el control absoluto sobre su información. Puede descargar una copia íntegra de sus datos en formato legible por máquina o solicitar la supresión definitiva de su cuenta de cliente.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <button
                type="button"
                className="button button-ghost"
                onClick={handleExportData}
                disabled={isExporting}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                data-testid="button-export-data"
              >
                <span>{isExporting ? "Generando archivo..." : "Descargar mis datos (JSON)"}</span>
              </button>

              <button
                type="button"
                className="button button-ghost"
                onClick={handleDeleteAccount}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--oxblood, #ff6b6b)",
                  borderColor: "rgba(255, 107, 107, 0.3)",
                }}
                data-testid="button-delete-account"
              >
                <span>Eliminar cuenta y datos personales</span>
              </button>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
