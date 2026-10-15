import { Link } from "wouter";
import { Heart, ArrowLeft } from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/features/catalog/components/cart-drawer";
import { ProductCard } from "@/features/catalog/components/product-card";
import { useProducts } from "@/features/catalog/use-products";
import { useCart } from "@/features/cart/use-cart";
import { useFavorites } from "@/features/favorites/use-favorites";

export default function FavoritesPage() {
  const { cartCount, setCartOpen } = useCart();
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();

  const { data, isLoading } = useProducts();
  const allProducts = data?.items || [];
  const favoritedProducts = allProducts.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="site-wrapper">
      <AnnouncementBar />
      <Header
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        favoritesCount={favoriteIds.length}
      />

      <main style={{ maxWidth: "1200px", margin: "2rem auto 5rem", padding: "0 1.5rem", minHeight: "60vh" }}>
        <Link href="/" className="back-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", color: "var(--color-muted, #999)", fontSize: "0.9rem", textDecoration: "none" }}>
          <ArrowLeft size={16} />
          <span>Volver al catálogo</span>
        </Link>

        <div style={{ marginBottom: "3rem" }}>
          <span className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem", color: "var(--color-muted, #888)" }}>
            TU SELECCIÓN GUARDADA
          </span>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 300, margin: "0.5rem 0" }}>
            Piezas favoritas
          </h1>
          <p style={{ color: "var(--color-muted, #888)" }}>
            Los modelos que han captado tu atención para volver a contemplarlos con serenidad.
          </p>
        </div>

        {isLoading ? (
          <p>Cargando tus piezas guardadas...</p>
        ) : favoritedProducts.length > 0 ? (
          <div className="product-grid" data-testid="favorites-grid">
            {favoritedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorited={true}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "5rem 2rem", background: "var(--color-surface, rgba(255,255,255,0.02))", borderRadius: "12px", border: "1px solid var(--color-border, rgba(255,255,255,0.08))" }}>
            <Heart size={36} color="var(--oxblood, #8b263e)" style={{ margin: "0 auto 1rem" }} />
            <h3>No tienes piezas en favoritos</h3>
            <p style={{ color: "var(--color-muted, #888)", margin: "0.5rem auto 1.5rem", maxWidth: "380px" }}>
              Explora nuestra colección y pulsa en el corazón de cualquier modelo para guardarlo aquí.
            </p>
            <Link href="/" className="button button-primary">
              Explorar colección
            </Link>
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
