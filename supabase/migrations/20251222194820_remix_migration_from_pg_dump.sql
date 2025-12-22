CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'user',
    'vendor'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    room_id uuid
);


--
-- Name: custom_finishes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_finishes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'Custom'::text NOT NULL,
    image_url text NOT NULL,
    color_hex text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: layouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.layouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    user_id uuid NOT NULL,
    name text DEFAULT 'Untitled Layout'::text,
    room_dimensions jsonb DEFAULT '{"unit": "ft", "depth": 15, "width": 20}'::jsonb,
    canvas_data jsonb,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    item_name text NOT NULL,
    item_category text,
    item_price numeric DEFAULT 0 NOT NULL,
    item_image_url text,
    catalog_item_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    vendor_id uuid,
    vendor_product_id uuid
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    client_name text NOT NULL,
    client_email text,
    client_phone text,
    invoice_number text,
    subtotal numeric DEFAULT 0 NOT NULL,
    commission numeric DEFAULT 0 NOT NULL,
    grand_total numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    image_url text,
    product_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'Untitled Project'::text NOT NULL,
    description text,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: renders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.renders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    room_upload_id uuid,
    prompt text NOT NULL,
    render_url text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_render_id uuid,
    room_id uuid
);


--
-- Name: room_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    analysis_status text DEFAULT 'pending'::text NOT NULL,
    analysis_result jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    upload_type text DEFAULT 'room_photo'::text NOT NULL,
    room_id uuid
);


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'Untitled Room'::text NOT NULL,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: staged_furniture; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staged_furniture (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    catalog_item_id text NOT NULL,
    item_name text NOT NULL,
    item_category text NOT NULL,
    item_description text,
    item_image_url text,
    item_price numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    room_id uuid
);


--
-- Name: staging_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staging_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    room_id uuid,
    user_id uuid NOT NULL,
    name text DEFAULT 'Zone 1'::text NOT NULL,
    x_start numeric NOT NULL,
    y_start numeric NOT NULL,
    x_end numeric NOT NULL,
    y_end numeric NOT NULL,
    camera_position text DEFAULT 'perspective'::text,
    camera_angle numeric DEFAULT 0,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: style_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.style_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vendor_product_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_product_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    product_id uuid,
    image_url text NOT NULL,
    template_name text NOT NULL,
    photo_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT vendor_product_photos_photo_type_check CHECK ((photo_type = ANY (ARRAY['solo'::text, 'model'::text])))
);


--
-- Name: vendor_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    price numeric DEFAULT 0 NOT NULL,
    image_url text,
    sku text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vendor_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    furniture_name text NOT NULL,
    furniture_image_url text,
    furniture_description text,
    bom_data jsonb,
    quantity integer DEFAULT 1,
    notes text,
    deadline date,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: custom_finishes custom_finishes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_finishes
    ADD CONSTRAINT custom_finishes_pkey PRIMARY KEY (id);


--
-- Name: layouts layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.layouts
    ADD CONSTRAINT layouts_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_invoice_number_key UNIQUE (invoice_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_items product_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_items
    ADD CONSTRAINT product_items_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: renders renders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renders
    ADD CONSTRAINT renders_pkey PRIMARY KEY (id);


--
-- Name: room_uploads room_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_uploads
    ADD CONSTRAINT room_uploads_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: staged_furniture staged_furniture_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staged_furniture
    ADD CONSTRAINT staged_furniture_pkey PRIMARY KEY (id);


--
-- Name: staged_furniture staged_furniture_project_id_catalog_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staged_furniture
    ADD CONSTRAINT staged_furniture_project_id_catalog_item_id_key UNIQUE (project_id, catalog_item_id);


--
-- Name: staging_zones staging_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staging_zones
    ADD CONSTRAINT staging_zones_pkey PRIMARY KEY (id);


--
-- Name: style_uploads style_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.style_uploads
    ADD CONSTRAINT style_uploads_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: vendor_product_photos vendor_product_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_product_photos
    ADD CONSTRAINT vendor_product_photos_pkey PRIMARY KEY (id);


--
-- Name: vendor_products vendor_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT vendor_products_pkey PRIMARY KEY (id);


--
-- Name: vendor_requests vendor_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_requests
    ADD CONSTRAINT vendor_requests_pkey PRIMARY KEY (id);


--
-- Name: idx_chat_messages_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_project ON public.chat_messages USING btree (project_id);


--
-- Name: idx_chat_messages_project_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_project_created ON public.chat_messages USING btree (project_id, created_at);


--
-- Name: idx_renders_parent_render_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_renders_parent_render_id ON public.renders USING btree (parent_render_id);


--
-- Name: idx_renders_project_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_renders_project_status ON public.renders USING btree (project_id, status);


--
-- Name: idx_renders_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_renders_status_created ON public.renders USING btree (status, created_at DESC);


--
-- Name: idx_renders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_renders_user_id ON public.renders USING btree (user_id);


--
-- Name: idx_staged_furniture_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staged_furniture_project ON public.staged_furniture USING btree (project_id);


--
-- Name: idx_staged_furniture_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staged_furniture_user ON public.staged_furniture USING btree (user_id);


--
-- Name: layouts update_layouts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_layouts_updated_at BEFORE UPDATE ON public.layouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: rooms update_rooms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendor_products update_vendor_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vendor_products_updated_at BEFORE UPDATE ON public.vendor_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendor_requests update_vendor_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vendor_requests_updated_at BEFORE UPDATE ON public.vendor_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_messages chat_messages_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: layouts layouts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.layouts
    ADD CONSTRAINT layouts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES auth.users(id);


--
-- Name: order_items order_items_vendor_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_vendor_product_id_fkey FOREIGN KEY (vendor_product_id) REFERENCES public.vendor_products(id);


--
-- Name: orders orders_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: renders renders_parent_render_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renders
    ADD CONSTRAINT renders_parent_render_id_fkey FOREIGN KEY (parent_render_id) REFERENCES public.renders(id) ON DELETE SET NULL;


--
-- Name: renders renders_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renders
    ADD CONSTRAINT renders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: renders renders_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renders
    ADD CONSTRAINT renders_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: renders renders_room_upload_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renders
    ADD CONSTRAINT renders_room_upload_id_fkey FOREIGN KEY (room_upload_id) REFERENCES public.room_uploads(id) ON DELETE SET NULL;


--
-- Name: renders renders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renders
    ADD CONSTRAINT renders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: room_uploads room_uploads_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_uploads
    ADD CONSTRAINT room_uploads_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: room_uploads room_uploads_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_uploads
    ADD CONSTRAINT room_uploads_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: room_uploads room_uploads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_uploads
    ADD CONSTRAINT room_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: staged_furniture staged_furniture_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staged_furniture
    ADD CONSTRAINT staged_furniture_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: staged_furniture staged_furniture_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staged_furniture
    ADD CONSTRAINT staged_furniture_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: staging_zones staging_zones_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staging_zones
    ADD CONSTRAINT staging_zones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: staging_zones staging_zones_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staging_zones
    ADD CONSTRAINT staging_zones_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vendor_product_photos vendor_product_photos_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_product_photos
    ADD CONSTRAINT vendor_product_photos_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.vendor_products(id) ON DELETE CASCADE;


--
-- Name: vendor_products vendor_products_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT vendor_products_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: staged_furniture Users can add staged furniture; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add staged furniture" ON public.staged_furniture FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: order_items Users can create order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));


--
-- Name: custom_finishes Users can create their own custom finishes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own custom finishes" ON public.custom_finishes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: layouts Users can create their own layouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own layouts" ON public.layouts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: chat_messages Users can create their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own messages" ON public.chat_messages FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: orders Users can create their own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: product_items Users can create their own product items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own product items" ON public.product_items FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: projects Users can create their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: renders Users can create their own renders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own renders" ON public.renders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: rooms Users can create their own rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own rooms" ON public.rooms FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: style_uploads Users can create their own style uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own style uploads" ON public.style_uploads FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: room_uploads Users can create their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own uploads" ON public.room_uploads FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vendor_requests Users can create their own vendor requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own vendor requests" ON public.vendor_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: staging_zones Users can create their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own zones" ON public.staging_zones FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: order_items Users can delete their order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their order items" ON public.order_items FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));


--
-- Name: custom_finishes Users can delete their own custom finishes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own custom finishes" ON public.custom_finishes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: layouts Users can delete their own layouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own layouts" ON public.layouts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: chat_messages Users can delete their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own messages" ON public.chat_messages FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: orders Users can delete their own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own orders" ON public.orders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: product_items Users can delete their own product items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own product items" ON public.product_items FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: projects Users can delete their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: renders Users can delete their own renders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own renders" ON public.renders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: rooms Users can delete their own rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own rooms" ON public.rooms FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: staged_furniture Users can delete their own staged furniture; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own staged furniture" ON public.staged_furniture FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: style_uploads Users can delete their own style uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own style uploads" ON public.style_uploads FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: room_uploads Users can delete their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own uploads" ON public.room_uploads FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: vendor_requests Users can delete their own vendor requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own vendor requests" ON public.vendor_requests FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: staging_zones Users can delete their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own zones" ON public.staging_zones FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_roles Users can insert their own role on signup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own role on signup" ON public.user_roles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: order_items Users can update their order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their order items" ON public.order_items FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));


--
-- Name: layouts Users can update their own layouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own layouts" ON public.layouts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: orders Users can update their own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: product_items Users can update their own product items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own product items" ON public.product_items FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: projects Users can update their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: renders Users can update their own renders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own renders" ON public.renders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: rooms Users can update their own rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own rooms" ON public.rooms FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: room_uploads Users can update their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own uploads" ON public.room_uploads FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: vendor_requests Users can update their own vendor requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own vendor requests" ON public.vendor_requests FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: staging_zones Users can update their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own zones" ON public.staging_zones FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: vendor_products Users can view active vendor products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active vendor products" ON public.vendor_products FOR SELECT USING ((is_active = true));


--
-- Name: order_items Users can view their order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));


--
-- Name: custom_finishes Users can view their own custom finishes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own custom finishes" ON public.custom_finishes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: layouts Users can view their own layouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own layouts" ON public.layouts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: chat_messages Users can view their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own messages" ON public.chat_messages FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: orders Users can view their own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: product_items Users can view their own product items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own product items" ON public.product_items FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: projects Users can view their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: renders Users can view their own renders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own renders" ON public.renders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: rooms Users can view their own rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own rooms" ON public.rooms FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: staged_furniture Users can view their own staged furniture; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own staged furniture" ON public.staged_furniture FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: style_uploads Users can view their own style uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own style uploads" ON public.style_uploads FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: room_uploads Users can view their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own uploads" ON public.room_uploads FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vendor_requests Users can view their own vendor requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own vendor requests" ON public.vendor_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: staging_zones Users can view their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own zones" ON public.staging_zones FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vendor_products Vendors can create products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can create products" ON public.vendor_products FOR INSERT WITH CHECK (((auth.uid() = vendor_id) AND public.has_role(auth.uid(), 'vendor'::public.app_role)));


--
-- Name: vendor_product_photos Vendors can delete own photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can delete own photos" ON public.vendor_product_photos FOR DELETE USING ((vendor_id = auth.uid()));


--
-- Name: vendor_products Vendors can delete their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can delete their own products" ON public.vendor_products FOR DELETE USING (((auth.uid() = vendor_id) AND public.has_role(auth.uid(), 'vendor'::public.app_role)));


--
-- Name: vendor_product_photos Vendors can insert own photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can insert own photos" ON public.vendor_product_photos FOR INSERT WITH CHECK ((vendor_id = auth.uid()));


--
-- Name: vendor_products Vendors can update their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can update their own products" ON public.vendor_products FOR UPDATE USING (((auth.uid() = vendor_id) AND public.has_role(auth.uid(), 'vendor'::public.app_role)));


--
-- Name: order_items Vendors can view order items with their products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view order items with their products" ON public.order_items FOR SELECT USING ((vendor_id = auth.uid()));


--
-- Name: vendor_product_photos Vendors can view own photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view own photos" ON public.vendor_product_photos FOR SELECT USING ((vendor_id = auth.uid()));


--
-- Name: vendor_products Vendors can view their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view their own products" ON public.vendor_products FOR SELECT USING ((auth.uid() = vendor_id));


--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_finishes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_finishes ENABLE ROW LEVEL SECURITY;

--
-- Name: layouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.layouts ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: product_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_items ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: renders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.renders ENABLE ROW LEVEL SECURITY;

--
-- Name: room_uploads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.room_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: rooms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

--
-- Name: staged_furniture; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staged_furniture ENABLE ROW LEVEL SECURITY;

--
-- Name: staging_zones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staging_zones ENABLE ROW LEVEL SECURITY;

--
-- Name: style_uploads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.style_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_product_photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_product_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_requests ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;