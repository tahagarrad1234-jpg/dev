import { useMemo, useState, useEffect } from "react";
import { ArrowUpRight, Search, ShoppingBag, X, Plus, Minus, Heart, SlidersHorizontal, ChevronDown, Watch, Sparkles } from "lucide-react";
import { Category, Product, CartItem, products, money } from "@/lib/data";
import Checkout from "@/features/orders/checkout";

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
    window.setTimeout(() => setNotice(""), 2400);
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
    announce(`${product.name} se ha añadido a tu bolsa`);
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

  return (
    <div className="atelier-app">
      <div className="announcement">
        <span>Envio asegurado gratuito en cada pieza AMAL</span>
        <span className="announcement-mark">
          EST. 1987&nbsp;&nbsp; / &nbsp;&nbsp;GENEVA — TOKYO
        </span>
      </div>
      <header className="site-header">
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
          <span>A</span> AMAL
        </a>
        <nav
          className={`main-nav ${mobileMenu ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <a
            href="#collection"
            data-testid="link-collection"
            onClick={() => setMobileMenu(false)}
          >
            La coleccion
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
            <Search size={16} strokeWidth={1.7} />
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
            <ShoppingBag size={18} strokeWidth={1.6} />
            <span className="bag-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" /> Una coleccion seleccionada
            </div>
            <h1>
              Mide el tiempo
              <br />
              <em>beautifully.</em>
            </h1>
            <p>
              Objetos de precision serena, elegidos por las historias que
              reunen. Descubre relojes mecanicos con personalidad.
            </p>
            <a
              href="#collection"
              className="hero-link"
              data-testid="link-explore-collection"
            >
              Explorar la coleccion <ArrowUpRight size={16} />
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

        <section className="manifesto" id="atelier">
          <div className="manifesto-index">00 / POR QUE AMAL</div>
          <div className="manifesto-copy">
            <h2>
              Para los dias
              <br />
              <em>que merecen ser vividos.</em>
            </h2>
            <p>
              Buscamos detalles que no piden atencion: el giro de una corona, el
              peso frio del acero, una esfera que se vuelve tuya con el tiempo.
              Cada pieza se elige con paciencia.
            </p>
            <a href="#journal" data-testid="link-read-story">
              Leer nuestra historia <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="manifesto-stamp">
            <Watch size={28} strokeWidth={1} />
            <span>
              AMAL
              <br />
              OBJETOS
              <br />
              CON PULSO
            </span>
          </div>
        </section>

        <section className="collection-section" id="collection">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> La coleccion
              </div>
              <h2>Elegida, no saturada.</h2>
            </div>
            <p className="section-intro">
              Seis referencias. Cada una con su propio ritmo.
              <br />
              Tomatelo con calma.
            </p>
          </div>
          <div className="collection-toolbar">
            <div
              className="category-tabs"
              role="tablist"
              aria-label="Categorias de relojes"
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
                      Chronograph: "Cronografo",
                    }[item]
                  }
                </button>
              ))}
            </div>
            <label className="sort-select">
              <SlidersHorizontal size={15} />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort collection"
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
              <ChevronDown size={14} />
            </label>
          </div>
          {filtered.length > 0 ? (
            <div className="product-grid">
              {filtered.map((product, index) => (
                <article
                  className={`product-card product-${index + 1}`}
                  key={product.id}
                  data-testid={`card-product-${product.id}`}
                >
                  <div className={`product-image ${product.tone}`}>
                    <img
                      src={product.image}
                      alt={`${product.name}, ${product.category} watch`}
                      loading="lazy"
                    />
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
                        size={18}
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
                      Add to bag <Plus size={15} />
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
              <p>Prueba otra busqueda o vuelve a toda la coleccion.</p>
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

        <section className="craft-section" id="journal">
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
              <span className="eyebrow-line" /> El estandar AMAL
            </div>
            <h2>
              Hecho para
              <br />
              <em>vivirlo.</em>
            </h2>
            <p>
              Fabricantes en pequenos lotes. Materiales honestos. Movimientos
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
                <b>Garantia de cinco anos</b>
                <small>Respondemos por cada pieza elegida</small>
              </div>
            </div>
          </div>
        </section>

        <section className="closing-note">
          <div className="closing-quote">
            “The pleasure is
            <br />
            <em>en la eleccion.</em>”
          </div>
          <div className="closing-details">
            <span>AMAL NOTES / 01</span>
            <p>
              Una breve nota sobre relojes, artesanos y los rituales del tiempo.
              Sin ruido, una vez al mes.
            </p>
            <button
              onClick={() => announce("Ya estas en la lista")}
              data-testid="button-join-notes"
            >
              Suscribirme <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
      </main>

      <footer>
        <a href="#top" className="wordmark" data-testid="link-footer-home">
          <span>A</span> AMAL
        </a>
        <p>Objetos para medir el tiempo.</p>
        <div className="footer-links">
          <a href="#collection" data-testid="link-footer-collection">
            Coleccion
          </a>
          <a href="#atelier" data-testid="link-footer-atelier">
            Atelier
          </a>
          <button
            onClick={() =>
              announce("Atencion al cliente: info@amalwatches.com")
            }
            data-testid="button-contact"
          >
            Contacto
          </button>
        </div>
        <small>© 2026 AMAL Watches. All considered.</small>
      </footer>

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
      {notice && (
        <div className="notice" role="status" data-testid="status-notice">
          {notice}
        </div>
      )}
      {cartOpen && (
        <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
          <aside
            className="cart-drawer"
            onClick={(event) => event.stopPropagation()}
            aria-label="Bolsa de compra"
          >
            <div className="drawer-header">
              <div>
                <span className="drawer-kicker">TU SELECCION</span>
                <h2>
                  Bolsa de compra <small>{cartCount}</small>
                </h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Close shopping bag"
                data-testid="button-close-cart"
              >
                <X size={20} />
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
                            aria-label={`Decrease ${item.name} quantity`}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus size={13} />
                          </button>
                          <span data-testid={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-label={`Increase ${item.name} quantity`}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus size={13} />
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
                  <p>El envio y los impuestos se calculan al finalizar.</p>
                  <button
                    className="checkout-button"
                    onClick={() =>
                      announce("La compra esta lista para continuar")
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
                  <ShoppingBag size={25} strokeWidth={1.2} />
                </div>
                <h3>Tu bolsa te espera.</h3>
                <p>Empieza con una pieza que te siga llamando.</p>
                <button
                  className="checkout-button"
                  onClick={() => setCartOpen(false)}
                  data-testid="button-discover-pieces"
                >
                  Descubrir la coleccion <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
