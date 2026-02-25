-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  size text DEFAULT 'M'::text,
  color text DEFAULT '#111111'::text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  design_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.design_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_item_id uuid,
  user_id uuid,
  image_url text NOT NULL,
  side text DEFAULT 'front'::text CHECK (side = ANY (ARRAY['front'::text, 'back'::text])),
  position_x numeric DEFAULT 0,
  position_y numeric DEFAULT 0.08,
  scale numeric DEFAULT 0.12,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT design_images_pkey PRIMARY KEY (id),
  CONSTRAINT design_images_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id),
  CONSTRAINT design_images_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.featured_designs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text DEFAULT ''::text,
  image_url text NOT NULL,
  is_featured boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  link_url text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT featured_designs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  size text DEFAULT 'M'::text,
  color text DEFAULT '#111111'::text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  design_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'pressing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text])),
  total_amount numeric NOT NULL DEFAULT 0,
  shipping_address text DEFAULT ''::text,
  shipping_city text DEFAULT ''::text,
  phone text DEFAULT ''::text,
  payment_method text DEFAULT 'cash'::text CHECK (payment_method = ANY (ARRAY['cash'::text, 'card'::text])),
  notes text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT ''::text,
  category text NOT NULL DEFAULT 'tshirt'::text CHECK (category = ANY (ARRAY['tshirt'::text, 'hoodie'::text])),
  base_price numeric NOT NULL DEFAULT 150,
  image_url text DEFAULT ''::text,
  sizes ARRAY DEFAULT ARRAY['S'::text, 'M'::text, 'L'::text, 'XL'::text, 'XXL'::text],
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text NOT NULL DEFAULT ''::text,
  last_name text NOT NULL DEFAULT ''::text,
  email TEXT NOT NULL DEFAULT '',
  phone text DEFAULT ''::text,
  address text DEFAULT ''::text,
  city text DEFAULT ''::text,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  avatar_url text DEFAULT ''::text,
  is_blocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.saved_designs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text DEFAULT 'Mon design'::text,
  product_id uuid,
  color text DEFAULT '#111111'::text,
  design_data jsonb DEFAULT '{}'::jsonb,
  thumbnail_url text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saved_designs_pkey PRIMARY KEY (id),
  CONSTRAINT saved_designs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT saved_designs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.site_settings (
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (key)
);