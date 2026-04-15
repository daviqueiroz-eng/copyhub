

## Plano: Correções na página Mentorados

### Problemas a resolver

1. **Página fica branca** no site publicado — provável crash silencioso no `ProtectedRoute` ou no carregamento de dados. Quando `isActive === false` (erro no check), retorna `null` (tela branca). Precisa tratar esse caso mostrando loading ou redirecionando.

2. **Mentorado clicado sobe para o topo da lista** — ao clicar em um mentorado, ele deve ser reordenado visualmente para o primeiro lugar na lista.

3. **Aba inicial deve ser Mentorados** — a rota `/` atualmente aponta para `Mural`. Precisa mudar para `/mentorados`.

---

### Alterações

#### 1. Corrigir tela branca (ProtectedRoute.tsx)
- Linha 49: quando ocorre erro ao verificar `ativo`, `setIsActive(false)` faz o componente retornar `null` (linha 66-68), resultando em tela branca.
- Correção: tratar o caso de erro fazendo `setIsActive(true)` como fallback (ou redirecionando para `/auth`), em vez de deixar a tela em branco.
- Também garantir que se `isActive === false` por erro, redireciona para `/auth` ao invés de mostrar nada.

#### 2. Mentorado clicado sobe ao topo (Mentorados.tsx + GeralView.tsx)
- Adicionar um estado `lastOpenedId` em `Mentorados.tsx` que armazena o ID do mentorado clicado.
- No `GeralView`, receber esse ID via prop e reordenar `filteredMentorados` para colocar o mentorado com esse ID no topo da lista.
- Persistir no `localStorage` para manter entre sessões.

#### 3. Aba inicial = Mentorados (App.tsx)
- Mudar a rota `"/"` de `<Mural />` para `<Mentorados />`, ou redirecionar `"/"` para `/mentorados`.

#### Arquivos modificados
- `src/components/ProtectedRoute.tsx` — fallback para erro de verificação
- `src/pages/Mentorados.tsx` — estado `lastOpenedId`
- `src/components/mentorados/GeralView.tsx` — reordenação da lista
- `src/App.tsx` — rota padrão para `/mentorados`

