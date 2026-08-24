-- Phase 7.11: Admin catalog persistence (categories, products, images, price history)
-- Run this in Supabase SQL Editor or via Supabase CLI before using the admin catalog.

-- ---------------------------------------------------------------------------
-- Helper: admin role check (requires app_metadata.role = 'admin' on auth user)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  description text,
  published   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_published_idx ON public.categories (published);
CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON public.categories (sort_order);

DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.products (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code           text UNIQUE,
  name                   text NOT NULL,
  category_id            uuid NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  description            text,
  price                  numeric(12, 2) NOT NULL,
  initial_stock          integer NOT NULL DEFAULT 0,
  current_stock          integer NOT NULL DEFAULT 0,
  minimum_order_quantity integer NOT NULL DEFAULT 1,
  maximum_order_quantity integer NOT NULL DEFAULT 10,
  low_stock_threshold    integer NOT NULL DEFAULT 5,
  published              boolean NOT NULL DEFAULT true,
  main_image_url         text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT products_price_check CHECK (price >= 0),
  CONSTRAINT products_initial_stock_check CHECK (initial_stock >= 0),
  CONSTRAINT products_current_stock_check CHECK (current_stock >= 0),
  CONSTRAINT products_min_order_qty_check CHECK (minimum_order_quantity >= 1),
  CONSTRAINT products_max_order_qty_check CHECK (maximum_order_quantity >= 1),
  CONSTRAINT products_low_stock_threshold_check CHECK (low_stock_threshold >= 0),
  CONSTRAINT products_min_max_order_qty_check CHECK (minimum_order_quantity <= maximum_order_quantity)
);

CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products (category_id);
CREATE INDEX IF NOT EXISTS products_published_idx ON public.products (published);

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url   text NOT NULL,
  is_primary   boolean NOT NULL DEFAULT false,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON public.product_images (product_id);

-- ---------------------------------------------------------------------------
-- product_price_history
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_price_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  price      numeric(12, 2) NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid REFERENCES auth.users (id),

  CONSTRAINT product_price_history_price_check CHECK (price > 0)
);

CREATE INDEX IF NOT EXISTS product_price_history_product_id_idx ON public.product_price_history (product_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

-- categories: public read published
DROP POLICY IF EXISTS categories_public_select ON public.categories;
CREATE POLICY categories_public_select ON public.categories
  FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS categories_admin_all ON public.categories;
CREATE POLICY categories_admin_all ON public.categories
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- products: public read published
DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select ON public.products
  FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS products_admin_all ON public.products;
CREATE POLICY products_admin_all ON public.products
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- product_images: public read when parent product is published
DROP POLICY IF EXISTS product_images_public_select ON public.product_images;
CREATE POLICY product_images_public_select ON public.product_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
        AND p.published = true
    )
  );

DROP POLICY IF EXISTS product_images_admin_all ON public.product_images;
CREATE POLICY product_images_admin_all ON public.product_images
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- product_price_history: admin only (no public access)
DROP POLICY IF EXISTS product_price_history_admin_all ON public.product_price_history;
CREATE POLICY product_price_history_admin_all ON public.product_price_history
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed: admin categories (from adminCategorySeed — not storefront products.js)
-- ---------------------------------------------------------------------------

INSERT INTO public.categories (id, name, slug, description, published, sort_order)
VALUES
  ('11111111-1111-4111-8111-111111110001', 'Jewelry', 'jewelry', 'All jewelry items including earrings, necklaces, bracelets, and more.', true, 1),
  ('11111111-1111-4111-8111-111111110002', 'Earrings', 'earrings', 'Beautiful earrings in various styles.', true, 2),
  ('11111111-1111-4111-8111-111111110003', 'Necklaces', 'necklaces', 'Elegant necklaces for everyday wear and special occasions.', true, 3),
  ('11111111-1111-4111-8111-111111110004', 'Bracelets', 'bracelets', 'Stylish bracelets to complement any outfit.', true, 4),
  ('11111111-1111-4111-8111-111111110005', 'Rings', 'rings', 'Unique rings for all occasions.', true, 5),
  ('11111111-1111-4111-8111-111111110006', 'Clothes', 'clothes', 'Fashion clothing items.', true, 6),
  ('11111111-1111-4111-8111-111111110007', 'Shoes', 'shoes', 'Quality footwear.', true, 7),
  ('11111111-1111-4111-8111-111111110008', 'Bags', 'bags', 'Stylish bags and accessories.', true, 8)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed: admin demo products (from adminProductSeed — separate from storefront)
-- External Unsplash URLs stored in main_image_url only (no Storage rows).
-- ---------------------------------------------------------------------------

INSERT INTO public.products (
  id, product_code, name, category_id, description, price,
  initial_stock, current_stock, minimum_order_quantity, maximum_order_quantity,
  low_stock_threshold, published, main_image_url
)
VALUES
  (
    '22222222-2222-4222-8222-222222220001',
    '6SET-001',
    'Pearl Necklace',
    '11111111-1111-4111-8111-111111110003',
    'Elegant pearl necklace designed for everyday sophistication.',
    1500.00,
    20, 8, 1, 5, 5, true,
    'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&w=800&q=85'
  ),
  (
    '22222222-2222-4222-8222-222222220002',
    '6SET-002',
    'Black Dress',
    '11111111-1111-4111-8111-111111110006',
    'A chic black dress suitable for elevated everyday styling.',
    2500.00,
    15, 3, 1, 2, 5, true,
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=85'
  ),
  (
    '22222222-2222-4222-8222-222222220003',
    '6SET-003',
    'Red Heels',
    '11111111-1111-4111-8111-111111110007',
    'Bold red heels with a sleek statement silhouette.',
    3000.00,
    12, 0, 1, 3, 5, true,
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=85'
  )
ON CONFLICT (product_code) DO NOTHING;

-- Initial price history for seeded products
INSERT INTO public.product_price_history (product_id, price)
SELECT p.id, p.price
FROM public.products p
WHERE p.product_code IN ('6SET-001', '6SET-002', '6SET-003')
  AND NOT EXISTS (
    SELECT 1 FROM public.product_price_history h WHERE h.product_id = p.id
  );
