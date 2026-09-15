import { useState } from "react";
import { Search, ShoppingBag, Heart, User, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/use-auth";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  favoritesCount: number;
  search: string;
  onSearchChange: (value: string) => void;
}

export function Header({
  cartCount,
  onOpenCart,
  favoritesCount,
  search,
  onSearchChange,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="site-header" id="top">
      <button
        className="mobile-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Menu principal"
      >
        <span />
        <span />
      </button>

      <a href="/" className="wordmark">
        <span>A</span> AMAL
      </a>

      <nav className={`main-nav ${mobileMenuOpen ? "is-open" : ""}`}>
        <a href="#collection" onClick={() => setMobileMenuOpen(false)}>
          Coleccion
        </a>
        <a href="#atelier" onClick={() => setMobileMenuOpen(false)}>
          El Atelier
        </a>
        <a href="#manifesto" onClick={() => setMobileMenuOpen(false)}>
          Manifiesto
        </a>
        <a href="#notes" onClick={() => setMobileMenuOpen(false)}>
          Diario
        </a>
        <a href="/admin" onClick={() => setMobileMenuOpen(false)}>
          Admin
        </a>
      </nav>

      <div className="header-tools">
        <div className="header-search">
          <Search size={14} />
          <input
            type="search"
            placeholder="Buscar modelo, estilo..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {favoritesCount > 0 && (
          <span className="tool-button" title={`${favoritesCount} favoris`}>
            <Heart size={16} fill="var(--oxblood)" color="var(--oxblood)" />
          </span>
        )}

        {user ? (
          <div className="account-links" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
              {user.email.split("@")[0]}
            </span>
            <button
              className="tool-button"
              onClick={logout}
              title="Cerrar sesion"
              style={{ color: "var(--oxblood)" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <a href="/login" className="tool-button" title="Iniciar sesion">
            <User size={16} />
          </a>
        )}

        <button
          className="tool-button bag-button"
          onClick={onOpenCart}
          aria-label="Abrir bolsa de compra"
        >
          <ShoppingBag size={17} />
          {cartCount > 0 && <span className="bag-count">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}
