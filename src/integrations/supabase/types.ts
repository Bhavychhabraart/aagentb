export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_b_knowledge: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          knowledge_type: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_type: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_type?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      agent_b_layout_templates: {
        Row: {
          canvas_data: Json
          created_at: string | null
          id: string
          is_favorite: boolean | null
          name: string
          room_dimensions: Json | null
          room_type: string | null
          thumbnail_url: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          canvas_data: Json
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          name: string
          room_dimensions?: Json | null
          room_type?: string | null
          thumbnail_url?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          canvas_data?: Json
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          room_dimensions?: Json | null
          room_type?: string | null
          thumbnail_url?: string | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      agent_b_style_collections: {
        Row: {
          colors: string[] | null
          created_at: string | null
          description: string | null
          furniture_styles: string[] | null
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          materials: string[] | null
          name: string
          user_id: string
        }
        Insert: {
          colors?: string[] | null
          created_at?: string | null
          description?: string | null
          furniture_styles?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          materials?: string[] | null
          name: string
          user_id: string
        }
        Update: {
          colors?: string[] | null
          created_at?: string | null
          description?: string | null
          furniture_styles?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          materials?: string[] | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      cameras: {
        Row: {
          capture_height: number
          capture_width: number
          created_at: string
          fov_angle: number
          id: string
          name: string
          project_id: string
          room_id: string | null
          rotation: number
          updated_at: string
          user_id: string
          x_position: number
          y_position: number
        }
        Insert: {
          capture_height?: number
          capture_width?: number
          created_at?: string
          fov_angle?: number
          id?: string
          name?: string
          project_id: string
          room_id?: string | null
          rotation?: number
          updated_at?: string
          user_id: string
          x_position?: number
          y_position?: number
        }
        Update: {
          capture_height?: number
          capture_width?: number
          created_at?: string
          fov_angle?: number
          id?: string
          name?: string
          project_id?: string
          room_id?: string | null
          rotation?: number
          updated_at?: string
          user_id?: string
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "cameras_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cameras_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          project_id: string
          role: string
          room_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id: string
          role: string
          room_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          role?: string
          room_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_finishes: {
        Row: {
          category: string
          color_hex: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          name: string
          user_id: string
        }
        Insert: {
          category?: string
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          name: string
          user_id: string
        }
        Update: {
          category?: string
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_materials: {
        Row: {
          category: string
          color_hex: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_public: boolean | null
          name: string
          properties: Json | null
          share_token: string | null
          subcategory: string | null
          user_id: string
        }
        Insert: {
          category?: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_public?: boolean | null
          name: string
          properties?: Json | null
          share_token?: string | null
          subcategory?: string | null
          user_id: string
        }
        Update: {
          category?: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_public?: boolean | null
          name?: string
          properties?: Json | null
          share_token?: string | null
          subcategory?: string | null
          user_id?: string
        }
        Relationships: []
      }
      custom_products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          dimensions: Json | null
          id: string
          manufacturing: Json | null
          materials: Json | null
          name: string
          position_x: number | null
          position_y: number | null
          pricing: Json | null
          project_id: string | null
          render_id: string | null
          source_image_url: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          manufacturing?: Json | null
          materials?: Json | null
          name: string
          position_x?: number | null
          position_y?: number | null
          pricing?: Json | null
          project_id?: string | null
          render_id?: string | null
          source_image_url?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          manufacturing?: Json | null
          materials?: Json | null
          name?: string
          position_x?: number | null
          position_y?: number | null
          pricing?: Json | null
          project_id?: string | null
          render_id?: string | null
          source_image_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_products_render_id_fkey"
            columns: ["render_id"]
            isOneToOne: false
            referencedRelation: "renders"
            referencedColumns: ["id"]
          },
        ]
      }
      design_memory_settings: {
        Row: {
          auto_learn: boolean | null
          created_at: string | null
          id: string
          memory_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_learn?: boolean | null
          created_at?: string | null
          id?: string
          memory_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_learn?: boolean | null
          created_at?: string | null
          id?: string
          memory_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      design_preferences: {
        Row: {
          category: string
          created_at: string | null
          id: string
          last_used: string | null
          preference_key: string
          source: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          last_used?: string | null
          preference_key: string
          source?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          last_used?: string | null
          preference_key?: string
          source?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      layouts: {
        Row: {
          canvas_data: Json | null
          created_at: string | null
          id: string
          name: string | null
          project_id: string | null
          room_dimensions: Json | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          canvas_data?: Json | null
          created_at?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          room_dimensions?: Json | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          canvas_data?: Json | null
          created_at?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          room_dimensions?: Json | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "layouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      material_pricing: {
        Row: {
          base_rate: number
          created_at: string
          id: string
          is_active: boolean | null
          material_category: string
          material_name: string
          source: string | null
          supplier_name: string | null
          tier: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          material_category: string
          material_name: string
          source?: string | null
          supplier_name?: string | null
          tier?: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          material_category?: string
          material_name?: string
          source?: string | null
          supplier_name?: string | null
          tier?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_board_products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          linked_catalog_id: string | null
          mood_board_id: string | null
          name: string
          placement_instruction: string | null
          placement_zone: string | null
          position_in_layout: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          linked_catalog_id?: string | null
          mood_board_id?: string | null
          name: string
          placement_instruction?: string | null
          placement_zone?: string | null
          position_in_layout?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          linked_catalog_id?: string | null
          mood_board_id?: string | null
          name?: string
          placement_instruction?: string | null
          placement_zone?: string | null
          position_in_layout?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_board_products_mood_board_id_fkey"
            columns: ["mood_board_id"]
            isOneToOne: false
            referencedRelation: "mood_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_boards: {
        Row: {
          analysis: Json | null
          created_at: string | null
          extracted_products: Json | null
          extracted_styles: Json | null
          file_name: string
          file_type: string | null
          file_url: string
          floor_plan_url: string | null
          id: string
          placement_instructions: Json | null
          project_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string | null
          extracted_products?: Json | null
          extracted_styles?: Json | null
          file_name: string
          file_type?: string | null
          file_url: string
          floor_plan_url?: string | null
          id?: string
          placement_instructions?: Json | null
          project_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string | null
          extracted_products?: Json | null
          extracted_styles?: Json | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          floor_plan_url?: string | null
          id?: string
          placement_instructions?: Json | null
          project_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_boards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          catalog_item_id: string | null
          created_at: string
          id: string
          item_category: string | null
          item_image_url: string | null
          item_name: string
          item_price: number
          order_id: string
          vendor_id: string | null
          vendor_product_id: string | null
        }
        Insert: {
          catalog_item_id?: string | null
          created_at?: string
          id?: string
          item_category?: string | null
          item_image_url?: string | null
          item_name: string
          item_price?: number
          order_id: string
          vendor_id?: string | null
          vendor_product_id?: string | null
        }
        Update: {
          catalog_item_id?: string | null
          created_at?: string
          id?: string
          item_category?: string | null
          item_image_url?: string | null
          item_name?: string
          item_price?: number
          order_id?: string
          vendor_id?: string | null
          vendor_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_product_id_fkey"
            columns: ["vendor_product_id"]
            isOneToOne: false
            referencedRelation: "vendor_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string | null
          commission: number
          created_at: string
          grand_total: number
          id: string
          invoice_number: string | null
          notes: string | null
          project_id: string
          status: string
          subtotal: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          commission?: number
          created_at?: string
          grand_total?: number
          id?: string
          invoice_number?: string | null
          notes?: string | null
          project_id: string
          status?: string
          subtotal?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          commission?: number
          created_at?: string
          grand_total?: number
          id?: string
          invoice_number?: string | null
          notes?: string | null
          project_id?: string
          status?: string
          subtotal?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      product_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          product_url: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          product_url?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          product_url?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          ai_confidence: number | null
          base_price: number
          catalog_item_id: string | null
          created_at: string
          custom_product_id: string | null
          dimensions: Json | null
          final_price: number
          finish_id: string | null
          finish_name: string | null
          id: string
          item_category: string | null
          item_description: string | null
          item_image_url: string | null
          item_name: string
          item_type: string
          material_category: string | null
          material_id: string | null
          material_name: string | null
          material_upcharge: number
          position_x: number | null
          position_y: number | null
          quantity: number
          quote_version_id: string
          vendor_product_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          base_price?: number
          catalog_item_id?: string | null
          created_at?: string
          custom_product_id?: string | null
          dimensions?: Json | null
          final_price?: number
          finish_id?: string | null
          finish_name?: string | null
          id?: string
          item_category?: string | null
          item_description?: string | null
          item_image_url?: string | null
          item_name: string
          item_type?: string
          material_category?: string | null
          material_id?: string | null
          material_name?: string | null
          material_upcharge?: number
          position_x?: number | null
          position_y?: number | null
          quantity?: number
          quote_version_id: string
          vendor_product_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          base_price?: number
          catalog_item_id?: string | null
          created_at?: string
          custom_product_id?: string | null
          dimensions?: Json | null
          final_price?: number
          finish_id?: string | null
          finish_name?: string | null
          id?: string
          item_category?: string | null
          item_description?: string | null
          item_image_url?: string | null
          item_name?: string
          item_type?: string
          material_category?: string | null
          material_id?: string | null
          material_name?: string | null
          material_upcharge?: number
          position_x?: number | null
          position_y?: number | null
          quantity?: number
          quote_version_id?: string
          vendor_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_version_id_fkey"
            columns: ["quote_version_id"]
            isOneToOne: false
            referencedRelation: "quote_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_vendor_product_id_fkey"
            columns: ["vendor_product_id"]
            isOneToOne: false
            referencedRelation: "vendor_products"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_versions: {
        Row: {
          commission: number
          created_at: string
          grand_total: number
          id: string
          is_recommended: boolean | null
          quote_id: string
          subtotal: number
          tier_level: number
          version_name: string
        }
        Insert: {
          commission?: number
          created_at?: string
          grand_total?: number
          id?: string
          is_recommended?: boolean | null
          quote_id: string
          subtotal?: number
          tier_level?: number
          version_name: string
        }
        Update: {
          commission?: number
          created_at?: string
          grand_total?: number
          id?: string
          is_recommended?: boolean | null
          quote_id?: string
          subtotal?: number
          tier_level?: number
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          id: string
          notes: string | null
          project_id: string | null
          quote_number: string
          quote_type: string
          room_id: string | null
          source_layout_url: string | null
          source_render_url: string | null
          status: string
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          quote_number: string
          quote_type?: string
          room_id?: string | null
          source_layout_url?: string | null
          source_render_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          quote_number?: string
          quote_type?: string
          room_id?: string | null
          source_layout_url?: string | null
          source_render_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      renders: {
        Row: {
          created_at: string
          id: string
          parent_render_id: string | null
          project_id: string
          prompt: string
          render_url: string | null
          room_id: string | null
          room_upload_id: string | null
          status: string
          user_id: string
          view_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          parent_render_id?: string | null
          project_id: string
          prompt: string
          render_url?: string | null
          room_id?: string | null
          room_upload_id?: string | null
          status?: string
          user_id: string
          view_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          parent_render_id?: string | null
          project_id?: string
          prompt?: string
          render_url?: string | null
          room_id?: string | null
          room_upload_id?: string | null
          status?: string
          user_id?: string
          view_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renders_parent_render_id_fkey"
            columns: ["parent_render_id"]
            isOneToOne: false
            referencedRelation: "renders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renders_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renders_room_upload_id_fkey"
            columns: ["room_upload_id"]
            isOneToOne: false
            referencedRelation: "room_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      room_geometry: {
        Row: {
          camera_matrix: Json
          control_signals: Json | null
          created_at: string | null
          floor_polygon: Json
          furniture_anchors: Json
          geometry_data: Json
          id: string
          layout_hash: string
          project_id: string | null
          room_id: string | null
          updated_at: string | null
          user_id: string
          wall_normals: Json
        }
        Insert: {
          camera_matrix?: Json
          control_signals?: Json | null
          created_at?: string | null
          floor_polygon?: Json
          furniture_anchors?: Json
          geometry_data?: Json
          id?: string
          layout_hash: string
          project_id?: string | null
          room_id?: string | null
          updated_at?: string | null
          user_id: string
          wall_normals?: Json
        }
        Update: {
          camera_matrix?: Json
          control_signals?: Json | null
          created_at?: string | null
          floor_polygon?: Json
          furniture_anchors?: Json
          geometry_data?: Json
          id?: string
          layout_hash?: string
          project_id?: string | null
          room_id?: string | null
          updated_at?: string | null
          user_id?: string
          wall_normals?: Json
        }
        Relationships: [
          {
            foreignKeyName: "room_geometry_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_geometry_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_uploads: {
        Row: {
          analysis_result: Json | null
          analysis_status: string
          created_at: string
          file_name: string
          file_url: string
          id: string
          project_id: string
          room_id: string | null
          upload_type: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          analysis_status?: string
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          project_id: string
          room_id?: string | null
          upload_type?: string
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          analysis_status?: string
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          project_id?: string
          room_id?: string | null
          upload_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_uploads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_uploads_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          is_locked: boolean
          locked_at: string | null
          locked_render_url: string | null
          name: string
          project_id: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_render_url?: string | null
          name?: string
          project_id: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_render_url?: string | null
          name?: string
          project_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_products: {
        Row: {
          allow_copy: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_public: boolean | null
          product_id: string
          share_token: string
          shared_by_user_id: string
          shared_with_user_id: string | null
        }
        Insert: {
          allow_copy?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          product_id: string
          share_token: string
          shared_by_user_id: string
          shared_with_user_id?: string | null
        }
        Update: {
          allow_copy?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          product_id?: string
          share_token?: string
          shared_by_user_id?: string
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "staged_furniture"
            referencedColumns: ["id"]
          },
        ]
      }
      staged_furniture: {
        Row: {
          catalog_item_id: string
          created_at: string
          height_percent: number | null
          id: string
          is_public: boolean | null
          item_category: string
          item_description: string | null
          item_image_url: string | null
          item_name: string
          item_price: number | null
          project_id: string
          render_id: string | null
          room_id: string | null
          share_token: string | null
          shared_at: string | null
          user_id: string
          width_percent: number | null
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          height_percent?: number | null
          id?: string
          is_public?: boolean | null
          item_category: string
          item_description?: string | null
          item_image_url?: string | null
          item_name: string
          item_price?: number | null
          project_id: string
          render_id?: string | null
          room_id?: string | null
          share_token?: string | null
          shared_at?: string | null
          user_id: string
          width_percent?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          height_percent?: number | null
          id?: string
          is_public?: boolean | null
          item_category?: string
          item_description?: string | null
          item_image_url?: string | null
          item_name?: string
          item_price?: number | null
          project_id?: string
          render_id?: string | null
          room_id?: string | null
          share_token?: string | null
          shared_at?: string | null
          user_id?: string
          width_percent?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staged_furniture_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staged_furniture_render_id_fkey"
            columns: ["render_id"]
            isOneToOne: false
            referencedRelation: "renders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staged_furniture_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      staging_zones: {
        Row: {
          camera_angle: number | null
          camera_position: string | null
          created_at: string
          id: string
          layout_reference_url: string | null
          name: string
          polygon_points: Json | null
          project_id: string
          room_id: string | null
          thumbnail_url: string | null
          user_id: string
          x_end: number
          x_start: number
          y_end: number
          y_start: number
        }
        Insert: {
          camera_angle?: number | null
          camera_position?: string | null
          created_at?: string
          id?: string
          layout_reference_url?: string | null
          name?: string
          polygon_points?: Json | null
          project_id: string
          room_id?: string | null
          thumbnail_url?: string | null
          user_id: string
          x_end: number
          x_start: number
          y_end: number
          y_start: number
        }
        Update: {
          camera_angle?: number | null
          camera_position?: string | null
          created_at?: string
          id?: string
          layout_reference_url?: string | null
          name?: string
          polygon_points?: Json | null
          project_id?: string
          room_id?: string | null
          thumbnail_url?: string | null
          user_id?: string
          x_end?: number
          x_start?: number
          y_end?: number
          y_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "staging_zones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staging_zones_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      style_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_url: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_product_photos: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          photo_type: string
          product_id: string | null
          template_name: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          photo_type: string
          product_id?: string | null
          template_name: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          photo_type?: string
          product_id?: string | null
          template_name?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_product_photos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vendor_products"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          sku: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          sku?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          sku?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_requests: {
        Row: {
          bom_data: Json | null
          created_at: string
          deadline: string | null
          furniture_description: string | null
          furniture_image_url: string | null
          furniture_name: string
          id: string
          notes: string | null
          quantity: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bom_data?: Json | null
          created_at?: string
          deadline?: string | null
          furniture_description?: string | null
          furniture_image_url?: string | null
          furniture_name: string
          id?: string
          notes?: string | null
          quantity?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bom_data?: Json | null
          created_at?: string
          deadline?: string | null
          furniture_description?: string | null
          furniture_image_url?: string | null
          furniture_name?: string
          id?: string
          notes?: string | null
          quantity?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "vendor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "vendor"],
    },
  },
} as const
