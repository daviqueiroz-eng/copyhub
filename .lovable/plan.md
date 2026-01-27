

## Plano: Ajustes no Sistema de Ajuste Fino e Navegação para Roteiro Específico

### Mudança 1: Colar Instrução ao Clicar no Ajuste

**Situação Atual:**
- Ao clicar em um tipo de ajuste, ele é selecionado com checkbox
- O usuário precisa marcar e desmarcar múltiplos ajustes

**Nova Lógica:**
- Ao clicar em um tipo de ajuste cadastrado, o sistema cola as instruções diretamente no campo de texto
- Isso permite que o usuário visualize e edite o conteúdo antes de enviar
- Mantém a possibilidade de escrever livremente

---

### Mudança 2: Abrir Revisão no Roteiro Correto

**Situação Atual:**
- Ao clicar em "Revisar" (no checklist ou em qualquer lugar), o dialog sempre abre no roteiro 1
- O `currentIndex` é resetado para 0 quando o dialog abre

**Nova Lógica:**
- Passar um parâmetro `initialIndex` para o `RoteiroRevisaoDialog`
- Quando clicar em "Revisar" em cima de um roteiro específico (ex: roteiro 7), abrir o dialog já posicionado nele
- Calcular o índice correto baseado na posição do roteiro na lista de roteiros disponíveis

---

### Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/mentorados/AjusteFinoPanel.tsx` | Remover checkboxes, ao clicar em um ajuste colar o texto das instruções no input |
| `src/components/mentorados/RoteiroRevisaoDialog.tsx` | Adicionar prop `initialIndex` e usar como estado inicial |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Passar o índice correto quando clicar em "Revisar" de um roteiro específico |

---

### Detalhes Técnicos

#### AjusteFinoPanel.tsx

```text
Antes:
- Lista com checkboxes
- Estado selectedAjustes (Set<string>)
- Clique no item → toggle checkbox

Depois:
- Lista de cards clicáveis (sem checkbox)
- Clique no item → cola instrução no campo de texto
- Remove estado de seleção múltipla
- Mantém botão "Gerenciar" para cadastrar novos tipos
```

#### RoteiroRevisaoDialog.tsx

```typescript
// Nova prop
interface RoteiroRevisaoDialogProps {
  // ... props existentes
  initialIndex?: number; // Índice inicial para abrir (default: 0)
}

// Usar initialIndex ao abrir
useEffect(() => {
  if (open) {
    setCurrentIndex(initialIndex ?? 0);
  }
}, [open, initialIndex]);
```

#### MentoradoRoteirosView.tsx

```typescript
// Novo estado para controlar qual roteiro abrir
const [revisaoInitialIndex, setRevisaoInitialIndex] = useState(0);

// Função para abrir revisão em roteiro específico
const openRevisaoAtRoteiro = (ordem: number) => {
  // Calcular índice na lista filtrada de roteiros
  const roteirosDisponiveis = [...]; // mesma lógica atual
  const idx = roteirosDisponiveis.findIndex(r => r.key === `${guiaAtiva}-${ordem}`);
  setRevisaoInitialIndex(idx >= 0 ? idx : 0);
  setShowRevisaoDialog(true);
};

// Passar para RoteiroRevisaoDialog
<RoteiroRevisaoDialog
  initialIndex={revisaoInitialIndex}
  // ... demais props
/>
```

---

### Fluxo de Uso Atualizado

**Ajuste Fino:**
1. Usuário abre aba "Ajuste fino"
2. Clica em um tipo cadastrado (ex: "Falta valor prático")
3. O texto das instruções é colado no campo de input
4. Usuário pode editar ou adicionar mais texto
5. Clica enviar

**Revisar Roteiro Específico:**
1. Usuário está editando o roteiro 7
2. Clica em "Revisar" (na label ou botão)
3. Dialog de revisão abre já mostrando o roteiro 7
4. Pode navegar para outros roteiros normalmente

