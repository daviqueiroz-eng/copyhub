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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          key: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      cores_analise: {
        Row: {
          cor: string
          created_at: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          cor: string
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      headlines: {
        Row: {
          category_key: string
          created_at: string
          estrutura: string | null
          gatilhos: string | null
          headline: string
          id: string
          referencia: string | null
          updated_at: string
        }
        Insert: {
          category_key: string
          created_at?: string
          estrutura?: string | null
          gatilhos?: string | null
          headline: string
          id?: string
          referencia?: string | null
          updated_at?: string
        }
        Update: {
          category_key?: string
          created_at?: string
          estrutura?: string | null
          gatilhos?: string | null
          headline?: string
          id?: string
          referencia?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "headlines_category_key_fkey"
            columns: ["category_key"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["key"]
          },
        ]
      }
      medalhas: {
        Row: {
          created_at: string
          descricao: string
          icone: string
          id: string
          nome: string
          ordem: number
          roteiros_necessarios: number
        }
        Insert: {
          created_at?: string
          descricao: string
          icone: string
          id?: string
          nome: string
          ordem?: number
          roteiros_necessarios: number
        }
        Update: {
          created_at?: string
          descricao?: string
          icone?: string
          id?: string
          nome?: string
          ordem?: number
          roteiros_necessarios?: number
        }
        Relationships: []
      }
      medalhas_usuarios: {
        Row: {
          created_at: string
          desbloqueada_em: string
          id: string
          medalha_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          desbloqueada_em?: string
          id?: string
          medalha_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          desbloqueada_em?: string
          id?: string
          medalha_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medalhas_usuarios_medalha_id_fkey"
            columns: ["medalha_id"]
            isOneToOne: false
            referencedRelation: "medalhas"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorados: {
        Row: {
          avatar: string | null
          created_at: string
          crencas: string | null
          desejos: string | null
          dores: string | null
          estilo_comum: string | null
          id: string
          iniciais: string
          link_drive: string | null
          links_chats: string | null
          nome: string
          objecoes: string | null
          observacoes: string | null
          plano: string | null
          referencias: string | null
          roteiros: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          crencas?: string | null
          desejos?: string | null
          dores?: string | null
          estilo_comum?: string | null
          id?: string
          iniciais: string
          link_drive?: string | null
          links_chats?: string | null
          nome: string
          objecoes?: string | null
          observacoes?: string | null
          plano?: string | null
          referencias?: string | null
          roteiros?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          crencas?: string | null
          desejos?: string | null
          dores?: string | null
          estilo_comum?: string | null
          id?: string
          iniciais?: string
          link_drive?: string | null
          links_chats?: string | null
          nome?: string
          objecoes?: string | null
          observacoes?: string | null
          plano?: string | null
          referencias?: string | null
          roteiros?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nichos: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      planilhas: {
        Row: {
          created_at: string
          id: string
          link: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          link: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          id: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progresso_roteiros: {
        Row: {
          completado: boolean
          created_at: string
          data_completado: string | null
          estrutura_invisivel: string | null
          estrutura_roteiro: string | null
          gatilhos_atencao: string | null
          id: string
          roteiro_id: string
          sublinhados: Json | null
          user_id: string
        }
        Insert: {
          completado?: boolean
          created_at?: string
          data_completado?: string | null
          estrutura_invisivel?: string | null
          estrutura_roteiro?: string | null
          gatilhos_atencao?: string | null
          id?: string
          roteiro_id: string
          sublinhados?: Json | null
          user_id: string
        }
        Update: {
          completado?: boolean
          created_at?: string
          data_completado?: string | null
          estrutura_invisivel?: string | null
          estrutura_roteiro?: string | null
          gatilhos_atencao?: string | null
          id?: string
          roteiro_id?: string
          sublinhados?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_roteiros_roteiro_id_fkey"
            columns: ["roteiro_id"]
            isOneToOne: false
            referencedRelation: "roteiros"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiros: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          link_video: string | null
          nicho_id: string | null
          ordem: number
          titulo: string
          updated_at: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          id?: string
          link_video?: string | null
          nicho_id?: string | null
          ordem?: number
          titulo: string
          updated_at?: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          link_video?: string | null
          nicho_id?: string | null
          ordem?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roteiros_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      sublinhados_corretos: {
        Row: {
          cor_id: string
          created_at: string
          id: string
          posicao_fim: number
          posicao_inicio: number
          roteiro_id: string
          texto_sublinhado: string
        }
        Insert: {
          cor_id: string
          created_at?: string
          id?: string
          posicao_fim: number
          posicao_inicio: number
          roteiro_id: string
          texto_sublinhado: string
        }
        Update: {
          cor_id?: string
          created_at?: string
          id?: string
          posicao_fim?: number
          posicao_inicio?: number
          roteiro_id?: string
          texto_sublinhado?: string
        }
        Relationships: [
          {
            foreignKeyName: "sublinhados_corretos_cor_id_fkey"
            columns: ["cor_id"]
            isOneToOne: false
            referencedRelation: "cores_analise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sublinhados_corretos_roteiro_id_fkey"
            columns: ["roteiro_id"]
            isOneToOne: false
            referencedRelation: "roteiros"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
