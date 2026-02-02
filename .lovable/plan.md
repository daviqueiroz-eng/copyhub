

## Plano: Redirecionar Automaticamente para Analise Apos Criar Roteiro

### Resumo

Apos criar um novo roteiro pelo dialog "Criar Novo Roteiro", o sistema automaticamente ira selecionar e abrir esse roteiro para analise, entrando no "Modo Foco" - exatamente como ja acontece com o fluxo de "Roteiro Avulso".

---

### O que sera feito

Modificar a funcao `handleCreateRoteiro` para, apos sucesso na criacao:

1. Fechar o dialog
2. Limpar o formulario
3. **Ativar o Modo Foco** (`setIsFocusMode(true)`)
4. **Selecionar o roteiro recem-criado** (`handleSelectRoteiro(data.id)`)
5. Mostrar toast de confirmacao

---

### Arquivo a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/AnaliseRoteiroGame.tsx` | Ajustar callback `onSuccess` do `handleCreateRoteiro` |

---

### Codigo Atual vs Novo

**Antes:**
```typescript
createRoteiro.mutate({...}, {
  onSuccess: () => {
    setShowNovoRoteiroDialog(false);
    setNovoRoteiroForm({...});
    toast({...});
  },
});
```

**Depois:**
```typescript
createRoteiro.mutate({...}, {
  onSuccess: (data) => {  // Receber data para ter acesso ao ID
    setShowNovoRoteiroDialog(false);
    setNovoRoteiroForm({...});
    
    // NOVO: Ir para analise do roteiro recem-criado
    setIsFocusMode(true);
    handleSelectRoteiro(data.id);
    
    toast({
      title: "Roteiro criado",
      description: "O roteiro foi criado e esta pronto para analise.",
    });
  },
});
```

---

### Comportamento Esperado

1. Usuario clica em "Novo Roteiro"
2. Preenche titulo, conteudo, nicho, etc.
3. Clica em "Criar Roteiro"
4. Dialog fecha
5. **Automaticamente entra no Modo Foco com o roteiro recem-criado aberto**
6. Usuario ja pode comecar a analisar (grifar palavras, preencher campos)

Este e o mesmo comportamento que ja existe no "Analisar Roteiro Avulso".

