import { useQuery } from "@tanstack/react-query";
import type { Product } from "@workspace/shared";

export type ProductQueryParams = {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "name_asc" | string;
  page?: number;
  pageSize?: number;
};

export type ProductsResponse = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function useProducts(params: ProductQueryParams = {}) {
  const queryParams = new URLSearchParams();

  if (params.category && params.category !== "All pieces") {
    queryParams.set("category", params.category);
  }
  if (params.q) {
    queryParams.set("q", params.q);
  }
  if (params.minPrice !== undefined) {
    queryParams.set("minPrice", String(params.minPrice));
  }
  if (params.maxPrice !== undefined) {
    queryParams.set("maxPrice", String(params.maxPrice));
  }
  if (params.sort) {
    queryParams.set("sort", params.sort);
  }
  if (params.page !== undefined) {
    queryParams.set("page", String(params.page));
  }
  if (params.pageSize !== undefined) {
    queryParams.set("pageSize", String(params.pageSize));
  }

  const queryString = queryParams.toString();
  const url = `/api/products${queryString ? `?${queryString}` : ""}`;

  return useQuery<ProductsResponse>({
    queryKey: ["products", params],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("No se pudo cargar el catálogo de productos");
      }
      return res.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useProduct(slug: string) {
  return useQuery<{ product: Product }>({
    queryKey: ["product", slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/${slug}`);
      if (!res.ok) {
        throw new Error("Producto no encontrado");
      }
      return res.json();
    },
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
  });
}
