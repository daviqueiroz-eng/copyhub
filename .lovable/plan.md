

## Plano: Sistema de Ajuste Fino para Revisão de Roteiros

### Visão Geral

Criar um novo modo "Ajuste fino" no painel de revisão de roteiros, com:
- Alternância entre "Chat de Revisão" e "Ajuste fino" 
- Cadastro de tipos de ajustes personalizados
- Seleção múltipla de ajustes
- Campo de instrução livre
- Disparo para webhook n8n dedicado

---

### Interface Visual

```text
╔════════════════════════════════════════════════════════════════════╗
║  × Roteiro 1/1  (Davi teste - Guia 1)             [Undo] [Redo] →  ║
╠════════════════════════════════════════════════════════════════════╣
║                                    ║                               ║
║  HEADLINE 01:                      ║  [Chat de Revisão][Ajuste fino]║
║  faça essas 3 coisas se quiser...  ║                               ║
║                                    ║  ┌──────────────────────────┐ ║
║  ESTRUTURA 01:                     ║  │ ☑ falta valor prático    │ ║
║  faça essas 3 coisas se quiser...  ║  │ ☐ Precisa de mais        │ ║
║                                    ║  │   mistério               │ ║
║  Você já parou para pensar que...  ║  │ ☐ Mais exemplos          │ ║
║                                    ║  └──────────────────────────┘ ║
║  A primeira coisa é usar a técnica ║                               ║
║  do "tempo invisível"...           ║       [+ cadastrar]           ║
║                                    ║                               ║
║                                    ║  ┌────────────────────────┐   ║
║                                    ║  │ Digite sua instrução...│ ▶ ║
║                                    ║  └────────────────────────┘   ║
║                                    ║                               ║
╚════════════════════════════════════════════════════════════════════╝
```

---

### Estrutura de Dados

#### Nova Tabela: `tipos_ajuste`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| nome | text | Nome do ajuste (ex: "falta valor prático") |
| descricao | text | Descrição ou instrução adicional |
| instrucoes | text | Instruções detalhadas para a IA |
| user_id | uuid | FK para auth.users |
| created_at | timestamp | Data de criação |

---

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useTiposAjuste.ts` | Hook para CRUD de tipos de ajuste |
| `supabase/functions/n8n-ajustes/index.ts` | Edge Function proxy para webhook de ajustes |

---

### Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/mentorados/RoteiroRevisaoDialog.tsx` | Adicionar alternância de modos (chat vs ajuste fino), painel de ajustes com seleção múltipla |
| `supabase/config.toml` | Registrar nova edge function `n8n-ajustes` |

---

### Detalhes Técnicos

#### 1. Migração do Banco de Dados

Criar tabela `tipos_ajuste` com RLS habilitado para que cada usuário veja apenas seus próprios tipos de ajuste.

#### 2. Hook `useTiposAjuste`

Similar ao `useTiposRoteiro`, com operações:
- `useTiposAjuste()` - listar todos
- `useCreateTipoAjuste()` - criar novo
- `useUpdateTipoAjuste()` - editar
- `useDeleteTipoAjuste()` - remover

#### 3. Edge Function `n8n-ajustes`

Proxy que envia payload para `https://madarawin.app.n8n.cloud/webhook/agente-ia-lovable-ajustes` contendo:
- `headline`: texto da headline atual
- `estrutura`: texto da estrutura atual
- `ajustes`: array com os ajustes selecionados (nome + instruções)
- `instrucao_livre`: texto digitado pelo usuário
- `selecao`: trecho selecionado (se houver)

#### 4. Componente de Ajuste Fino

No `RoteiroRevisaoDialog`:
- Tabs para alternar entre "Chat de Revisão" e "Ajuste fino"
- Lista de ajustes com checkboxes para seleção múltipla
- Link "cadastrar" abre modal para gerenciar tipos de ajuste
- Input de instrução livre + botão enviar
- Ao enviar: chama edge function → webhook retorna estrutura revisada → atualiza o roteiro

---

### Fluxo de Uso

1. Usuário abre revisão de roteiro
2. Alterna para aba "Ajuste fino"
3. Seleciona um ou mais ajustes cadastrados (ex: ☑ falta valor prático)
4. Opcionalmente digita instrução adicional
5. Clica enviar
6. Sistema envia para webhook n8n com todos os dados
7. Webhook retorna roteiro ajustado
8. UI atualiza headline/estrutura automaticamente

---

### Webhook Payload

```json
{
  "headline": "faça essas 3 coisas se quiser ser mais produtivo em 2026!!",
  "estrutura": "Você já parou para pensar que as maiores mudanças...",
  "ajustes": [
    {
      "nome": "falta valor prático",
      "instrucoes": "Adicionar exemplos práticos e acionáveis"
    }
  ],
  "instrucao_livre": "Deixar mais curto",
  "selecao": null
}
```

