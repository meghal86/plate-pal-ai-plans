export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      families: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          family_id: string
          id: string
          invited_at: string | null
          invited_by: string | null
          role: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          family_id: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          family_id?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      kids_growth_records: {
        Row: {
          bmi: number | null
          created_at: string | null
          height_cm: number | null
          id: string
          kid_id: string | null
          notes: string | null
          recorded_at: string | null
          recorded_by: string | null
          weight_kg: number | null
        }
        Insert: {
          bmi?: number | null
          created_at?: string | null
          height_cm?: number | null
          id?: string
          kid_id?: string | null
          notes?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          weight_kg?: number | null
        }
        Update: {
          bmi?: number | null
          created_at?: string | null
          height_cm?: number | null
          id?: string
          kid_id?: string | null
          notes?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kids_growth_records_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_nutrition_logs: {
        Row: {
          calcium_mg: number | null
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          date: string
          fat_g: number | null
          id: string
          iron_mg: number | null
          kid_id: string | null
          logged_by: string | null
          meal_type: string
          notes: string | null
          protein_g: number | null
        }
        Insert: {
          calcium_mg?: number | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          date: string
          fat_g?: number | null
          id?: string
          iron_mg?: number | null
          kid_id?: string | null
          logged_by?: string | null
          meal_type: string
          notes?: string | null
          protein_g?: number | null
        }
        Update: {
          calcium_mg?: number | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          date?: string
          fat_g?: number | null
          id?: string
          iron_mg?: number | null
          kid_id?: string | null
          logged_by?: string | null
          meal_type?: string
          notes?: string | null
          protein_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kids_nutrition_logs_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_profiles: {
        Row: {
          age: number
          allergies: string[] | null
          birth_date: string | null
          created_at: string | null
          created_by: string | null
          dietary_restrictions: string[] | null
          disliked_foods: string[] | null
          family_id: string | null
          favorite_foods: string[] | null
          gender: string | null
          height_cm: number | null
          id: string
          name: string
          preferences: Json | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          age: number
          allergies?: string[] | null
          birth_date?: string | null
          created_at?: string | null
          created_by?: string | null
          dietary_restrictions?: string[] | null
          disliked_foods?: string[] | null
          family_id?: string | null
          favorite_foods?: string[] | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          name: string
          preferences?: Json | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          age?: number
          allergies?: string[] | null
          birth_date?: string | null
          created_at?: string | null
          created_by?: string | null
          dietary_restrictions?: string[] | null
          disliked_foods?: string[] | null
          family_id?: string | null
          favorite_foods?: string[] | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          name?: string
          preferences?: Json | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kids_profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string | null
          diet_plan_id: string
          id: string
          ingredients: string[] | null
          is_completed: boolean | null
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string
          notes: string | null
          scheduled_date: string
          scheduled_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          diet_plan_id: string
          id?: string
          ingredients?: string[] | null
          is_completed?: boolean | null
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string
          notes?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          diet_plan_id?: string
          id?: string
          ingredients?: string[] | null
          is_completed?: boolean | null
          meal_type?: Database["public"]["Enums"]["meal_type"]
          name?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nutrition_plans: {
        Row: {
          calories: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          embedding: string | null
          id: string
          is_active: boolean | null
          plan_content: Json | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calories?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          plan_content?: Json | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calories?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          plan_content?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          cook_time: number | null
          created_at: string | null
          difficulty: Database["public"]["Enums"]["recipe_difficulty"] | null
          id: string
          ingredients: string[] | null
          instructions: string[] | null
          meal_id: string
          nutrition_info: Json | null
          prep_time: number | null
          servings: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cook_time?: number | null
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["recipe_difficulty"] | null
          id?: string
          ingredients?: string[] | null
          instructions?: string[] | null
          meal_id: string
          nutrition_info?: Json | null
          prep_time?: number | null
          servings?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cook_time?: number | null
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["recipe_difficulty"] | null
          id?: string
          ingredients?: string[] | null
          instructions?: string[] | null
          meal_id?: string
          nutrition_info?: Json | null
          prep_time?: number | null
          servings?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          is_shared: boolean | null
          items: Json | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          is_shared?: boolean | null
          items?: Json | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          is_shared?: boolean | null
          items?: Json | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      uploaded_files: {
        Row: {
          created_at: string | null
          file_type: string | null
          file_url: string
          filename: string
          id: string
          plan_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          file_url: string
          filename: string
          id?: string
          plan_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          filename?: string
          id?: string
          plan_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          created_at: string | null
          dietary_restrictions: string | null
          email: string | null
          family_id: string | null
          full_name: string | null
          health_goals: string | null
          height: number | null
          id: string
          updated_at: string | null
          user_id: string | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          created_at?: string | null
          dietary_restrictions?: string | null
          email?: string | null
          family_id?: string | null
          full_name?: string | null
          health_goals?: string | null
          height?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          created_at?: string | null
          dietary_restrictions?: string | null
          email?: string | null
          family_id?: string | null
          full_name?: string | null
          health_goals?: string | null
          height?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      find_similar_plans: {
        Args: {
          plan_id: string
          user_id: string
          similarity_threshold?: number
          limit_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          duration: string
          calories: string
          similarity: number
        }[]
      }
      generate_plan_embedding: {
        Args: { plan_content: Json }
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      search_plans_by_similarity: {
        Args: {
          search_query: string
          user_id: string
          similarity_threshold?: number
          limit_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          duration: string
          calories: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      family_role: "admin" | "member"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      recipe_difficulty: "easy" | "medium" | "hard"
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
      family_role: ["admin", "member"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      recipe_difficulty: ["easy", "medium", "hard"],
    },
  },
} as const
