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
      allowed_emails: {
        Row: {
          cadastrado_por: string | null
          created_at: string | null
          email: string
          id: string
          nome: string
          usado: boolean | null
          usado_em: string | null
        }
        Insert: {
          cadastrado_por?: string | null
          created_at?: string | null
          email: string
          id?: string
          nome: string
          usado?: boolean | null
          usado_em?: string | null
        }
        Update: {
          cadastrado_por?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          usado?: boolean | null
          usado_em?: string | null
        }
        Relationships: []
      }
      atividades_gerais: {
        Row: {
          anexos: Json | null
          checklist: Json | null
          created_at: string
          created_by: string
          data_limite: string | null
          descricao: string | null
          id: string
          prioridade: string
          tipo: string
          titulo: string
          updated_at: string
          usuarios_destinatarios: string[] | null
        }
        Insert: {
          anexos?: Json | null
          checklist?: Json | null
          created_at?: string
          created_by: string
          data_limite?: string | null
          descricao?: string | null
          id?: string
          prioridade?: string
          tipo?: string
          titulo: string
          updated_at?: string
          usuarios_destinatarios?: string[] | null
        }
        Update: {
          anexos?: Json | null
          checklist?: Json | null
          created_at?: string
          created_by?: string
          data_limite?: string | null
          descricao?: string | null
          id?: string
          prioridade?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          usuarios_destinatarios?: string[] | null
        }
        Relationships: []
      }
      atividades_visualizadas: {
        Row: {
          atividade_id: string
          id: string
          user_id: string
          visualizada_em: string
        }
        Insert: {
          atividade_id: string
          id?: string
          user_id: string
          visualizada_em?: string
        }
        Update: {
          atividade_id?: string
          id?: string
          user_id?: string
          visualizada_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_visualizadas_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades_gerais"
            referencedColumns: ["id"]
          },
        ]
      }
      atualizacoes_lidas: {
        Row: {
          atualizacao_id: string
          id: string
          lida_em: string
          user_id: string
        }
        Insert: {
          atualizacao_id: string
          id?: string
          lida_em?: string
          user_id: string
        }
        Update: {
          atualizacao_id?: string
          id?: string
          lida_em?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atualizacoes_lidas_atualizacao_id_fkey"
            columns: ["atualizacao_id"]
            isOneToOne: false
            referencedRelation: "atualizacoes_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      atualizacoes_sistema: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          tipo: string
          titulo: string
          versao: string | null
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          created_by?: string | null
          id?: string
          tipo?: string
          titulo: string
          versao?: string | null
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          tipo?: string
          titulo?: string
          versao?: string | null
        }
        Relationships: []
      }
      aulas: {
        Row: {
          conteudo: string | null
          created_at: string
          descricao: string
          duracao: string | null
          id: string
          modulo_id: string
          ordem: number
          thumbnail_url: string | null
          titulo: string
          updated_at: string
          youtube_url: string
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          descricao: string
          duracao?: string | null
          id?: string
          modulo_id: string
          ordem?: number
          thumbnail_url?: string | null
          titulo: string
          updated_at?: string
          youtube_url: string
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          descricao?: string
          duracao?: string | null
          id?: string
          modulo_id?: string
          ordem?: number
          thumbnail_url?: string | null
          titulo?: string
          updated_at?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
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
      comentarios_aulas: {
        Row: {
          aula_id: string
          comentario: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aula_id: string
          comentario: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aula_id?: string
          comentario?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_aulas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicados: {
        Row: {
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          created_by?: string | null
          id?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicados_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comunicados_comentarios: {
        Row: {
          comentario: string
          comunicado_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comentario: string
          comunicado_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comentario?: string
          comunicado_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicados_comentarios_comunicado_id_fkey"
            columns: ["comunicado_id"]
            isOneToOne: false
            referencedRelation: "comunicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicados_comentarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comunicados_reacoes: {
        Row: {
          comunicado_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comunicado_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comunicado_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicados_reacoes_comunicado_id_fkey"
            columns: ["comunicado_id"]
            isOneToOne: false
            referencedRelation: "comunicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicados_reacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      controle_producao: {
        Row: {
          created_at: string
          data: string
          horas_trabalhadas: string
          id: string
          maiores_dificuldades: string | null
          mentorado: string
          plataformas: string
          quantidade_roteiros: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          horas_trabalhadas: string
          id?: string
          maiores_dificuldades?: string | null
          mentorado: string
          plataformas: string
          quantidade_roteiros: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          horas_trabalhadas?: string
          id?: string
          maiores_dificuldades?: string | null
          mentorado?: string
          plataformas?: string
          quantidade_roteiros?: string
          updated_at?: string
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
      entregas_mentorados: {
        Row: {
          concluida: boolean
          created_at: string
          data_entrega: string | null
          data_limite: string | null
          id: string
          mentorado_id: string
          numero_leva: number
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          data_entrega?: string | null
          data_limite?: string | null
          id?: string
          mentorado_id: string
          numero_leva: number
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          data_entrega?: string | null
          data_limite?: string | null
          id?: string
          mentorado_id?: string
          numero_leva?: number
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entregas_mentorados_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "mentorados"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_biblioteca_musicas: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          titulo: string
          updated_at: string
          youtube_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          titulo: string
          updated_at?: string
          youtube_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          titulo?: string
          updated_at?: string
          youtube_url?: string
        }
        Relationships: []
      }
      flow_notas: {
        Row: {
          conteudo: string | null
          cor: string | null
          created_at: string
          id: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flow_pomodoro_sessoes: {
        Row: {
          completada: boolean
          created_at: string
          duracao_minutos: number
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          completada?: boolean
          created_at?: string
          duracao_minutos: number
          id?: string
          tipo?: string
          user_id: string
        }
        Update: {
          completada?: boolean
          created_at?: string
          duracao_minutos?: number
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      flow_tarefas: {
        Row: {
          atividade_geral_id: string | null
          created_at: string
          data_limite: string | null
          descricao: string | null
          id: string
          ordem: number
          prioridade: string | null
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          atividade_geral_id?: string | null
          created_at?: string
          data_limite?: string | null
          descricao?: string | null
          id?: string
          ordem?: number
          prioridade?: string | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          atividade_geral_id?: string | null
          created_at?: string
          data_limite?: string | null
          descricao?: string | null
          id?: string
          ordem?: number
          prioridade?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_tarefas_atividade_geral_id_fkey"
            columns: ["atividade_geral_id"]
            isOneToOne: false
            referencedRelation: "atividades_gerais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_tarefas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      fotos_celebracao: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          url?: string
        }
        Relationships: []
      }
      grupos: {
        Row: {
          created_at: string | null
          created_by: string
          data_fim_meta: string | null
          data_inicio_meta: string | null
          descricao_meta: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          data_fim_meta?: string | null
          data_inicio_meta?: string | null
          descricao_meta?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          data_fim_meta?: string | null
          data_inicio_meta?: string | null
          descricao_meta?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      grupos_atividades: {
        Row: {
          concluida: boolean | null
          created_at: string | null
          created_by: string
          data_limite: string | null
          descricao: string | null
          grupo_id: string
          id: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          concluida?: boolean | null
          created_at?: string | null
          created_by: string
          data_limite?: string | null
          descricao?: string | null
          grupo_id: string
          id?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          concluida?: boolean | null
          created_at?: string | null
          created_by?: string
          data_limite?: string | null
          descricao?: string | null
          grupo_id?: string
          id?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grupos_atividades_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_membros: {
        Row: {
          apelido: string
          created_at: string | null
          grupo_id: string
          id: string
          user_id: string
        }
        Insert: {
          apelido: string
          created_at?: string | null
          grupo_id: string
          id?: string
          user_id: string
        }
        Update: {
          apelido?: string
          created_at?: string | null
          grupo_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_membros_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_mentorados: {
        Row: {
          created_at: string | null
          grupo_id: string
          id: string
          membro_id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          grupo_id: string
          id?: string
          membro_id: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          grupo_id?: string
          id?: string
          membro_id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grupos_mentorados_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_mentorados_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "grupos_membros"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_mentorados_tags: {
        Row: {
          created_at: string | null
          id: string
          mentorado_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentorado_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentorado_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_mentorados_tags_mentorado_id_fkey"
            columns: ["mentorado_id"]
            isOneToOne: false
            referencedRelation: "grupos_mentorados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_mentorados_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "grupos_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_tags: {
        Row: {
          cor: string
          created_at: string | null
          grupo_id: string
          id: string
          nome: string
        }
        Insert: {
          cor?: string
          created_at?: string | null
          grupo_id: string
          id?: string
          nome: string
        }
        Update: {
          cor?: string
          created_at?: string | null
          grupo_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_tags_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
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
      headlines_criadas: {
        Row: {
          created_at: string | null
          estrutura_base: string | null
          headline: string
          id: string
          nicho_id: string | null
          progresso_id: string | null
          roteiro_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          estrutura_base?: string | null
          headline: string
          id?: string
          nicho_id?: string | null
          progresso_id?: string | null
          roteiro_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          estrutura_base?: string | null
          headline?: string
          id?: string
          nicho_id?: string | null
          progresso_id?: string | null
          roteiro_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "headlines_criadas_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "headlines_criadas_progresso_id_fkey"
            columns: ["progresso_id"]
            isOneToOne: false
            referencedRelation: "progresso_roteiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "headlines_criadas_roteiro_id_fkey"
            columns: ["roteiro_id"]
            isOneToOne: false
            referencedRelation: "roteiros"
            referencedColumns: ["id"]
          },
        ]
      }
      ideias_melhorias: {
        Row: {
          concluida: boolean
          created_at: string
          data_conclusao: string | null
          feedback: string
          id: string
          imagens: string[] | null
          nome: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          data_conclusao?: string | null
          feedback: string
          id?: string
          imagens?: string[] | null
          nome: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          concluida?: boolean
          created_at?: string
          data_conclusao?: string | null
          feedback?: string
          id?: string
          imagens?: string[] | null
          nome?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
          instagram: string | null
          link_drive: string | null
          links_chats: string | null
          nome: string
          objecoes: string | null
          observacoes: string | null
          plano: string | null
          referencias: string | null
          roteiros: string | null
          updated_at: string
          user_id: string
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
          instagram?: string | null
          link_drive?: string | null
          links_chats?: string | null
          nome: string
          objecoes?: string | null
          observacoes?: string | null
          plano?: string | null
          referencias?: string | null
          roteiros?: string | null
          updated_at?: string
          user_id: string
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
          instagram?: string | null
          link_drive?: string | null
          links_chats?: string | null
          nome?: string
          objecoes?: string | null
          observacoes?: string | null
          plano?: string | null
          referencias?: string | null
          roteiros?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentorados_controle: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      modulos: {
        Row: {
          created_at: string
          id: string
          ordem: number
          titulo: string
          treinamento_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordem?: number
          titulo: string
          treinamento_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ordem?: number
          titulo?: string
          treinamento_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulos_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
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
          ativo: boolean
          avatar: string | null
          cargo: Database["public"]["Enums"]["cargo_type"] | null
          created_at: string
          id: string
          nome: string
          pdi: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          avatar?: string | null
          cargo?: Database["public"]["Enums"]["cargo_type"] | null
          created_at?: string
          id: string
          nome: string
          pdi?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          avatar?: string | null
          cargo?: Database["public"]["Enums"]["cargo_type"] | null
          created_at?: string
          id?: string
          nome?: string
          pdi?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progresso_aulas: {
        Row: {
          aula_id: string
          concluido: boolean
          created_at: string
          data_conclusao: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aula_id: string
          concluido?: boolean
          created_at?: string
          data_conclusao?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aula_id?: string
          concluido?: boolean
          created_at?: string
          data_conclusao?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_aulas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_roteiros: {
        Row: {
          carga_cognitiva: number | null
          completado: boolean
          created_at: string
          data_completado: string | null
          estrutura_invisivel: string | null
          estrutura_roteiro: string | null
          gatilhos_atencao: string | null
          id: string
          melhorias_potencial: string | null
          o_que_tornou_viral: string | null
          roteiro_id: string
          sublinhados: Json | null
          user_id: string
        }
        Insert: {
          carga_cognitiva?: number | null
          completado?: boolean
          created_at?: string
          data_completado?: string | null
          estrutura_invisivel?: string | null
          estrutura_roteiro?: string | null
          gatilhos_atencao?: string | null
          id?: string
          melhorias_potencial?: string | null
          o_que_tornou_viral?: string | null
          roteiro_id: string
          sublinhados?: Json | null
          user_id: string
        }
        Update: {
          carga_cognitiva?: number | null
          completado?: boolean
          created_at?: string
          data_completado?: string | null
          estrutura_invisivel?: string | null
          estrutura_roteiro?: string | null
          gatilhos_atencao?: string | null
          id?: string
          melhorias_potencial?: string | null
          o_que_tornou_viral?: string | null
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
          {
            foreignKeyName: "progresso_roteiros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      prompts: {
        Row: {
          comentarios: string | null
          conteudo: string
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          nicho: string
          titulo: string
          updated_at: string
          youtube_url: string
        }
        Insert: {
          comentarios?: string | null
          conteudo: string
          created_at?: string
          created_by?: string | null
          descricao: string
          id?: string
          nicho: string
          titulo: string
          updated_at?: string
          youtube_url: string
        }
        Update: {
          comentarios?: string | null
          conteudo?: string
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          nicho?: string
          titulo?: string
          updated_at?: string
          youtube_url?: string
        }
        Relationships: []
      }
      roteiros: {
        Row: {
          conteudo: string
          created_at: string
          criador_conteudo: string | null
          id: string
          is_private: boolean
          link_video: string | null
          nicho_id: string | null
          ordem: number
          titulo: string
          updated_at: string
          user_id: string | null
          visualizacoes: string | null
        }
        Insert: {
          conteudo: string
          created_at?: string
          criador_conteudo?: string | null
          id?: string
          is_private?: boolean
          link_video?: string | null
          nicho_id?: string | null
          ordem?: number
          titulo: string
          updated_at?: string
          user_id?: string | null
          visualizacoes?: string | null
        }
        Update: {
          conteudo?: string
          created_at?: string
          criador_conteudo?: string | null
          id?: string
          is_private?: boolean
          link_video?: string | null
          nicho_id?: string | null
          ordem?: number
          titulo?: string
          updated_at?: string
          user_id?: string | null
          visualizacoes?: string | null
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
      treinamentos: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          ordem: number
          thumbnail_url: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao: string
          id?: string
          ordem?: number
          thumbnail_url?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          ordem?: number
          thumbnail_url?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      trello_imports: {
        Row: {
          created_at: string
          created_by: string | null
          dados: Json
          id: string
          nome_arquivo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dados?: Json
          id?: string
          nome_arquivo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dados?: Json
          id?: string
          nome_arquivo?: string
          updated_at?: string
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
      is_user_active: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      cargo_type: "junior" | "pleno" | "senior"
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
      cargo_type: ["junior", "pleno", "senior"],
    },
  },
} as const
