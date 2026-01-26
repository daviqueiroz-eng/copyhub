
## Plano: Painel de Progresso Lateral + Edição Direta no Modo Revisão

### Objetivo

Implementar dois ajustes:
1. **Geração em massa**: Mover o progresso para o lado direito, permitindo que o usuário já edite os roteiros enquanto a geração acontece
2. **Modo revisão**: Permitir edição direta do texto (além do chat de IA) e adicionar botões de navegação visíveis

---

### Ajuste 1: Progresso Lateral Durante Geração

#### Comportamento Atual
- Quando clica "Gerar", abre um Dialog modal que bloqueia toda a tela
- O usuário precisa esperar todos os roteiros serem gerados

#### Novo Comportamento
- Ao confirmar geração, o Dialog fecha
- Um painel fixo aparece no lado direito da tela mostrando o progresso
- O usuário continua editando os roteiros normalmente
- Cada roteiro gerado aparece em tempo real no campo correspondente

#### Mudanças Técnicas

**MentoradoRoteirosView.tsx:**
- Adicionar novo estado para controlar o painel de progresso lateral
- Mover a lógica de processamento da fila do TipoRoteiroDialog para o MentoradoRoteirosView
- Renderizar um painel fixo à direita durante o processamento

```typescript
// Novos estados
const [bulkProgress, setBulkProgress] = useState<{
  isProcessing: boolean;
  total: number;
  current: number;
  currentKey: string;
  results: Array<{key: string; success: boolean; error?: string}>;
} | null>(null);
```

**TipoRoteiroDialog.tsx:**
- Remover a lógica de processamento da fila interna
- Ao confirmar, apenas retornar a lista de headlines com tipos selecionados
- Fechar o dialog imediatamente após confirmar

**Novo componente: BulkProgressPanel.tsx**
- Painel lateral flutuante à direita
- Mostra barra de progresso e status de cada roteiro
- Botão para minimizar/fechar
- Não bloqueia a edição dos roteiros

#### Interface do Painel

```text
+------------------------------------------+
|  Gerando Roteiros          [- Minimizar] |
+------------------------------------------+
|  Progresso: 3/5                    60%   |
|  ████████████████████░░░░░░░░░░░░░░░░░  |
|                                          |
|  ✓ 1-2: Concluído                       |
|  ✓ 1-3: Concluído                       |
|  ⏳ 1-4: Processando...                  |
|  ○ 1-5: Aguardando                      |
|  ○ 1-6: Aguardando                      |
+------------------------------------------+
```

---

### Ajuste 2: Edição Direta no Modo Revisão

#### Comportamento Atual
- O texto do roteiro é exibido como texto estático (não editável)
- Alterações só podem ser feitas via chat de IA

#### Novo Comportamento
- Headline e Estrutura são campos editáveis (Textarea)
- Alterações são salvas automaticamente (debounce)
- Botões "Anterior" e "Próximo" continuam funcionando
- Chat de IA permanece disponível para ajustes pontuais

#### Mudanças Técnicas

**RoteiroRevisaoDialog.tsx:**
- Trocar o texto estático por componentes Textarea
- Adicionar debounce para salvar alterações
- Manter sincronização com o estado pai via onRoteiroChange

```typescript
// Lado esquerdo - Roteiro editável
<div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r overflow-hidden">
  <div className="px-4 py-2 bg-muted/50 border-b shrink-0">
    <h3 className="font-semibold text-sm">Headline {ordem}</h3>
  </div>
  <Textarea
    value={currentRoteiro.headline}
    onChange={(e) => handleDirectEdit("headline", e.target.value)}
    placeholder="Digite a headline..."
    className="border-0 rounded-none resize-none min-h-[60px]"
  />
  
  <div className="px-4 py-2 bg-muted/50 border-b shrink-0">
    <h3 className="font-semibold text-sm">Estrutura {ordem}</h3>
  </div>
  <Textarea
    value={currentRoteiro.estrutura}
    onChange={(e) => handleDirectEdit("estrutura", e.target.value)}
    placeholder="Digite a estrutura..."
    className="flex-1 border-0 rounded-none resize-none"
  />
</div>
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Simplificar para apenas selecionar tipos e retornar dados |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Adicionar lógica de fila e painel de progresso lateral |
| `src/components/mentorados/RoteiroRevisaoDialog.tsx` | Trocar texto estático por Textareas editáveis |
| `src/components/mentorados/BulkProgressPanel.tsx` | CRIAR - Componente do painel de progresso lateral |

---

### Fluxo de Geração em Massa (Atualizado)

1. Usuário seleciona roteiros (checkbox)
2. Clica em "Gerar roteiro"
3. Dialog abre para selecionar tipos
4. Usuário confirma tipos
5. Dialog FECHA imediatamente
6. Painel de progresso aparece à direita
7. Usuário pode editar outros roteiros enquanto geração acontece
8. Cada roteiro gerado aparece no campo em tempo real
9. Ao finalizar, painel mostra resumo e pode ser fechado

---

### Fluxo de Revisão (Atualizado)

1. Usuário clica play no timer "Revisar"
2. Abre tela cheia do primeiro roteiro
3. Lado esquerdo: campos EDITÁVEIS (headline + estrutura)
4. Lado direito: chat de IA para ajustes pontuais
5. Botões "Anterior" / "Próximo" para navegar
6. Alterações são salvas automaticamente (1s debounce)
7. Setas do teclado também navegam entre roteiros
