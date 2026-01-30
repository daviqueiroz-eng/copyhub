

## Plano: Integrar Chat de Revisao Inline nos Roteiros

### Visao Geral

Remover o "Modo Revisar" separado (RoteiroRevisaoDialog como dialog full-screen) e integrar o chat diretamente abaixo de cada roteiro que tem texto na estrutura. O layout sera similar a imagem de referencia, com o campo de input estilo Claude/Lovable.

---

### Layout Proposto (Por Roteiro)

```text
+--------------------------------------------------+
| ○  HEADLINE 05:                                  |
| X coisas incríveis que vão acontecer...          |
+--------------------------------------------------+
| ESTRUTURA 05:                                    |
|                                                  |
| Primeiro, seu gosto por comida muda de verdade.. |
| [textarea expandida com scroll proprio]           |
|                                                  |
|                                           🔴 2   |
|                                  1139 caracteres |
+--------------------------------------------------+
| +------------------------------------------+     |
| | Responder...                             |     |
| +------------------------------------------+     |
|                                                  |
| [+] [Clock]               [Sonnet 4.5 v] [>]     |
|                                                  |
+--------------------------------------------------+
```

O chat so aparece quando:
- A estrutura tem texto (nao esta vazia)

---

### Arquivos a Modificar

| Arquivo | Mudancas |
|---------|----------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Integrar chat inline abaixo de cada roteiro com estrutura preenchida |
| `src/components/mentorados/RoteiroInlineChat.tsx` | **NOVO** - Componente de chat inline inspirado no AjusteFinoPanel |
| `src/components/mentorados/RoteiroChecklist.tsx` | Remover ou ajustar callback `onRevisarPlay` |

---

### Detalhes Tecnicos

#### 1. Novo Componente: RoteiroInlineChat.tsx

Componente compacto de chat para cada roteiro, inspirado no AjusteFinoPanel:

```tsx
interface RoteiroInlineChatProps {
  roteiroKey: string;
  headline: string;
  estrutura: string;
  onUpdate: (headline: string, estrutura: string) => void;
}
```

**Caracteristicas:**
- Input estilo Claude (textarea + botoes abaixo)
- Botao "+" para tipos de ajuste
- Botao de historico (clock) - placeholder
- Seletor de modelo/tipo de chat
- Botao enviar
- Mensagens aparecem acima do input (colapsavel)
- Chama edge function `revisar-roteiro` existente

#### 2. Integracao no MentoradoRoteirosView

Adicionar o chat inline apos cada bloco de estrutura:

```tsx
{/* Estrutura */}
<div className="mb-4">
  <span className="font-poppins font-bold text-[#B8860B] text-base">
    ESTRUTURA {String(ordem).padStart(2, "0")}:
  </span>
  <InlineSpellCheckEditor ... />
  <div className="text-right text-xs text-muted-foreground mt-1">
    {roteiro.estrutura?.length || 0} caracteres
  </div>
</div>

{/* Chat inline - aparece se estrutura tem conteudo */}
{roteiro.estrutura?.trim() && (
  <RoteiroInlineChat
    roteiroKey={key}
    headline={roteiro.headline}
    estrutura={roteiro.estrutura}
    onUpdate={(h, e) => {
      handleChange(guiaAtiva, ordem, "headline", h);
      handleChange(guiaAtiva, ordem, "estrutura", e);
    }}
  />
)}
```

#### 3. Design do Chat Inline

Sera compacto e integrado:
- Fundo levemente diferenciado (`bg-muted/30`)
- Altura inicial minima (~120px)
- Mensagens colapsaveis (mostrar ultimas 2 por padrao)
- Input sempre visivel

#### 4. Remocao/Ajuste do Modo Revisar Separado

**Opcao A - Manter RoteiroRevisaoDialog mas nao usar:**
- Remover callback `onRevisarPlay` do checklist
- Comentar/remover estado `showRevisaoDialog`

**Opcao B - Remover completamente:**
- Deletar RoteiroRevisaoDialog.tsx
- Remover imports e estados relacionados

**Recomendacao:** Opcao A inicialmente (mais seguro), depois limpar se funcionar bem.

---

### Fluxo de Uso

1. Usuario edita roteiros normalmente
2. Quando estrutura tem texto, chat aparece abaixo
3. Usuario pode pedir ajustes diretamente ali
4. Respostas da IA atualizam o roteiro automaticamente
5. Historico de mensagens fica visivel inline

---

### Estados Necessarios por Roteiro

```tsx
// Mensagens por roteiro (Map<key, Message[]>)
const [messagesPerRoteiro, setMessagesPerRoteiro] = useState<Map<string, Message[]>>(new Map());

// Tipo de chat selecionado por roteiro (opcional - pode ser global)
const [selectedTipoChat, setSelectedTipoChat] = useState<string | null>(null);
```

---

### Componente RoteiroInlineChat - Estrutura

```tsx
const RoteiroInlineChat = ({ 
  roteiroKey, 
  headline, 
  estrutura, 
  onUpdate 
}: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const { data: tiposChat = [] } = useTiposChatRevisao();
  const [selectedTipoChatId, setSelectedTipoChatId] = useState<string | null>(null);
  
  const handleSend = async () => {
    // Similar ao handleEnviar do AjusteFinoPanel
    // Chama supabase.functions.invoke("revisar-roteiro", {...})
    // Atualiza roteiro via onUpdate
  };
  
  return (
    <div className="mt-4 border rounded-xl bg-muted/20 overflow-hidden">
      {/* Mensagens (colapsavel) */}
      {messages.length > 0 && (
        <div className="...">
          {/* Mostrar ultimas N mensagens */}
        </div>
      )}
      
      {/* Input area */}
      <div className="p-3 border-t bg-background">
        <Textarea ... />
        <div className="flex items-center justify-between mt-2">
          {/* Esquerda: + e clock */}
          {/* Direita: tipo de chat e enviar */}
        </div>
      </div>
    </div>
  );
};
```

---

### Consideracoes

- Chat inline e mais leve que dialog full-screen
- Usuario ve contexto do roteiro enquanto interage com IA
- Pode ter varios chats abertos ao mesmo tempo (um por roteiro)
- Historico de mensagens pode ser persistido em localStorage por sessao
- O seletor de "modelo" (Sonnet 4.5) e visual apenas, podendo futuramente conectar a tipos_chat_revisao

