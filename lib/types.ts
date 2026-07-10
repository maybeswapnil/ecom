export type ProductImageRole = "framed" | "print" | "detail" | "room";

export const PRODUCT_IMAGE_ROLE_LABELS: Record<ProductImageRole, string> = {
  framed: "Framed hero",
  print: "Flat print",
  detail: "Detail close-up",
  room: "In room",
};

export type ProductImage = {
  url: string;
  alt: string;
  role?: ProductImageRole;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  story: string | null;
  tags: string[];
  images: ProductImage[];
  status: "draft" | "live" | "archived";
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  size_label: string;
  frame_finish: string;
  price_paise: number;
  compare_at_paise: number | null;
  stock_qty: number;
  weight_g: number | null;
  width_mm: number | null;
  height_mm: number | null;
  depth_mm: number | null;
  active: boolean;
};

export type ProductWithVariants = Product & {
  product_variants: ProductVariant[];
};
