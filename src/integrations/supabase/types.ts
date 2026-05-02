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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_findings: {
        Row: {
          bill_id: string
          created_at: string
          description: string | null
          estimated_savings: number | null
          id: string
          kind: Database["public"]["Enums"]["finding_kind"]
          recommended_action: string | null
          severity: Database["public"]["Enums"]["finding_severity"]
          title: string
          user_id: string
        }
        Insert: {
          bill_id: string
          created_at?: string
          description?: string | null
          estimated_savings?: number | null
          id?: string
          kind: Database["public"]["Enums"]["finding_kind"]
          recommended_action?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          title: string
          user_id: string
        }
        Update: {
          bill_id?: string
          created_at?: string
          description?: string | null
          estimated_savings?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["finding_kind"]
          recommended_action?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_items: {
        Row: {
          amount: number | null
          bill_id: string
          category: string | null
          created_at: string
          description: string
          fair_price: number | null
          id: string
          is_overcharged: boolean | null
          notes: string | null
          overcharge: number | null
          quantity: number | null
          unit_price: number | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          bill_id: string
          category?: string | null
          created_at?: string
          description: string
          fair_price?: number | null
          id?: string
          is_overcharged?: boolean | null
          notes?: string | null
          overcharge?: number | null
          quantity?: number | null
          unit_price?: number | null
          user_id: string
        }
        Update: {
          amount?: number | null
          bill_id?: string
          category?: string | null
          created_at?: string
          description?: string
          fair_price?: number | null
          id?: string
          is_overcharged?: boolean | null
          notes?: string | null
          overcharge?: number | null
          quantity?: number | null
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          audit_raw: Json | null
          audit_summary: string | null
          bill_date: string | null
          bill_number: string | null
          created_at: string
          error_message: string | null
          file_mime: string | null
          file_path: string
          hospital_name: string | null
          id: string
          language: string
          patient_name: string | null
          potential_savings: number | null
          status: Database["public"]["Enums"]["bill_status"]
          total_billed: number | null
          total_fair: number | null
          total_overcharge: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audit_raw?: Json | null
          audit_summary?: string | null
          bill_date?: string | null
          bill_number?: string | null
          created_at?: string
          error_message?: string | null
          file_mime?: string | null
          file_path: string
          hospital_name?: string | null
          id?: string
          language?: string
          patient_name?: string | null
          potential_savings?: number | null
          status?: Database["public"]["Enums"]["bill_status"]
          total_billed?: number | null
          total_fair?: number | null
          total_overcharge?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audit_raw?: Json | null
          audit_summary?: string | null
          bill_date?: string | null
          bill_number?: string | null
          created_at?: string
          error_message?: string | null
          file_mime?: string | null
          file_path?: string
          hospital_name?: string | null
          id?: string
          language?: string
          patient_name?: string | null
          potential_savings?: number | null
          status?: Database["public"]["Enums"]["bill_status"]
          total_billed?: number | null
          total_fair?: number | null
          total_overcharge?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          family_group_id: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family_group_id?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family_group_id?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bill_status: "uploaded" | "processing" | "audited" | "failed"
      finding_kind:
        | "overcharge"
        | "scheme_eligibility"
        | "duplicate"
        | "unnecessary"
        | "insurance"
        | "other"
      finding_severity: "info" | "low" | "medium" | "high"
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
      bill_status: ["uploaded", "processing", "audited", "failed"],
      finding_kind: [
        "overcharge",
        "scheme_eligibility",
        "duplicate",
        "unnecessary",
        "insurance",
        "other",
      ],
      finding_severity: ["info", "low", "medium", "high"],
    },
  },
} as const
