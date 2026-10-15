import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/features/auth/use-auth";
import { AdminLayout, type AdminTab } from "./components/admin-layout";
import { AdminOverview } from "./components/admin-overview";
import { AdminOrders } from "./components/admin-orders";
import { AdminCatalog } from "./components/admin-catalog";
import { AdminCustomers } from "./components/admin-customers";
import { AdminSettings } from "./components/admin-settings";

export default function ProtectedAdmin() {
  const { user, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>("Resumen");

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      setLocation("/admin/login");
    }
  }, [isLoading, user, isAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="admin-loading" style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "Resumen" && (
        <AdminOverview onNavigateTab={(tab) => setActiveTab(tab)} />
      )}
      {activeTab === "Pedidos" && <AdminOrders />}
      {activeTab === "Catálogo" && <AdminCatalog />}
      {activeTab === "Clientes" && <AdminCustomers />}
      {activeTab === "Ajustes" && <AdminSettings />}
    </AdminLayout>
  );
}
