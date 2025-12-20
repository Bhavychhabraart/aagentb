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
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          role?: string
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
        ]
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
      renders: {
        Row: {
          created_at: string
          id: string
          parent_render_id: string | null
          project_id: string
          prompt: string
          render_url: string | null
          room_upload_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_render_id?: string | null
          project_id: string
          prompt: string
          render_url?: string | null
          room_upload_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_render_id?: string | null
          project_id?: string
          prompt?: string
          render_url?: string | null
          room_upload_id?: string | null
          status?: string
          user_id?: string
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
            foreignKeyName: "renders_room_upload_id_fkey"
            columns: ["room_upload_id"]
            isOneToOne: false
            referencedRelation: "room_uploads"
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
        ]
      }
      staged_furniture: {
        Row: {
          catalog_item_id: string
          created_at: string
          id: string
          item_category: string
          item_description: string | null
          item_image_url: string | null
          item_name: string
          item_price: number | null
          project_id: string
          user_id: string
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          id?: string
          item_category: string
          item_description?: string | null
          item_image_url?: string | null
          item_name: string
          item_price?: number | null
          project_id: string
          user_id: string
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          id?: string
          item_category?: string
          item_description?: string | null
          item_image_url?: string | null
          item_name?: string
          item_price?: number | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staged_furniture_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
