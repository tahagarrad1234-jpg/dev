import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import {
  ArrowUpRight,
  Search,
  ShoppingBag,
  X,
  Plus,
  Minus,
  Heart,
  SlidersHorizontal,
  ChevronDown,
  Watch,
  Sparkles,
  User,
  Shield,
  LogOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  type Category,
  type Product,
  money,
  SEED_PRODUCTS,
} from "@workspace/shared";
import { useCart } from "@/features/cart/use-cart";
import { useFavorites } from "@/features/favorites/use-favorites";
import { useAuth } from "@/features/auth/use-auth";
import { useProducts } from "@/features/catalog/use-products";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

// Scroll-reveal hook for authentic luxury animations
function useReveal() {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref as React.RefObject<HTMLElement>;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user, logout, isAdmin } = useAuth();
  const {
    cart,
    cartCount,
    subtotal,
    cartOpen,
    setCartOpen,
    addToCart,
    changeQuantity,
  } = useCart();
  const { isFavorite, toggleFavorite, favoritesCount } = useFavorites();

  const [category, setCategory] = useState<Category>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("category");
      if (p && ["All pieces", "Dress", "Field", "Diver", "Chronograph"].includes(p)) {
        return p as Category;
      }
    }
    return "All pieces";
  });
  const [search, setSearch] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("q") || "";
    }
    return "";
  });
  const [sort, setSort] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("sort") || "Curated order";
    }
    return "Curated order";
  });
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Load products from API with instant fallback to curated SEED_PRODUCTS
  const { data: apiData } = useProducts({ pageSize: 20 });
  const products: Product[] =
    apiData?.items && apiData.items.length > 0
      ? apiData.items
      : SEED_PRODUCTS;

  // URL query sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (category && category !== "All pieces") params.set("category", category);
    if (search.trim()) params.set("q", search.trim());
    if (sort && sort !== "Curated order") params.set("sort", sort);

    const queryStr = params.toString();
    const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
    if (window.location.search !== (queryStr ? `?${queryStr}` : "")) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [category, search, sort]);

  // Sticky header scroll watcher
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-reveal refs
  const manifestoRef = useReveal();
  const collectionRef = useReveal();
  const craftRef = useReveal();
  const closingRef = useReveal();

  const normalizeText = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Filtered and sorted products with accent-insensitive tolerance
  const filtered = useMemo(() => {
    const term = normalizeText(search.trim());
    const visible = products.filter(
      (product) =>
        (category === "All pieces" || product.category === category) &&
        (!term ||
          normalizeText(
            `${product.name} ${product.category} ${product.collection} ${product.description}`,
          ).includes(term)),
    );
    return [...visible].sort((a, b) => {
      if (sort === "Price: low to high") return a.price - b.price;
      if (sort === "Price: high to low") return b.price - a.price;
      return a.id - b.id;
    });
  }, [products, category, search, sort]);

  const announce = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const handleSubscribeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      announce("Por favor, introduce un correo electrónico válido.");
      return;
    }
    setIsSubscribing(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      if (res.ok) {
        announce("¡Gracias por unirte! Te hemos enviado un enlace de confirmación.");
        setNewsletterEmail("");
      } else {
        announce("¡Ya estás en nuestra lista confidencial de notas!");
      }
    } catch {
      announce("¡Ya estás en nuestra lista confidencial de notas!");
    } finally {
      setIsSubscribing(false);
    }
  };

  const tickerItems = [
    "Envío asegurado en cada pieza AMAL",
    "EST. 1987  ·  BARCELONA — GINEBRA",
    "Garantía oficial de cinco años",
    "Materiales trazables y nobles",
    "Movimientos mecánicos reparables",
    "Atelier en Barcelona · Envíos UE y Suiza",
  ];

  const heroWatch = products[0] || SEED_PRODUCTS[0];
  const craftWatch = products[2] || SEED_PRODUCTS[2];

  return (
    <div className="atelier-app">
      <Helmet>
        <title>AMAL Watches — Relojería Contemporánea de Alta Precisión</title>
        <meta
          name="description"
          content="Guardatiempos mecánicos en ediciones limitadas. Fabricación artesanal, calibres automáticos y garantía de 5 años. Atelier en Barcelona."
        />
        <link rel="canonical" href="https://amalwatches.com/" />
      </Helmet>

      {/* ── Accessible Skip Navigation ── */}
      <a href="#collection" className="skip-link">
        {t("common.skipToContent", "Saltar a la colección")}
      </a>

      {/* ── Announcement Ticker ── */}
      <div className="announcement" aria-label="Información de la tienda">
        <div className="announcement-ticker" aria-hidden="true">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── Original Luxury Header ── */}
      <header className={`site-header ${scrolled ? "scrolled" : ""}`} id="top">
        <button
          className="mobile-toggle"
          aria-label="Abrir navegación"
          data-testid="button-open-navigation"
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          <span />
          <span />
        </button>

        <a href="#top" className="wordmark" data-testid="link-home">
          <span className="wordmark-badge">A</span>
          AMAL
        </a>

        <nav
          className={`main-nav ${mobileMenu ? "is-open" : ""}`}
          aria-label="Navegación principal"
        >
          <a
            href="#collection"
            data-testid="link-collection"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenu(false);
              document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            La colección
          </a>
          <a
            href="#atelier"
            data-testid="link-atelier"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenu(false);
              document.getElementById("atelier")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Nuestro atelier
          </a>
          <a
            href="#journal"
            data-testid="link-journal"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenu(false);
              document.getElementById("journal")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Diario
          </a>
          {isAdmin && (
            <Link
              href="/admin"
              data-testid="link-admin"
              onClick={() => setMobileMenu(false)}
              style={{ color: "var(--gold-deep, #c9a66a)" }}
            >
              Administración
            </Link>
          )}
        </nav>

        <div className="header-tools">
          <LanguageSwitcher />

          {/* Wishlist Heart with Counter Badge */}
          <Link
            href="/favorites"
            className="tool-button"
            style={{ position: "relative" }}
            title={favoritesCount > 0 ? `${favoritesCount} en favoritos` : "Favoritos"}
            aria-label="Ver piezas favoritas"
            data-testid="button-header-favorites"
          >
            <Heart
              size={17}
              fill={favoritesCount > 0 ? "var(--oxblood, #8b263e)" : "none"}
              color={favoritesCount > 0 ? "var(--oxblood, #8b263e)" : "currentColor"}
            />
            {favoritesCount > 0 && (
              <span className="bag-count" data-testid="text-favorites-count">
                {favoritesCount}
              </span>
            )}
          </Link>

          {/* User Account / Login */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Link
                href="/account"
                className="account-link"
                data-testid="link-header-account"
                title="Espacio personal"
              >
                {user.name ? user.name.split(" ")[0] : "Mi Cuenta"}
              </Link>
              <button
                type="button"
                className="tool-button"
                onClick={logout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                data-testid="button-header-logout"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--oxblood, #ff6b6b)" }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="account-link"
              data-testid="link-header-login"
            >
              Cuenta
            </Link>
          )}

          {/* Live Search Input */}
          <label className="header-search">
            <Search size={15} strokeWidth={1.8} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar un reloj"
              aria-label="Buscar relojes"
              data-testid="input-search"
            />
          </label>

          {/* Cart Bag Button */}
          <button
            className="tool-button bag-button"
            aria-label="Abrir bolsa de compra"
            data-testid="button-open-cart"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={19} strokeWidth={1.7} />
            {cartCount > 0 && (
              <span className="bag-count" data-testid="text-cart-count">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main id="top">
        {/* ── Original Iconic Hero ── */}
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" /> Una colección seleccionada
            </div>
            <h1>
              Mide el tiempo
              <br />
              <em>beautifully.</em>
            </h1>
            <p>
              Objetos de precisión serena, elegidos por las historias que
              reúnen. Descubre relojes mecánicos con personalidad propia.
            </p>
            <a
              href="#collection"
              className="hero-link"
              data-testid="link-explore-collection"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explorar la colección <ArrowUpRight size={15} />
            </a>
          </div>

          <div className="hero-object" aria-label="The Meridian watch">
            <div className="hero-halo" />
            <Link href={`/product/${heroWatch.slug}`} style={{ cursor: "pointer" }}>
              <img
                src={heroWatch.image}
                alt={`${heroWatch.name} reloj automático`}
              />
            </Link>
            <div className="hero-caption">
              <span>01</span>
              <span>{heroWatch.name.toUpperCase()} / 38MM</span>
            </div>
          </div>

          <div className="hero-side-note">
            <span>Desliza para explorar</span>
            <span className="vertical-rule" />
          </div>
        </section>

        {/* ── Original Manifesto ── */}
        <section
          className="manifesto reveal"
          id="atelier"
          ref={manifestoRef}
        >
          <div className="manifesto-index">00 / POR QUÉ AMAL</div>
          <div className="manifesto-copy">
            <h2>
              Para los días
              <br />
              <em>que merecen ser vividos.</em>
            </h2>
            <p>
              Buscamos detalles que no piden atención: el giro de una corona, el
              peso frío del acero, una esfera que se vuelve tuya con el tiempo.
              Cada pieza se elige con paciencia y rigor artesanal.
            </p>
            <a
              href="#journal"
              data-testid="link-read-story"
              className="hero-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("journal")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Leer nuestra historia <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="manifesto-stamp">
            <Watch size={26} strokeWidth={1.1} />
            <span>
              AMAL
              <br />
              OBJETOS
              <br />
              CON PULSO
            </span>
          </div>
        </section>

        {/* ── Original Collection Section ── */}
        <section
          className="collection-section reveal"
          id="collection"
          ref={collectionRef}
        >
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> La colección
              </div>
              <h2>Elegida, no saturada.</h2>
            </div>
            <p className="section-intro">
              Seis referencias. Cada una con su propio ritmo.
              <br />
              Tómatelo con calma.
            </p>
          </div>

          <div className="collection-toolbar">
            <div
              className="category-tabs"
              role="tablist"
              aria-label="Categorías de relojes"
            >
              {(
                [
                  "All pieces",
                  "Dress",
                  "Field",
                  "Diver",
                  "Chronograph",
                ] as Category[]
              ).map((item) => (
                <button
                  key={item}
                  role="tab"
                  aria-selected={category === item}
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                  data-testid={`button-category-${item.toLowerCase().replace(" ", "-")}`}
                >
                  {
                    {
                      "All pieces": "Todas las piezas",
                      Dress: "Elegante",
                      Field: "Campo",
                      Diver: "Buceo",
                      Chronograph: "Cronógrafo",
                    }[item]
                  }
                </button>
              ))}
            </div>

            <label className="sort-select">
              <SlidersHorizontal size={14} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Ordenar colección"
                data-testid="select-sort"
              >
                <option value="Curated order">Orden seleccionado</option>
                <option value="Price: low to high">Precio: menor a mayor</option>
                <option value="Price: high to low">Precio: mayor a menor</option>
              </select>
              <ChevronDown size={13} />
            </label>
          </div>

          {filtered.length > 0 ? (
            <div className="product-grid reveal-group">
              {filtered.map((product, index) => {
                const favorited = isFavorite(product.id);
                return (
                  <article
                    className={`product-card product-${index + 1} reveal visible`}
                    key={product.id}
                    data-testid={`card-product-${product.id}`}
                  >
                    <div className={`product-image ${product.tone}`}>
                      <Link
                        href={`/product/${product.slug}`}
                        data-testid={`link-product-${product.slug}`}
                        style={{ display: "block", width: "100%", height: "100%" }}
                      >
                        <img
                          src={product.image}
                          alt={`${product.name}, ${product.category} watch`}
                          loading="lazy"
                        />
                      </Link>

                      {index === 0 && (
                        <span className="product-badge">Más vendido</span>
                      )}

                      <button
                        className={`favorite-button ${favorited ? "is-favorite" : ""}`}
                        aria-label={
                          favorited
                            ? `Eliminar ${product.name} de favoritos`
                            : `Añadir ${product.name} a favoritos`
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(product.id);
                          announce(
                            favorited
                              ? `Eliminado "${product.name}" de tus favoritos`
                              : `Añadido "${product.name}" a tus favoritos`,
                          );
                        }}
                        data-testid={`button-favorite-${product.id}`}
                      >
                        <Heart
                          size={16}
                          fill={favorited ? "var(--oxblood, #8b263e)" : "none"}
                          color={favorited ? "var(--oxblood, #8b263e)" : "currentColor"}
                        />
                      </button>

                      <button
                        className="quick-add"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product);
                          announce(`${product.name} añadido a tu bolsa`);
                        }}
                        data-testid={`button-add-product-${product.id}`}
                      >
                        Añadir a la bolsa <Plus size={14} />
                      </button>
                    </div>

                    <div className="product-meta">
                      <div>
                        <p className="product-collection">{product.collection}</p>
                        <Link
                          href={`/product/${product.slug}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <h3>{product.name}</h3>
                        </Link>
                      </div>
                      <strong>{money(product.price)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Sparkles size={22} />
              <h3>No encontramos piezas para "{search || category}".</h3>
              <p>Prueba con otra búsqueda o explora estas sugerencias del atelier:</p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", margin: "16px 0", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => { setSearch(""); setCategory("Dress"); }}
                  style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid #dcd8cf", background: "#fff", cursor: "pointer", fontSize: "12px", color: "var(--ink, #121212)" }}
                >
                  Piezas Elegantes
                </button>
                <button
                  type="button"
                  onClick={() => { setSearch(""); setCategory("Chronograph"); }}
                  style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid #dcd8cf", background: "#fff", cursor: "pointer", fontSize: "12px", color: "var(--ink, #121212)" }}
                >
                  Cronógrafos de Precisión
                </button>
                <button
                  type="button"
                  onClick={() => { setSearch(""); setCategory("Diver"); }}
                  style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid #dcd8cf", background: "#fff", cursor: "pointer", fontSize: "12px", color: "var(--ink, #121212)" }}
                >
                  Relojes de Buceo
                </button>
              </div>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All pieces");
                }}
                data-testid="button-clear-filters"
              >
                Restablecer toda la colección
              </button>
            </div>
          )}
        </section>

        {/* ── Original Craft / Standards Section ── */}
        <section
          className="craft-section reveal"
          id="journal"
          ref={craftRef}
        >
          <div className="craft-image">
            <img
              src={craftWatch.image}
              alt="Reloj AMAL en superficie texturizada"
              loading="lazy"
            />
            <span className="image-label">THE AMAL STANDARD / 02</span>
          </div>

          <div className="craft-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" /> El estándar AMAL
            </div>
            <h2>
              Hecho para
              <br />
              <em>vivirlo.</em>
            </h2>
            <p>
              Fabricantes en pequeños lotes. Materiales honestos. Movimientos
              que puedes sentir. Un reloj debe ganar historia, no desgastarse.
            </p>
            <div className="standard-list">
              <div>
                <span>01</span>
                <b>Movimientos reparables</b>
                <small>Hechos para durar toda una vida</small>
              </div>
              <div>
                <span>02</span>
                <b>Materiales trazables</b>
                <small>Nada se oculta tras el brillo</small>
              </div>
              <div>
                <span>03</span>
                <b>Garantía de cinco años</b>
                <small>Respondemos por cada pieza elegida</small>
              </div>
            </div>
          </div>
        </section>

        {/* ── Original Closing / Newsletter Section ── */}
        <section className="closing-note reveal" ref={closingRef}>
          <div className="closing-quote">
            "The pleasure is
            <br />
            <em>en la elección."</em>
          </div>

          <div className="closing-details">
            <span>AMAL NOTES / 01</span>
            <p>
              Una breve nota sobre relojes, artesanos y los rituales del tiempo.
              Sin ruido, una vez al mes.
            </p>

            <form
              onSubmit={handleSubscribeNewsletter}
              style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}
            >
              <input
                type="email"
                placeholder="Tu correo electrónico"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  padding: "0.6rem 0.9rem",
                  color: "#fff",
                  fontSize: "0.9rem",
                  minWidth: "240px",
                }}
                data-testid="input-newsletter-email"
              />
              <button
                type="submit"
                className="closing-cta"
                disabled={isSubscribing}
                data-testid="button-join-notes"
              >
                {isSubscribing ? "Suscribiendo..." : "Suscribirme"}{" "}
                <ArrowUpRight size={15} />
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* ── Original Luxury Footer ── */}
      <footer>
        <a href="#top" className="wordmark" data-testid="link-footer-home">
          <span className="wordmark-badge">A</span>
          AMAL
        </a>
        <p>Objetos para medir el tiempo con serenidad.</p>

        <div className="footer-links">
          <a
            href="#collection"
            data-testid="link-footer-collection"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Colección
          </a>
          <a
            href="#atelier"
            data-testid="link-footer-atelier"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("atelier")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Atelier
          </a>
          <Link href="/legal/terms" data-testid="link-footer-terms">
            Condiciones
          </Link>
          <Link href="/legal/privacy" data-testid="link-footer-privacy">
            Privacidad
          </Link>
          <Link href="/legal/cookies" data-testid="link-footer-cookies">
            Cookies
          </Link>
          <button
            onClick={() => announce("Atención al atelier: info@amalwatches.com")}
            data-testid="button-contact"
          >
            Contacto
          </button>
        </div>

        <small>© 2026 AMAL Watches S.L. Barcelona Atelier. Todos los derechos reservados.</small>
      </footer>

      {/* ── Global Cart Drawer ── */}
      {cartOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setCartOpen(false)}
          data-testid="cart-drawer-backdrop"
        >
          <aside
            className="cart-drawer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Bolsa de compra"
          >
            <div className="drawer-header">
              <div>
                <span className="drawer-kicker">TU SELECCIÓN</span>
                <h2>
                  Bolsa de compra {cartCount > 0 && <small>{cartCount}</small>}
                </h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Cerrar bolsa de compra"
                data-testid="button-close-cart"
              >
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>

            {cart.length > 0 ? (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div
                      className="cart-item"
                      key={item.id}
                      data-testid={`cart-item-${item.id}`}
                    >
                      <img src={item.image} alt={item.name} />
                      <div className="cart-item-info">
                        <span>{item.collection}</span>
                        <h3>{item.name}</h3>
                        <strong>{money(item.price * item.quantity)}</strong>
                        <div className="quantity">
                          <button
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-label={`Reducir cantidad de ${item.name}`}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus size={12} />
                          </button>
                          <span data-testid={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-label={`Aumentar cantidad de ${item.name}`}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="drawer-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong data-testid="text-cart-subtotal">
                      {money(subtotal)}
                    </strong>
                  </div>
                  <p>Envío asegurado e IVA (21%) incluidos o calculados en el pago.</p>
                  <button
                    className="checkout-button"
                    onClick={() => {
                      setCartOpen(false);
                      setLocation("/checkout");
                    }}
                    data-testid="button-checkout"
                  >
                    Continuar al pago <ArrowUpRight size={16} />
                  </button>
                  <button
                    className="continue-button"
                    onClick={() => setCartOpen(false)}
                    data-testid="button-continue-shopping"
                  >
                    Seguir explorando
                  </button>
                </div>
              </>
            ) : (
              <div className="cart-empty">
                <div className="empty-bag">
                  <ShoppingBag size={24} strokeWidth={1.3} />
                </div>
                <h3>Tu bolsa te espera.</h3>
                <p>Empieza con una pieza que te siga llamando.</p>
                <button
                  className="checkout-button"
                  onClick={() => {
                    setCartOpen(false);
                    document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  data-testid="button-discover-pieces"
                >
                  Descubrir la colección <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── Interactive Notice Toast ── */}
      {notice && (
        <div className="notice" role="status" data-testid="status-notice">
          {notice}
        </div>
      )}
    </div>
  );
}
