import { useState } from "react";
import { SlidersHorizontal, ChevronDown, RotateCw, AlertCircle } from "lucide-react";
import type { Category } from "@workspace/shared";
import { useProducts } from "@/features/catalog/use-products";
import { ProductCard } from "./product-card";

interface CollectionGridProps {
  searchQuery?: string;
  favorites?: number[];
  onToggleFavorite?: (id: number) => void;
  onNotice?: (msg: string) => void;
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "All pieces", label: "Todas las piezas" },
  { key: "Dress", label: "Elegante" },
  { key: "Field", label: "Campo" },
  { key: "Diver", label: "Buceo" },
  { key: "Chronograph", label: "Cronógrafo" },
];

export function CollectionGrid({
  searchQuery = "",
  favorites = [],
  onToggleFavorite,
  onNotice,
}: CollectionGridProps) {
  const [category, setCategory] = useState<Category>("All pieces");
  const [sort, setSort] = useState("Curated order");

  // Map sort to backend sort param
  const apiSort =
    sort === "Price: low to high"
      ? "price_asc"
      : sort === "Price: high to low"
        ? "price_desc"
        : undefined;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProducts({
    category: category === "All pieces" ? undefined : category,
    q: searchQuery.trim() || undefined,
    sort: apiSort,
  });

  const products = data?.items || [];

  return (
    <section className="collection-section" id="collection">
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> La colección
          </div>
          <h2>Elegida, no saturada.</h2>
        </div>
        <p className="section-intro">
          Piezas mecánicas de alta precisión. Cada una con su propio ritmo.
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
          {CATEGORIES.map((item) => (
            <button
              key={item.key}
              role="tab"
              aria-selected={category === item.key}
              className={category === item.key ? "active" : ""}
              onClick={() => setCategory(item.key)}
              data-testid={`button-category-${item.key.toLowerCase().replace(" ", "-")}`}
            >
              {item.label}
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
            <option value="Price: low to high">Precio: menor a mayor</option>
            <option value="Price: high to low">Precio: mayor a menor</option>
          </select>
          <ChevronDown size={13} />
        </label>
      </div>

      {isLoading ? (
        <div className="product-grid skeleton-grid" aria-busy="true" aria-label="Cargando productos">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="product-card skeleton-card">
              <div className="skeleton-media" style={{ height: "320px", background: "var(--color-surface-hover, rgba(255,255,255,0.04))", borderRadius: "8px", animation: "pulse 1.5s infinite" }} />
              <div className="skeleton-meta" style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ height: "16px", width: "40%", background: "var(--color-surface-hover, rgba(255,255,255,0.04))", borderRadius: "4px" }} />
                <div style={{ height: "24px", width: "70%", background: "var(--color-surface-hover, rgba(255,255,255,0.04))", borderRadius: "4px" }} />
                <div style={{ height: "18px", width: "30%", background: "var(--color-surface-hover, rgba(255,255,255,0.04))", borderRadius: "4px" }} />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="collection-error" style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--color-surface, rgba(255,255,255,0.02))", borderRadius: "12px", border: "1px solid var(--color-border, rgba(255,255,255,0.08))" }}>
          <AlertCircle size={36} color="var(--oxblood, #8b263e)" style={{ margin: "0 auto 1rem" }} />
          <h3>No pudimos conectar con el catálogo</h3>
          <p style={{ color: "var(--color-muted, #888)", maxWidth: "420px", margin: "0.5rem auto 1.5rem" }}>
            {(error as Error)?.message || "Ocurrió un error al cargar las piezas disponibles."}
          </p>
          <button
            type="button"
            className="button button-primary"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-retry-catalog"
          >
            <RotateCw size={14} className={isFetching ? "animate-spin" : ""} />
            <span>{isFetching ? "Reintentando..." : "Reintentar conexión"}</span>
          </button>
        </div>
      ) : products.length > 0 ? (
        <div className="product-grid" data-testid="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorited={favorites.includes(product.id)}
              onToggleFavorite={onToggleFavorite}
              onNotice={onNotice}
            />
          ))}
        </div>
      ) : (
        <div className="collection-empty" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <p style={{ fontSize: "1.1rem", color: "var(--color-muted, #888)" }}>
            Ninguna pieza coincide con los filtros aplicados.
          </p>
          {(category !== "All pieces" || searchQuery) && (
            <button
              type="button"
              className="button button-ghost"
              style={{ marginTop: "1rem" }}
              onClick={() => {
                setCategory("All pieces");
              }}
            >
              Restablecer filtros
            </button>
          )}
        </div>
      )}
    </section>
  );
}
