

## Plano: Transformar Ajuste Fino em Interface de Chat

### Visao Geral

Redesenhar o painel de Ajuste Fino para ter aparencia de chat similar ao Lovable Cloud, mantendo toda a logica existente:
- Historico de mensagens enviadas/recebidas em formato de conversa
- Lista de ajustes cadastrados acessivel via botao "+"
- Clicar em ajuste = colar instrucoes no input
- Envio para webhook n8n-ajustes
- Suporte a selecao de texto do roteiro

---

### Layout Proposto

```text
+------------------------------------------------+
|                                                |
|   [Resposta da IA em formato texto com         |
|    quebras de linha e formatacao]              |
|                                                |
|   [Copiar] [Like] [Dislike] [Refresh]          |
|                                                |
|   -----------------------------------------    |
|                                                |
|   [Sua mensagem anterior em destaque]          |
|                                                |
|   -----------------------------------------    |
|                                                |
|   [Nova resposta da IA...]                     |
|                                                |
+------------------------------------------------+
| Responder...                              [>]  |
| [+] [Gerenciar]                                |
+------------------------------------------------+
```

---

### Estrutura de Dados

Nova interface para mensagens do Ajuste Fino:

```typescript
interface AjusteMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
```

Estado adicional:
- `messages: AjusteMessage[]` - Historico de mensagens
- `showAjustesPopover: boolean` - Controla popover com lista de ajustes

---

### Componentes da Interface

#### 1. Area de Mensagens (ScrollArea)

- Mensagens do usuario: alinhadas a direita ou estilo simples
- Mensagens do assistente: estilo card com texto em markdown
- Botoes de acao abaixo das respostas:
  - Copiar (copia conteudo da mensagem)
  - Like/Dislike (apenas visual por agora)
  - Refresh (reenvia a ultima instrucao)
- Loading state com spinner laranja

#### 2. Input de Chat

- Estilo similar ao Lovable Cloud
- Placeholder "Responder..."
- Botao de envio a direita
- Botao "+" a esquerda para abrir popover de ajustes

#### 3. Popover de Ajustes (via botao +)

- Lista de ajustes cadastrados
- Ao clicar em um ajuste: fecha popover e cola instrucoes no input
- Botao "Gerenciar" para abrir TiposAjusteDialog

---

### Arquivos a Modificar

| Arquivo | Mudancas |
|---------|----------|
| `src/components/mentorados/AjusteFinoPanel.tsx` | Redesign completo da interface para formato de chat |

---

### Detalhes Tecnicos

#### AjusteFinoPanel.tsx - Novas Funcionalidades

1. **Estado de mensagens por sessao**
```typescript
const [messages, setMessages] = useState<AjusteMessage[]>([]);
```

2. **Mensagem de boas-vindas inicial**
```typescript
// Ao montar, adicionar mensagem de boas-vindas
useEffect(() => {
  if (messages.length === 0) {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Selecione um tipo de ajuste ou digite sua instrucao para refinar o roteiro.',
      timestamp: new Date(),
    }]);
  }
}, []);
```

3. **Ao enviar mensagem**
```typescript
// Adicionar mensagem do usuario
// Chamar webhook
// Adicionar resposta do assistente com conteudo retornado
```

4. **Botoes de acao nas mensagens**
- Copiar: `navigator.clipboard.writeText(message.content)`
- Refresh: pegar ultima instrucao do usuario e reenviar

5. **Popover de Ajustes (botao +)**
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon"><Plus /></Button>
  </PopoverTrigger>
  <PopoverContent>
    {tiposAjuste.map(tipo => (
      <button onClick={() => {
        setInstrucaoLivre(tipo.instrucoes);
        setOpen(false);
      }}>
        {tipo.nome}
      </button>
    ))}
  </PopoverContent>
</Popover>
```

---

### Fluxo de Uso Atualizado

1. Usuario abre aba "Ajuste Fino"
2. Ve mensagem de boas-vindas do assistente
3. Pode:
   - Digitar instrucao diretamente no input
   - Clicar no botao "+" para ver ajustes cadastrados
   - Clicar em um ajuste para colar instrucoes no input
4. Envia instrucao
5. Mensagem do usuario aparece no chat
6. Resposta do webhook aparece como mensagem do assistente
7. Roteiro e atualizado automaticamente se houver mudancas

---

### Consideracoes Tecnicas

- Manter compatibilidade com props existentes (headline, estrutura, selecao, onUpdate, onClearSelection)
- Mensagens sao por sessao (nao persistidas)
- Ao mudar de roteiro, limpar historico de mensagens ou manter?
  - **Decisao**: Manter por sessao do dialog, similar ao chat de revisao
- Botao "Gerenciar" continua abrindo TiposAjusteDialog

