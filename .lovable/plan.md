
## Plano: Modo Revisão com Navegação e Chat de IA

### Objetivo

Criar um modo de revisão em tela cheia onde o usuário vê um roteiro por vez, com um chat de IA ao lado que permite fazer ajustes pontuais no texto. O chat deve seguir as instruções do usuário ao pé da letra, alterando apenas o que foi solicitado.

---

### Interface Proposta

```text
+-----------------------------------------------------------------------------+
|  [<] Roteiro 3/10                                    [X Fechar]             |
+-----------------------------------------------------------------------------+
|                                      |                                      |
|     HEADLINE 03:                     |   Chat de Revisão                    |
|     [Texto da headline aqui...]      |                                      |
|                                      |   +------------------------------+   |
|     ESTRUTURA 03:                    |   |                              |   |
|     [                                |   |  Assistente IA               |   |
|      Texto da estrutura              |   |  -------------------------   |   |
|      do roteiro com todo             |   |  Em que posso ajudar na      |   |
|      conteúdo completo               |   |  revisão deste roteiro?      |   |
|      ...                             |   |                              |   |
|     ]                                |   |  Você (10:32)                |   |
|                                      |   |  -------------------------   |   |
|                                      |   |  Troca "demais" por          |   |
|                                      |   |  "muito bom"                 |   |
|                                      |   |                              |   |
|                                      |   |  Assistente IA               |   |
|                                      |   |  -------------------------   |   |
|                                      |   |  Feito! Alterei apenas       |   |
|                                      |   |  essa palavra.               |   |
|                                      |   +------------------------------+   |
|                                      |                                      |
|                                      |   [_____________________] [Enviar]   |
+-----------------------------------------------------------------------------+
|        [< Anterior]                                [Proximo >]              |
+-----------------------------------------------------------------------------+
```

---

### Fluxo de Uso

1. Usuario clica em Play no timer "Revisar"
2. Abre tela cheia do primeiro roteiro com estrutura preenchida
3. Ao lado, chat de IA com contexto do roteiro atual
4. Usuario digita instrucao (ex: "troca 'demais' por 'muito bom'")
5. IA faz a alteracao minima solicitada
6. Texto do roteiro atualiza em tempo real
7. Usuario navega com botoes ou setas do teclado
8. Ao fechar, todas alteracoes ja estao salvas

---

### Mudancas Tecnicas

#### 1. Novo Componente: RoteiroRevisaoDialog.tsx

**Props:**
```typescript
interface RoteiroRevisaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roteiros: Array<{
    key: string;
    headline: string;
    estrutura: string;
  }>;
  onRoteiroChange: (key: string, field: "headline" | "estrutura", value: string) => void;
  mentoradoNome: string;
  inteligenciaGlobal?: string;
  inteligenciaMentorado?: string;
}
```

**Estados:**
```typescript
const [currentIndex, setCurrentIndex] = useState(0);
const [messages, setMessages] = useState<Message[]>([]);
const [inputMessage, setInputMessage] = useState("");
const [isLoading, setIsLoading] = useState(false);
```

**Layout:**
- Dialog fullscreen (ou Sheet)
- Lado esquerdo: texto do roteiro atual (headline + estrutura)
- Lado direito: chat de IA
- Footer: navegacao (< Anterior | Proximo >)
- Header: indicador de posicao (Roteiro 3/10) + botao fechar

#### 2. Nova Edge Function: revisar-roteiro

**Endpoint:** `supabase/functions/revisar-roteiro/index.ts`

**Comportamento:**
- Recebe: roteiro atual (headline + estrutura), mensagem do usuario, historico do chat
- Usa Lovable AI (google/gemini-3-flash-preview)
- Prompt: "Voce e um assistente de revisao. Faca APENAS as alteracoes solicitadas, sem mudar nada alem. Retorne o texto completo atualizado."
- Retorna: texto atualizado + mensagem de confirmacao

**Estrutura do prompt:**
```text
Sistema: Voce e um assistente de revisao de roteiros.

REGRAS ABSOLUTAS:
1. Faca SOMENTE a alteracao solicitada pelo usuario
2. NAO mude nada alem do que foi pedido
3. Mantenha toda formatacao, quebras de linha, pontuacao
4. Se a instrucao for ambigua, pergunte para esclarecer
5. Retorne sempre o texto COMPLETO atualizado

Roteiro atual:
HEADLINE: {headline}
ESTRUTURA: {estrutura}
```

**Formato de resposta (tool calling):**
```typescript
tools: [{
  type: "function",
  function: {
    name: "update_roteiro",
    parameters: {
      type: "object",
      properties: {
        headline: { type: "string" },
        estrutura: { type: "string" },
        explanation: { type: "string" }
      }
    }
  }
}]
```

#### 3. Integracao em MentoradoRoteirosView.tsx

**Trigger:** Quando usuario clica play no timer "Revisar"

**Preparacao:**
- Filtrar roteiros que tem estrutura preenchida
- Passar lista para o dialog
- Passar inteligencia global e do mentorado para contexto

**Callback onRoteiroChange:**
- Atualizar roteirosLocais
- Disparar debounce de save no banco

#### 4. Navegacao por Teclado

- Setas esquerda/direita: navegar entre roteiros
- Esc: fechar dialog
- Enter (no input): enviar mensagem

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/mentorados/RoteiroRevisaoDialog.tsx` | CRIAR - Dialog fullscreen de revisao |
| `supabase/functions/revisar-roteiro/index.ts` | CRIAR - Edge function para IA de revisao |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | MODIFICAR - Adicionar trigger e integracao |
| `supabase/config.toml` | MODIFICAR - Registrar nova edge function |

---

### Comportamento do Chat de IA

1. **Contexto persistente por roteiro**
   - Historico do chat e especifico de cada roteiro
   - Ao navegar, carrega historico do roteiro atual

2. **Alteracoes minimas**
   - IA so altera o que foi pedido
   - Confirma a alteracao feita
   - Se nao entender, pergunta

3. **Atualizacao em tempo real**
   - Texto do roteiro atualiza assim que IA responde
   - Salvamento automatico com debounce

4. **Exemplos de comandos:**
   - "Troca 'demais' por 'muito bom'"
   - "Remove a ultima frase"
   - "Adiciona um CTA no final"
   - "Deixa mais curto"

---

### Detalhes da UI

- **Indicador de posicao:** "Roteiro 3/10" no header
- **Botoes de navegacao:** Desabilitados nos extremos (primeiro/ultimo)
- **Texto do roteiro:** ScrollArea com fonte grande para leitura
- **Chat:** Estilo bolhas de mensagem, scroll automatico
- **Loading:** Skeleton no chat enquanto IA processa
- **Mobile:** Layout empilhado (roteiro em cima, chat embaixo)
