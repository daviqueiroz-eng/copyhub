

## Plano: Selecionar Todas as Headlines na View Principal

### Contexto

Atualmente, na tela de edição de roteiros (estilo "Google Docs"), cada headline tem um checkbox individual. O usuário precisa clicar um por um para selecionar múltiplas headlines antes de gerar roteiros.

### Objetivo

Adicionar um botão "Selecionar todas" que permite selecionar ou desselecionar todas as headlines da guia atual de uma vez.

---

### Interface Proposta

O botão ficará próximo ao título "Gerar roteiro" que já aparece quando há seleção:

```text
+----------------------------------------------------------+
|                                                          |
|  [✓] Selecionar todas (15)                               |
|                                                          |
|  Gerar roteiro (clicável quando há seleção)              |
|                                                          |
|  [✓] HEADLINE 01:                                        |
|      a neurociência é muito claro, se você tem mania...  |
|                                                          |
|      ESTRUTURA 01:                                       |
|      Primeiro, dormir depois das 23 horas desregula...   |
|                                                          |
|  [✓] HEADLINE 02:                                        |
|      ...                                                 |
+----------------------------------------------------------+
```

---

### Lógica de Seleção

1. **Calcular todas as keys da guia atual**
   - Usar a quantidade de roteiros da guia ativa
   - Gerar keys no formato `{guiaAtiva}-{ordem}` (ex: "1-1", "1-2", etc.)

2. **Estado do checkbox "Selecionar todas"**
   - Marcado: quando todas as headlines da guia estão selecionadas
   - Indeterminado: quando algumas estão selecionadas
   - Desmarcado: quando nenhuma está selecionada

3. **Ação ao clicar**
   - Se todas estão selecionadas → desseleciona todas
   - Senão → seleciona todas

---

### Mudanças Técnicas

#### MentoradoRoteirosView.tsx

**Funções auxiliares:**
```typescript
// Calcular todas as keys da guia atual
const allKeysInGuia = useMemo(() => {
  return Array.from(
    { length: guiaAtivaConfig.quantidade }, 
    (_, i) => `${guiaAtiva}-${i + 1}`
  );
}, [guiaAtiva, guiaAtivaConfig.quantidade]);

// Verificar se todas estão selecionadas
const allSelected = allKeysInGuia.every(key => 
  selectedRoteiroKeys.includes(key)
);

// Verificar se algumas estão selecionadas
const someSelected = selectedRoteiroKeys.some(key => 
  key.startsWith(`${guiaAtiva}-`)
);

// Toggle selecionar todas
const toggleSelectAll = () => {
  if (allSelected) {
    // Desselecionar todas da guia atual
    setSelectedRoteiroKeys(prev => 
      prev.filter(k => !k.startsWith(`${guiaAtiva}-`))
    );
  } else {
    // Selecionar todas da guia atual (mantendo seleções de outras guias)
    setSelectedRoteiroKeys(prev => {
      const fromOtherGuias = prev.filter(k => !k.startsWith(`${guiaAtiva}-`));
      return [...fromOtherGuias, ...allKeysInGuia];
    });
  }
};
```

**UI - Linha de seleção antes das headlines:**
```typescript
{/* Barra de seleção em massa */}
<div className="flex items-center gap-4 mb-6 pb-4 border-b">
  <div className="flex items-center gap-2">
    <Checkbox
      checked={allSelected}
      onCheckedChange={toggleSelectAll}
      className="h-5 w-5"
    />
    <span 
      className="text-sm cursor-pointer hover:underline"
      onClick={toggleSelectAll}
    >
      Selecionar todas ({guiaAtivaConfig.quantidade})
    </span>
  </div>
  
  {selectedRoteiroKeys.length > 0 && (
    <span className="text-xs text-muted-foreground">
      {selectedRoteiroKeys.filter(k => k.startsWith(`${guiaAtiva}-`)).length} selecionadas
    </span>
  )}
</div>

{/* Título "Gerar roteiro" - aparece quando há seleção */}
{selectedRoteiroKeys.length > 0 && (
  <button 
    className="mb-8 text-2xl font-serif hover:underline cursor-pointer text-foreground"
    onClick={() => setShowTipoRoteiroDialog(true)}
  >
    Gerar roteiro
  </button>
)}
```

---

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Adicionar checkbox "Selecionar todas" com lógica de toggle |

---

### Comportamento Esperado

1. Usuário abre a guia com roteiros
2. Vê "Selecionar todas (15)" no topo
3. Clica no checkbox → todas 15 headlines são marcadas
4. "Gerar roteiro" aparece com contagem
5. Clica novamente → todas são desmarcadas

Se o usuário já tinha algumas selecionadas, ao clicar "Selecionar todas" completa a seleção. Um segundo clique desseleciona todas.

