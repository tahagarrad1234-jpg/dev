import React, { useMemo, useState, useEffect, useRef } from "react";
import { ArrowUpRight, Search, ShoppingBag, X, Plus, Minus, Heart, SlidersHorizontal, ChevronDown, Watch, Sparkles } from "lucide-react";
import { Category, Product, CartItem, products, money } from "@/lib/data";
import Checkout from "@/features/orders/checkout";

// Scroll-reveal hook
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
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref as React.RefObject<HTMLElement>;
}

export default function Home() {
  const [category, setCategory] = useState<Category>("All pieces");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [sort, setSort] = useState("Curated order");
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sticky header scroll class
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleCheckoutClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-testid="button-checkout"]')) {
        event.stopPropagation();
        setCartOpen(false);
        setCheckoutOpen(true);
      }
    };
    document.addEventListener("click", handleCheckoutClick, true);
    return () =>
      document.removeEventListener("click", handleCheckoutClick, true);
  }, []);

  // Scroll-reveal refs
  const manifestoRef = useReveal();
  const collectionRef = useReveal();
  const craftRef = useReveal();
  const closingRef = useReveal();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visible = products.filter(
      (product) =>
        (category === "All pieces" || product.category === category) &&
        (!term ||
          `${product.name} ${product.category} ${product.collection}`
            .toLowerCase()
            .includes(term)),
    );
    return [...visible].sort((a, b) =>
      sort === "Price: low to high"
        ? a.price - b.price
        : sort === "Price: high to low"
          ? b.price - a.price
          : a.id - b.id,
    );
  }, [category, search, sort]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const announce = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const toggleFavorite = (id: number) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };
  const addToCart = (product: Product) => {
    setCart((current) =>
      current.some((item) => item.id === product.id)
        ? current.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...current, { ...product, quantity: 1 }],
    );
    setCartOpen(true);
    announce(`${product.name} añadido a tu bolsa`);
  };
  const changeQuantity = (id: number, delta: number) =>
    setCart((current) =>
      current.flatMap((item) =>
        item.id === id
          ? item.quantity + delta > 0
            ? [{ ...item, quantity: item.quantity + delta }]
            : []
          : [item],
      ),
    );

  const tickerItems = [
    "Envío asegurado en cada pieza AMAL",
    "EST. 1987  ·  GENEVA — TOKYO",
    "Garantía de cinco años",
    "Materiales trazables",
    "Movimientos reparables",
  ];

  return (
    <div className="atelier-app">
      {/* ── Announcement Ticker ── */}
      <div className="announcement" aria-label="Información de la tienda">
        <div className="announcement-ticker" aria-hidden="true">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── Header ── */}
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <button
          className="mobile-toggle"
          aria-label="Abrir navegacion"
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
            onClick={() => setMobileMenu(false)}
          >
            La colección
          </a>
          <a
            href="#atelier"
            data-testid="link-atelier"
            onClick={() => setMobileMenu(false)}
          >
            Nuestro atelier
          </a>
          <a
            href="#journal"
            data-testid="link-journal"
            onClick={() => setMobileMenu(false)}
          >
            Diario
          </a>
        </nav>
        <div className="header-tools">
          <a className="account-link" href="/login">Cuenta</a>
          <label className="header-search">
            <Search size={15} strokeWidth={1.8} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar un reloj"
              aria-label="Buscar relojes"
              data-testid="input-search"
            />
          </label>
          <button
            className="tool-button bag-button"
            aria-label="Abrir bolsa de compra"
            data-testid="button-open-cart"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={19} strokeWidth={1.7} />
            {cartCount > 0 && (
              <span className="bag-count">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      <main id="top">
        {/* ── Hero ── */}
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
              reúnen. Descubre relojes mecánicos con personalidad.
            </p>
            <a
              href="#collection"
              className="hero-link"
              data-testid="link-explore-collection"
            >
              Explorar la colección <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="hero-object" aria-label="The Meridian watch">
            <div className="hero-halo" />
            <img src={products[0].image} alt="The Meridian automatic watch" />
            <div className="hero-caption">
              <span>01</span>
              <span>THE MERIDIAN / 38MM</span>
            </div>
          </div>
          <div className="hero-side-note">
            <span>Desliza para explorar</span>
            <span className="vertical-rule" />
          </div>
        </section>

        {/* ── Manifesto ── */}
        <section
          className="manifesto reveal"
          id="atelier"
          ref={manifestoRef as React.RefObject<HTMLDivElement>}
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
              Cada pieza se elige con paciencia.
            </p>
            <a href="#journal" data-testid="link-read-story" className="hero-link">
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

        {/* ── Collection ── */}
        <section
          className="collection-section reveal"
          id="collection"
          ref={collectionRef as React.RefObject<HTMLDivElement>}
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
                onChange={(event) => setSort(event.target.value)}
                aria-label="Ordenar colección"
                data-testid="select-sort"
              >
                <option value="Curated order">Orden seleccionado</option>
                <option value="Price: low to high">
                  Precio: menor a mayor
                </option>
                <option value="Price: high to low">
                  Precio: mayor a menor
                </option>
              </select>
              <ChevronDown size={13} />
            </label>
          </div>
          {filtered.length > 0 ? (
            <div className="product-grid reveal-group">
              {filtered.map((product, index) => (
                <article
                  className={`product-card product-${index + 1} reveal`}
                  key={product.id}
                  data-testid={`card-product-${product.id}`}
                >
                  <div className={`product-image ${product.tone}`}>
                    <img
                      src={product.image}
                      alt={`${product.name}, ${product.category} watch`}
                      loading="lazy"
                    />
                    {index === 0 && (
                      <span className="product-badge">Más vendido</span>
                    )}
                    <button
                      className={`favorite-button ${favorites.includes(product.id) ? "is-favorite" : ""}`}
                      aria-label={
                        favorites.includes(product.id)
                          ? `Remove ${product.name} from favorites`
                          : `Add ${product.name} to favorites`
                      }
                      onClick={() => toggleFavorite(product.id)}
                      data-testid={`button-favorite-${product.id}`}
                    >
                      <Heart
                        size={16}
                        fill={
                          favorites.includes(product.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                    <button
                      className="quick-add"
                      onClick={() => addToCart(product)}
                      data-testid={`button-add-product-${product.id}`}
                    >
                      Añadir a la bolsa <Plus size={14} />
                    </button>
                  </div>
                  <div className="product-meta">
                    <div>
                      <p className="product-collection">{product.collection}</p>
                      <h3>{product.name}</h3>
                    </div>
                    <strong>{money(product.price)}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Sparkles size={22} />
              <h3>No encontramos resultados.</h3>
              <p>Prueba otra búsqueda o vuelve a toda la colección.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All pieces");
                }}
                data-testid="button-clear-filters"
              >
                Borrar filtros
              </button>
            </div>
          )}
        </section>

        {/* ── Craft / Standards ── */}
        <section
          className="craft-section reveal"
          id="journal"
          ref={craftRef as React.RefObject<HTMLDivElement>}
        >
          <div className="craft-image">
            <img
              src={products[2].image}
              alt="A watch resting on a textured surface"
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

        {/* ── Closing / Newsletter ── */}
        <section
          className="closing-note reveal"
          ref={closingRef as React.RefObject<HTMLDivElement>}
        >
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
            <button
              className="closing-cta"
              onClick={() => announce("¡Ya estás en la lista!")}
              data-testid="button-join-notes"
            >
              Suscribirme <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer>
        <a href="#top" className="wordmark" data-testid="link-footer-home">
          <span className="wordmark-badge">A</span>
          AMAL
        </a>
        <p>Objetos para medir el tiempo.</p>
        <div className="footer-links">
          <a href="#collection" data-testid="link-footer-collection">
            Colección
          </a>
          <a href="#atelier" data-testid="link-footer-atelier">
            Atelier
          </a>
          <button
            onClick={() =>
              announce("Atención al cliente: info@amalwatches.com")
            }
            data-testid="button-contact"
          >
            Contacto
          </button>
        </div>
        <small>© 2026 AMAL Watches. All considered.</small>
      </footer>

      {/* ── Checkout ── */}
      {checkoutOpen && (
        <Checkout
          items={cart}
          subtotal={subtotal}
          onBack={() => {
            setCheckoutOpen(false);
            setCartOpen(true);
          }}
          onComplete={() => {
            setCheckoutOpen(false);
            setCart([]);
          }}
        />
      )}

      {/* ── Notice ── */}
      {notice && (
        <div className="notice" role="status" data-testid="status-notice">
          {notice}
        </div>
      )}

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
          <aside
            className="cart-drawer"
            onClick={(event) => event.stopPropagation()}
            aria-label="Bolsa de compra"
          >
            <div className="drawer-header">
              <div>
                <span className="drawer-kicker">TU SELECCIÓN</span>
                <h2>
                  Bolsa de compra{" "}
                  {cartCount > 0 && <small>{cartCount}</small>}
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
                      <img src={item.image} alt="" />
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
                  <p>El envío y los impuestos se calculan al finalizar.</p>
                  <button
                    className="checkout-button"
                    onClick={() =>
                      announce("La compra está lista para continuar")
                    }
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
                  onClick={() => setCartOpen(false)}
                  data-testid="button-discover-pieces"
                >
                  Descubrir la colección <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
