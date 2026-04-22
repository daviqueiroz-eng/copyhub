

# Plano revisado: Google OAuth + atualização no Obsidian (SEM apagar dados)

## Garantia explícita

**Nenhum dado de usuário será apagado.** A correção do Google OAuth envolve apenas reconfigurar credenciais OAuth (Client ID/Secret) — isso NÃO toca em:
- contas de usuários (`auth.users`)
- senhas salvas (`encrypted_password`)
- profiles, roles, allowed_emails
- nenhuma tabela do banco
- nenhum arquivo de Storage

"Apagar Client ID" significa apenas remover uma credencial OAuth de configuração. Os usuários que já logaram com Google continuam existindo e podem continuar logando normalmente após a correção.

---

## Parte 1 — Google OAuth: voltar ao broker gerenciado do Lovable

**O que será feito:**
Remover apenas o **Client ID** e **Secret** customizados do Google em Lovable Cloud → Users → Auth Settings → Google. Sem credenciais próprias, o sistema usa automaticamente o broker `oauth.lovable.app`, que já tem todos os redirect URIs corretos pré-registrados.

**O que NÃO será feito:**
- Não vou rodar nenhum SQL.
- Não vou mexer em `auth.users`, `profiles`, `user_roles` ou `allowed_emails`.
- Não vou apagar contas, sessões salvas ou históricos.

**Resultado:** o erro `redirect_uri_mismatch` deixa de ocorrer no navegador normal, sem afetar nenhum usuário existente.

## Parte 2 — Forçar atualização da build no Obsidian

### 2a. Anti-cache no `index.html`
Adicionar meta tags para que o webview do Obsidian sempre busque HTML fresco:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

### 2b. Botão "Forçar atualização do app" no `Auth.tsx`
Visível apenas no Obsidian/webview. Limpa **somente cache de assets** do navegador (Cache Storage e service workers) — **não toca em localStorage, sessão de login ou dados do usuário**.

```typescript
const forceUpdate = async () => {
  // Limpa apenas caches de assets (HTML/JS/CSS antigos)
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  
  // Desregistra service workers (se existirem)
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) await reg.unregister();
  }
  
  // Recarrega com query string para burlar cache
  window.location.href = window.location.origin + '?v=' + Date.now();
};
```

**Importante:** sessão de login fica preservada (não apagamos `localStorage`).

### 2c. Auto-detecção de versão antiga
No boot do app, comparar build hash atual com o último visto. Se diferente, limpar **só os caches de assets** automaticamente. Sessão do usuário permanece intacta.

## Parte 3 — UX

- Mostrar versão de build no rodapé do card de login (apenas em embedded).
- Botão "Forçar atualização do app" no aviso do Obsidian.
- Manter todo o fluxo de login atual funcionando.

---

## Arquivos modificados

- `index.html` — meta tags anti-cache.
- `src/main.tsx` — checagem de versão e limpeza automática de cache de assets.
- `src/pages/Auth.tsx` — botão de forçar atualização e exibição de versão.
- `vite.config.ts` — injetar `VITE_BUILD_TIME` para versionamento.

## Ação manual sua (opcional, mas recomendada)

Em Lovable Cloud → Users → Auth Settings → Google: remover Client ID e Secret personalizados. **Isso só apaga uma configuração OAuth, não apaga usuários.**

## Confirmação final

- ✅ Nenhuma tabela será alterada
- ✅ Nenhum usuário será apagado
- ✅ Nenhuma sessão ativa será perdida
- ✅ Nenhuma senha definida pelo admin será perdida
- ✅ Apenas cache de arquivos estáticos (JS/CSS) é limpo, e só no Obsidian

