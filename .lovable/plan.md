

## Plano: Reorganizar Layout Mobile da Página Mentorados

### Problema Identificado

Na screenshot, elementos estão sobrepostos:
- Lista de mentorados (Milena, João Guilherme, etc.)
- Filtros de "Ordem de Prioridade" (Buscar copywriter, Todos/Hoje/Semana/Mês)
- Toggle Grid/Calendário
- Cards de prioridade (ATRASADO - Ricardo Novack)

Tudo aparece misturado porque em mobile a página renderiza ambas as seções no mesmo fluxo de scroll sem separação visual clara.

---

### Solução: Layout Mobile com Tabs Expandidas

Transformar as duas áreas principais (Mentorados e Prioridade) em **tabs navegáveis em mobile**, separando completamente os conteúdos.

---

### 1. Reestruturar Layout Mobile (`src/pages/Mentorados.tsx`)

**Mudança principal**: Em mobile, usar um sistema de tabs de nível superior para alternar entre "Mentorados" e "Prioridade", em vez de mostrar tudo junto.

```tsx
// Layout Mobile - Tabs de nível superior
<div className="xl:hidden flex flex-col h-full">
  <Tabs defaultValue="mentorados" className="flex flex-col flex-1 min-h-0">
    <TabsList className="grid w-full grid-cols-2 shrink-0 mb-4">
      <TabsTrigger value="mentorados">Mentorados</TabsTrigger>
      <TabsTrigger value="prioridade">Prioridade</TabsTrigger>
    </TabsList>

    <TabsContent value="mentorados" className="flex-1 min-h-0 overflow-hidden">
      {/* Busca + Botão Novo */}
      <div className="flex items-center gap-2 shrink-0 pb-3">
        <Input ... />
        <Button ... />
      </div>
      
      {/* Sub-tabs Geral/Grupo */}
      <Tabs defaultValue="geral" className="flex-1 min-h-0">
        <TabsList className="grid w-full max-w-xs grid-cols-2 shrink-0">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="grupo">Grupo</TabsTrigger>
        </TabsList>
        <TabsContent value="geral" className="overflow-y-auto">
          <GeralView ... />
        </TabsContent>
        <TabsContent value="grupo" className="overflow-y-auto">
          <GrupoView />
        </TabsContent>
      </Tabs>
    </TabsContent>

    <TabsContent value="prioridade" className="flex-1 min-h-0 overflow-y-auto">
      <OrdemPrioridadeView />
    </TabsContent>
  </Tabs>
</div>

// Layout Desktop - mantém side-by-side
<div className="hidden xl:flex ...">
  {/* Lado esquerdo: Mentorados */}
  {/* Lado direito: Prioridade */}
</div>
```

---

### 2. Simplificar Header

O header "Meus Mentorados" no topo só precisa aparecer uma vez e de forma mais compacta em mobile:

```tsx
<div className="shrink-0 pb-3">
  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
    {/* Em mobile, mostrar título contextual baseado na tab ativa */}
    Meus Mentorados
  </h2>
</div>
```

---

### 3. Remover Seção Duplicada

A seção que estava nas linhas 256-260 causando duplicação:

```tsx
{/* REMOVER esta duplicação */}
<div className="xl:hidden mt-4 md:mt-6 pt-4 md:pt-6 border-t">
  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Ordem de Prioridade</h3>
  <OrdemPrioridadeView />
</div>
```

Esta seção será movida para dentro do sistema de tabs.

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Mentorados.tsx` | Implementar tabs de nível superior em mobile, remover seção duplicada |

---

### Resultado Visual Esperado

**Mobile - Tab "Mentorados":**
```
┌─────────────────────────┐
│ Meus Mentorados         │
├─────────────────────────┤
│ [Mentorados][Prioridade]│  <- Tabs principais
├─────────────────────────┤
│ [🔍 Buscar...]  [+Novo] │
│ [Geral] [Grupo]         │  <- Sub-tabs
├─────────────────────────┤
│ Mentorados 📷(20)       │
│ ┌─────────────────────┐ │
│ │ MI  Milena        📷│ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ JG  João Guilherme📷│ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ DR  draclaudiapi...│ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Mobile - Tab "Prioridade":**
```
┌─────────────────────────┐
│ Meus Mentorados         │
├─────────────────────────┤
│ [Mentorados][Prioridade]│  <- Tabs principais
├─────────────────────────┤
│ 🔍 Buscar copywriter... │
│ [Todos][Hoje][Semana]   │
│ [📊][📅]                │  <- Grid/Calendar toggle
├─────────────────────────┤
│ 📄 Arquivo: xyz.csv     │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 🔴 ATRASADO         │ │
│ │ Ricardo Novack      │ │
│ │ Validação 1         │ │
│ │ 📅 10/11/2025       │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 🔴 ATRASADO         │ │
│ │ Flávia Chehin       │ │
│ │ ...                 │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

---

### Benefícios desta Abordagem

1. **Separação clara**: Cada seção tem seu próprio espaço, sem sobreposição
2. **Navegação intuitiva**: O usuário escolhe o que quer ver (Mentorados ou Prioridade)
3. **Melhor uso do espaço**: Cada view usa 100% da tela disponível
4. **Consistente com padrões mobile**: Apps móveis usam tabs para alternar entre views principais
5. **Mantém desktop inalterado**: Layout side-by-side continua funcionando em `xl+`

