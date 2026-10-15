import { useState } from "react";
import { Link } from "wouter";
import { Search, ShoppingBag, Heart, User, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/use-auth";
import { useFavorites } from "@/features/favorites/use-favorites";
import { LanguageSwitcher } from "./language-switcher";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  favoritesCount?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
}

export function Header({
  cartCount,
  onOpenCart,
  favoritesCount: propFavCount,
  search = "",
  onSearchChange,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { favoritesCount: hookFavCount } = useFavorites();
  const favoritesCount = propFavCount !== undefined ? propFavCount : hookFavCount;
  const { t } = useTranslation();

  return (
    <header className="site-header" id="top">
      <button
        className="mobile-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={t("nav.collection")}
        aria-expanded={mobileMenuOpen}
      >
        <span />
        <span />
      </button>

      <Link href="/" className="wordmark" data-testid="link-home">
        <span>A</span> AMAL
      </Link>

      <nav
        className={`main-nav ${mobileMenuOpen ? "is-open" : ""}`}
        aria-label="Navegación principal"
      >
        <a
          href="/#collection"
          onClick={() => setMobileMenuOpen(false)}
          data-testid="link-collection"
        >
          {t("nav.collection")}
        </a>
        <a
          href="/#atelier"
          onClick={() => setMobileMenuOpen(false)}
          data-testid="link-atelier"
        >
          {t("nav.atelier")}
        </a>
        <a href="/#manifesto" onClick={() => setMobileMenuOpen(false)}>
          {t("nav.manifesto")}
        </a>
        <a href="/#notes" onClick={() => setMobileMenuOpen(false)}>
          {t("nav.journal")}
        </a>
        {user?.role === "admin" && (
          <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
            {t("common.admin")}
          </Link>
        )}
      </nav>

      <div className="header-tools">
        {onSearchChange && (
          <div className="header-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              data-testid="input-search"
              aria-label={t("common.search")}
            />
          </div>
        )}

        <LanguageSwitcher />

        <Link
          href="/favorites"
          className="tool-button"
          style={{ position: "relative" }}
          title={favoritesCount > 0 ? `${favoritesCount} ${t("common.favorites")}` : t("common.favorites")}
          aria-label={t("common.favorites")}
        >
          <Heart
            size={16}
            fill={favoritesCount > 0 ? "var(--oxblood)" : "none"}
            color={favoritesCount > 0 ? "var(--oxblood)" : "currentColor"}
            aria-hidden="true"
          />
          {favoritesCount > 0 && <span className="bag-count">{favoritesCount}</span>}
        </Link>

        {user ? (
          <div
            className="account-links"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Link
              href="/account"
              style={{
                fontSize: "12px",
                color: "var(--ink-soft)",
                textDecoration: "none",
                fontWeight: 500,
              }}
              title={t("common.account")}
              data-testid="link-account"
            >
              {user.name || user.email.split("@")[0]}
            </Link>
            <button
              className="tool-button"
              onClick={logout}
              title={t("common.logout")}
              aria-label={t("common.logout")}
              style={{ color: "var(--oxblood)", background: "none", border: "none", cursor: "pointer" }}
              data-testid="button-logout"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="tool-button"
            title={t("common.login")}
            aria-label={t("common.login")}
            data-testid="link-login"
          >
            <User size={16} aria-hidden="true" />
          </Link>
        )}

        <button
          className="tool-button bag-button"
          onClick={onOpenCart}
          aria-label={t("cart.title")}
          data-testid="button-open-cart"
        >
          <ShoppingBag size={17} aria-hidden="true" />
          {cartCount > 0 && <span className="bag-count">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}
