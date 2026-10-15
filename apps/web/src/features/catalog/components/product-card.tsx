import { Link } from "wouter";
import { Heart, Plus } from "lucide-react";
import type { Product } from "@workspace/shared";
import { money } from "@workspace/shared";
import { useCart } from "@/features/cart/use-cart";

interface ProductCardProps {
  product: Product;
  isFavorited?: boolean;
  onToggleFavorite?: (id: number) => void;
  onNotice?: (msg: string) => void;
}

export function ProductCard({
  product,
  isFavorited = false,
  onToggleFavorite,
  onNotice,
}: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    onNotice?.(`Añadido "${product.name}" a la bolsa.`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(product.id);
  };

  return (
    <article
      className="product-card"
      data-tone={product.tone}
      data-testid={`card-product-${product.id}`}
    >
      <div className="product-media">
        <Link
          href={`/product/${product.slug}`}
          className="product-link"
          data-testid={`link-product-${product.slug}`}
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="product-image"
          />
        </Link>
        <button
          type="button"
          className="favorite-button"
          onClick={handleFavoriteClick}
          aria-label={
            isFavorited
              ? `Eliminar ${product.name} de favoritos`
              : `Añadir ${product.name} a favoritos`
          }
          data-testid={`button-favorite-${product.id}`}
        >
          <Heart
            size={16}
            fill={isFavorited ? "var(--oxblood)" : "none"}
            color={isFavorited ? "var(--oxblood)" : "currentColor"}
          />
        </button>
      </div>

      <div className="product-meta">
        <div className="product-header">
          <span className="product-collection">{product.collection}</span>
          <strong className="product-price">{money(product.price)}</strong>
        </div>

        <h3 className="product-title">
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>

        <p className="product-description">{product.description}</p>

        {product.stock !== undefined && product.stock <= 3 && product.stock > 0 && (
          <span className="low-stock-badge">
            Solo {product.stock} disponibles en el Atelier
          </span>
        )}

        <div className="product-actions">
          <button
            type="button"
            className="add-to-cart-button"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <Plus size={14} />
            <span>{product.stock === 0 ? "Agotado" : "Añadir a la bolsa"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
