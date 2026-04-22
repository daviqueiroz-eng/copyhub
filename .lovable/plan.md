

# Plano: Restaurar autenticação (Google + Email/Senha)

## Diagnóstico real (com base nos logs e no código)

**Causa raiz #1 — Login manual rejeitado pelo backend:**
Os auth logs mostram `error_code: "email_provider_disabled"` e `"422: Email logins are disabled"` ao tentar `POST /token` com `grant_type=password`. Ou seja: o admin define a senha com sucesso (via `auth.admin.updateUserById`), e a senha **fica salva no banco com hash**, mas o provider Email está **desligado** nas configurações de Auth do Lovable Cloud, então a request de login é rejeitada antes mesmo da validação.

**Causa raiz #2 — Google OAuth dentro do Obsidian:**
No navegador normal o fluxo via `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` funciona — o broker do Lovable (`oauth.lovable.app`) cuida do callback registrado no Google Console. O `redirect_uri_mismatch` aparece **dentro do Obsidian** porque o webview altera a URL final. O `prompt: "consent"` adicionado recentemente também é desnecessário e pode confundir o broker.

---

## Parte 1 — Habilitar provider de Email no Lovable Cloud (ação obrigatória)

Esta é a correção que **destrava o login manual**. Será feita via tool `cloud--configure_auth`:
- ativar `email_enabled = true`
- manter `email_double_confirm_changes = false` para não exigir confirmação em troca de email
- manter `email_autoconfirm = false` (usuário criado pelo admin já vem confirmado via `updateUserById`)

Sem essa mudança, **nenhum** ajuste de código resolve o login manual — o backend continuará respondendo 422.

## Parte 2 — Limpar `signInWithGoogle` (`AuthContext.tsx`)

- Remover o `extraParams: { prompt: "consent" }` — não é necessário e pode atrapalhar o broker.
- Manter a detecção de `isEmbeddedWebView()` que abre o navegador externo no Obsidian (única forma confiável; Google bloqueia OAuth em webviews por política, não há como contornar).
- Garantir uso de `redirect_uri: window.location.origin` (já está correto).

## Parte 3 — Reforçar fluxo manual no `set_password` (`admin-usuarios/index.ts`)

Hoje o handler chama `auth.admin.updateUserById(userId, { password })`. Vamos adicionar:
- `email_confirm: true` na mesma chamada, garantindo que usuários criados via Google que nunca confirmaram email manual também consigam logar com senha.
- Validação extra: se `userId` não existir em `auth.users`, retornar erro claro ("Usuário não encontrado — peça para ele acessar com Google ao menos uma vez").
- Log estruturado do resultado.

## Parte 4 — UX da tela de login (`Auth.tsx`)

- Manter os dois botões visíveis: **Entrar com Google** e **Entrar com email e senha**.
- Em ambiente embedded (Obsidian): destacar email/senha como método primário com aviso "Use email e senha — Google não funciona dentro do Obsidian".
- Em navegador normal: Google em destaque, email/senha como alternativa secundária.
- Mensagem de erro mais clara quando o backend ainda retornar `email_provider_disabled` (caso a configuração demore a propagar).

## Parte 5 — Validação ponta a ponta

Após implementar, testar via logs (`supabase--analytics_query` em `auth_logs`):
1. Login Google no navegador → deve resultar em `POST /token` com `status: 200`.
2. Admin define senha para usuário X → checar resposta `success: true`.
3. Usuário X loga com email/senha → deve aparecer `POST /token` com `grant_type: password` e `status: 200` (não mais 422).
4. Sessão persiste após refresh (já garantido pelo `localStorage` no `client.ts`).

---

## Arquivos modificados

- `supabase/functions/admin-usuarios/index.ts` — adicionar `email_confirm: true` no `set_password`.
- `src/contexts/AuthContext.tsx` — remover `prompt: "consent"` do Google, manter detecção webview.
- `src/pages/Auth.tsx` — refinar hierarquia visual e mensagens de erro.

## Ações no Lovable Cloud (via tool, sem necessidade de painel)

- `cloud--configure_auth` com `email_enabled: true`.

## O que NÃO precisa ser feito

- Não há nada para configurar no Google Cloud Console — o broker `oauth.lovable.app` já cuida das `redirect URIs` registradas.
- Não há mudança de schema, RLS ou tabelas — `auth.users.encrypted_password` já é gerenciado pelo Supabase Auth com hash bcrypt.
- Não há "refatoração da camada de auth" — a camada está correta; só falta o flag do provider ligado.

