import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Plus, Minus, ShoppingBag, ShieldCheck, Heart, Sparkles, AlertCircle, RotateCw } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { CartDrawer } from "@/features/catalog/components/cart-drawer";
import { useProduct } from "@/features/catalog/use-products";
import { useCart } from "@/features/cart/use-cart";
import { useFavorites } from "@/features/favorites/use-favorites";
import { money } from "@workspace/shared";

export default function ProductDetailPage() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug || "";
  const { data, isLoading, isError, error, refetch } = useProduct(slug);
  const { cartCount, setCartOpen, addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");

  const product = data?.product;
  const isFavorited = product ? isFavorite(product.id) : false;

  const handleToggleFavorite = () => {
    if (!product) return;
    toggleFavorite(product.id);
    setNotice(
      isFavorited
        ? `Eliminado "${product.name}" de tus favoritos.`
        : `Añadido "${product.name}" a tus favoritos.`,
    );
    setTimeout(() => setNotice(""), 3500);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setCartOpen(true);
    setNotice(`Añadido "${product.name}" (${quantity}) a la bolsa.`);
    setTimeout(() => setNotice(""), 3500);
  };

  const productSchema = product
    ? {
        "@context": "https://schema.org/",
        "@type": "Product",
        name: product.name,
        image: product.image,
        description: product.description,
        sku: product.slug,
        brand: {
          "@type": "Brand",
          name: "AMAL Watches",
        },
        offers: {
          "@type": "Offer",
          url: `https://amalwatches.com/product/${product.slug}`,
          priceCurrency: "EUR",
          price: product.price,
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      }
    : null;

  return (
    <div className="site-wrapper">
      <Helmet>
        <title>
          {product
            ? `${product.name} — ${product.collection} | AMAL Watches`
            : "Pieza de Alta Relojería — AMAL Watches"}
        </title>
        {product && (
          <>
            <meta name="description" content={product.description} />
            <link rel="canonical" href={`https://amalwatches.com/product/${product.slug}`} />
            <meta property="og:title" content={`${product.name} — AMAL Watches`} />
            <meta property="og:description" content={product.description} />
            <meta property="og:image" content={product.image} />
            <meta property="og:type" content="product" />
            <script type="application/ld+json">
              {JSON.stringify(productSchema)}
            </script>
          </>
        )}
      </Helmet>

      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <AnnouncementBar />
      <Header cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

      <main id="main-content" tabIndex={-1} className="product-detail-page" style={{ maxWidth: "1200px", margin: "2rem auto 5rem", padding: "0 1.5rem" }}>
        <Link href="/" className="back-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", color: "var(--color-muted, #999)", fontSize: "0.9rem", textDecoration: "none" }}>
          <ArrowLeft size={16} />
          <span>Volver a la colección</span>
        </Link>

        {isLoading ? (
          <div className="product-detail-skeleton" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem" }}>
            <div style={{ height: "480px", background: "var(--color-surface, rgba(255,255,255,0.03))", borderRadius: "12px", animation: "pulse 1.5s infinite" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ height: "20px", width: "30%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
              <div style={{ height: "40px", width: "80%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
              <div style={{ height: "24px", width: "25%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
              <div style={{ height: "100px", width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
            </div>
          </div>
        ) : isError || !product ? (
          <div className="product-error" style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--color-surface, rgba(255,255,255,0.02))", borderRadius: "12px", border: "1px solid var(--color-border, rgba(255,255,255,0.08))" }}>
            <AlertCircle size={36} color="var(--oxblood, #8b263e)" style={{ margin: "0 auto 1rem" }} />
            <h2>Pieza no encontrada</h2>
            <p style={{ color: "var(--color-muted, #888)", maxWidth: "420px", margin: "0.5rem auto 1.5rem" }}>
              {(error as Error)?.message || "No hemos podido encontrar el reloj solicitado en el catálogo actual."}
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button type="button" className="button button-ghost" onClick={() => refetch()}>
                <RotateCw size={14} /> Reintentar
              </button>
              <Link href="/" className="button button-primary">
                Ver todos los relojes
              </Link>
            </div>
          </div>
        ) : (
          <div className="product-detail-layout" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "4rem", alignItems: "start" }}>
            <div className="product-gallery">
              <div
                className="product-gallery-main"
                data-tone={product.tone}
                style={{
                  background: "var(--color-surface, #141414)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
                  aspectRatio: "1 / 1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  aria-label={isFavorited ? "Quitar de favoritos" : "Guardar en favoritos"}
                  style={{
                    position: "absolute",
                    top: "1.25rem",
                    right: "1.25rem",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    color: isFavorited ? "var(--oxblood, #8b263e)" : "#fff",
                  }}
                >
                  <Heart size={18} fill={isFavorited ? "var(--oxblood, #8b263e)" : "none"} />
                </button>
              </div>
            </div>

            <div className="product-info-panel">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem", color: "var(--color-muted, #888)" }}>
                  {product.collection}
                </span>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                <span style={{ fontSize: "0.8rem", color: "var(--color-muted, #888)" }}>
                  {product.category}
                </span>
              </div>

              <h1 style={{ fontSize: "2.5rem", fontWeight: 300, margin: "0.25rem 0 1rem", letterSpacing: "-0.02em" }}>
                {product.name}
              </h1>

              <div style={{ fontSize: "1.75rem", fontWeight: 400, color: "var(--color-fg, #fff)", marginBottom: "1.5rem" }}>
                {money(product.price)}
              </div>

              <p style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--color-muted, #aaa)", marginBottom: "2rem" }}>
                {product.description}
              </p>

              {product.stock !== undefined && product.stock <= 3 && product.stock > 0 && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.8rem", background: "rgba(139,38,62,0.15)", border: "1px solid rgba(139,38,62,0.3)", borderRadius: "4px", color: "#ff8da1", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                  <Sparkles size={14} />
                  <span>Edición casi agotada: solo {product.stock} unidades en el Atelier</span>
                </div>
              )}

              <div className="product-purchase-box" style={{ padding: "1.5rem", background: "var(--color-surface, rgba(255,255,255,0.02))", border: "1px solid var(--color-border, rgba(255,255,255,0.08))", borderRadius: "12px", marginBottom: "2rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--color-border, rgba(255,255,255,0.15))", borderRadius: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      style={{ padding: "0.6rem 0.8rem", background: "none", border: "none", color: "#fff", cursor: "pointer" }}
                      aria-label="Disminuir cantidad"
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ padding: "0 0.8rem", minWidth: "2rem", textAlign: "center", fontSize: "0.95rem" }}>
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => (product.stock ? Math.min(product.stock, q + 1) : q + 1))}
                      style={{ padding: "0.6rem 0.8rem", background: "none", border: "none", color: "#fff", cursor: "pointer" }}
                      aria-label="Aumentar cantidad"
                      disabled={product.stock !== undefined && quantity >= product.stock}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="button button-primary"
                    style={{ flex: 1, padding: "0.8rem 1.5rem" }}
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    data-testid="button-detail-add-to-cart"
                  >
                    <ShoppingBag size={16} />
                    <span>{product.stock === 0 ? "Agotado en Atelier" : `Añadir a la bolsa • ${money(product.price * quantity)}`}</span>
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-muted, #888)" }}>
                  <ShieldCheck size={16} color="var(--oxblood, #8b263e)" />
                  <span>Envío asegurado express y 5 años de garantía internacional incluidos.</span>
                </div>
              </div>

              <div className="product-specs" style={{ borderTop: "1px solid var(--color-border, rgba(255,255,255,0.08))", paddingTop: "1.5rem" }}>
                <h4 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem", color: "var(--color-muted, #888)" }}>
                  Especificaciones del Atelier
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
                  <div>
                    <strong style={{ display: "block", color: "var(--color-muted, #777)", fontSize: "0.8rem" }}>Calibre</strong>
                    <span>Mecánico suizo / japonés con ajuste fino</span>
                  </div>
                  <div>
                    <strong style={{ display: "block", color: "var(--color-muted, #777)", fontSize: "0.8rem" }}>Cristal</strong>
                    <span>Zafiro abovedado con antirreflejos</span>
                  </div>
                  <div>
                    <strong style={{ display: "block", color: "var(--color-muted, #777)", fontSize: "0.8rem" }}>Hermetismo</strong>
                    <span>{product.category === "Diver" ? "200 m / 20 ATM" : "50 m / 5 ATM"}</span>
                  </div>
                  <div>
                    <strong style={{ display: "block", color: "var(--color-muted, #777)", fontSize: "0.8rem" }}>Montaje</strong>
                    <span>Ensamblado y regulado en Barcelona</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />

      {notice && (
        <div className="notice" role="status" aria-live="polite">
          {notice}
        </div>
      )}
    </div>
  );
}
