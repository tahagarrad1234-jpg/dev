import { ReactNode } from "react";
import { Link } from "wouter";
import {
  LayoutDashboard,
  Package,
  Watch,
  Users,
  Settings,
  LogOut,
  Store,
} from "lucide-react";
import { useAuth } from "@/features/auth/use-auth";

export type AdminTab =
  | "Resumen"
  | "Pedidos"
  | "Catálogo"
  | "Clientes"
  | "Ajustes";

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: ReactNode;
}

const NAV_ITEMS: { tab: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { tab: "Resumen", label: "Vista general", icon: LayoutDashboard },
  { tab: "Pedidos", label: "Pedidos", icon: Package },
  { tab: "Catálogo", label: "Catálogo", icon: Watch },
  { tab: "Clientes", label: "Clientes", icon: Users },
  { tab: "Ajustes", label: "Ajustes", icon: Settings },
];

export function AdminLayout({
  activeTab,
  onTabChange,
  children,
}: AdminLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/">
          <span>A</span>
          <div>
            <strong>AMAL ATELIER</strong>
            <small>Panel de Control</small>
          </div>
        </Link>

        <nav className="admin-nav">
          {NAV_ITEMS.map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "is-active" : ""}
              onClick={() => onTabChange(tab)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-return-link">
            <Store size={15} />
            <span>Volver a la tienda</span>
          </Link>

          <div className="admin-user-profile">
            <div className="admin-user-info">
              <strong>{user?.name || "Administrador"}</strong>
              <small>{user?.email}</small>
            </div>
            <button
              type="button"
              onClick={logout}
              className="admin-logout-button"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
