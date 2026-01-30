

## Plano: Remover Instagram Reels e Ajustar Menu Lateral

### O que sera feito

1. **Remover pagina Instagram Reels** (iframe nao funcionou)
2. **Ocultar itens do menu lateral**:
   - Mural
   - Dash Geral
   - Banco de Prompts
   - Planilhas Importantes
3. **Mudar cor das letras do menu** de roxo para branco

---

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/AppSidebar.tsx` | Remover itens do menu e ajustar cor |
| `src/App.tsx` | Remover rota do Instagram Reels |
| `src/pages/InstagramReels.tsx` | DELETAR arquivo |
| `src/index.css` | Ajustar `--sidebar-primary` de roxo para branco |

---

### Detalhes Tecnicos

#### 1. AppSidebar.tsx - Remover itens e imports

**Remover do array `menuItems`:**
```typescript
// REMOVER estas linhas:
{ title: "Mural", url: "/", icon: MessageSquare },
{ title: "Dash Geral", url: "/dash-geral", icon: LayoutDashboard },
{ title: "Instagram Reels", url: "/instagram-reels", icon: Video },
{ title: "Banco de Prompts", url: "/prompts", icon: Sparkles },
{ title: "Planilhas Importantes", url: "/headlines", icon: FileText },
```

**Remover imports nao utilizados:**
```typescript
// Remover: MessageSquare, Sparkles, FileText, LayoutDashboard, Video
```

#### 2. index.css - Mudar cor do texto sidebar

Alterar a variavel `--sidebar-primary` de roxo (`238 76% 62%`) para branco (`0 0% 100%`):

```css
/* Linha 43 e 93 - mudar de: */
--sidebar-primary: 238 76% 62%;

/* Para: */
--sidebar-primary: 0 0% 100%;
```

Isso afetara:
- Cor do texto "Central da Equipe"
- Cor do texto dos itens ativos no menu

#### 3. App.tsx - Remover rota

```typescript
// Remover import:
import InstagramReels from "./pages/InstagramReels";

// Remover rota:
<Route path="/instagram-reels" element={<ProtectedRoute><InstagramReels /></ProtectedRoute>} />
```

#### 4. Deletar arquivo

Remover `src/pages/InstagramReels.tsx`

---

### Menu Final

Itens que permanecem:

| Item | URL |
|------|-----|
| Acompanhamento | /acompanhamento |
| Meus Mentorados | /mentorados |
| Core Manager | /core-manager |
| Teste de Conhecimento | /testes |
| Treinamentos | /treinamentos |
| Atividades | /modo-flow |
| Calendario | /calendario |
| Ideias de Melhorias | /ideias-melhorias |
| Gerenciar Usuarios | /usuarios |

---

### Nota sobre Rota Inicial

Como o "Mural" (rota `/`) sera removido do menu, a primeira pagina visivel sera "Acompanhamento". O usuario pode querer redirecionar a rota `/` para `/acompanhamento` no futuro.

