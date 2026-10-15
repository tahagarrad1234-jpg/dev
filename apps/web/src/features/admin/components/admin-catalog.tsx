import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2 } from "lucide-react";
import { money, type Product } from "@workspace/shared";

export function AdminCatalog() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "catalog", search],
    queryFn: async () => {
      const res = await fetch(`/api/products?q=${encodeURIComponent(search)}&pageSize=50`);
      if (!res.ok) throw new Error("Error al cargar productos");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar producto");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "catalog"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const products: Product[] = data?.items || [];

  return (
    <section className="admin-content">
      <div className="admin-page-intro">
        <div>
          <span className="admin-eyebrow">INVENTARIO</span>
          <h2>Catálogo de piezas</h2>
          <p>Supervisa stock, precios y referencias activas en el Atelier.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            placeholder="Buscar modelo o colección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card">
        {isLoading ? (
          <p className="admin-loading-text">Cargando catálogo...</p>
        ) : products.length === 0 ? (
          <p className="empty-notice">No hay piezas en el catálogo.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pieza</th>
                <th>Colección</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px" }}
                      />
                      <strong>{p.name}</strong>
                    </div>
                  </td>
                  <td>{p.collection}</td>
                  <td>{p.category}</td>
                  <td>
                    <strong>{money(p.price)}</strong>
                  </td>
                  <td>
                    <span className={p.stock <= 3 ? "warning-text" : ""}>
                      {p.stock} uds.
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-delete-btn"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar ${p.name}?`)) {
                          deleteMutation.mutate(p.id);
                        }
                      }}
                      title="Eliminar pieza"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
