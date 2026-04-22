
Objetivo: restaurar a autenticação de verdade, sem paliativo, garantindo:
- Google funcionando no navegador normal
- email/senha funcionando com senha criada pelo admin
- sessão persistindo
- acesso no Obsidian via email/senha (e Google apenas abrindo fora do webview, se necessário)

## Diagnóstico confirmado

1. O login manual não falha por “senha não salvar”.
Os logs mostram `POST /token` com `grant_type=password` retornando `422: Email logins are disabled`.
Isso indica que:
- a ação de “definir senha” está chegando no backend
- o problema principal é que o método de login por email/senha está desabilitado no backend

2. A action de senha manual está sendo executada.
Há log recente do `admin-usuarios` com `action: "set_password"`, então o clique do admin está chegando à função.

3. O erro do Google (`redirect_uri_mismatch`) acontece antes do app receber a sessão.
Isso aponta para configuração do método Google no backend/OAuth, não para a persistência local da sessão.

## Plano de correção

### 1) Corrigir a configuração de autenticação no Lovable Cloud
Ajuste obrigatório no backend:
- habilitar **Email & Password**
- revisar o método **Google**
- verificar se o projeto está usando credenciais Google próprias ou as gerenciadas pelo Lovable Cloud

Se estiver usando credenciais próprias:
- copiar a URL exata de callback mostrada nas configurações de autenticação
- cadastrar exatamente essa URL no Google OAuth
- validar também o domínio publicado `https://copyhub.lovable.app`

Se não houver necessidade de credenciais próprias:
- voltar para o Google gerenciado pelo Lovable Cloud, que evita divergência de callback

### 2) Ajustar o fluxo de Google no frontend
Em `src/contexts/AuthContext.tsx`:
- manter `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- não adicionar params extras desnecessários
- manter a detecção de webview/Obsidian

Em `src/pages/Auth.tsx`:
- navegador normal: botão Google faz login normal
- Obsidian/webview: botão Google não tenta autenticar dentro do webview; ele abre o login no navegador externo
- mensagem clara explicando que, no Obsidian, o método recomendado é email/senha

### 3) Fazer o login manual funcionar de ponta a ponta
Em `src/pages/Auth.tsx` e `src/contexts/AuthContext.tsx`:
- manter login por email + senha como fluxo oficial
- tratar erro de provider desabilitado com mensagem clara
- manter normalização de email (`trim + lowercase`)

No backend de autenticação:
- confirmar que email/password está ativo
- manter criação de sessão normal via `signInWithPassword`

### 4) Reforçar a definição de senha pelo admin
Em `supabase/functions/admin-usuarios/index.ts`:
- manter `set_password`
- manter verificação de existência do usuário
- manter `email_confirm: true` ao atualizar senha
- retornar resposta explícita de sucesso/erro para a UI

Em `src/pages/GerenciarUsuarios.tsx`:
- exibir confirmação real apenas quando o backend responder sucesso
- melhorar a mensagem quando o usuário ainda não existe na autenticação
- opcionalmente informar que a senha só funciona para usuários que já possuem conta criada

### 5) Validar o cenário real de uso
Após a implementação, validar estes fluxos:

1. Google no navegador:
- clicar em “Entrar com Google”
- autenticar
- voltar para o sistema
- sessão criada e persistida

2. Senha manual:
- admin define senha
- usuário entra com email/senha
- sessão criada e persistida

3. Obsidian:
- email/senha funciona dentro do app
- Google, se usado, abre fora do webview em vez de quebrar com `redirect_uri_mismatch`

## Arquivos/áreas a ajustar

- `src/contexts/AuthContext.tsx`
- `src/pages/Auth.tsx`
- `src/pages/GerenciarUsuarios.tsx`
- `supabase/functions/admin-usuarios/index.ts`
- configurações de autenticação do Lovable Cloud (Email + Google)

## Resultado esperado

Ao final:
- o erro `redirect_uri_mismatch` deixa de acontecer no navegador normal
- senha criada pelo admin passa a funcionar de verdade
- login manual deixa de falhar com `Email logins are disabled`
- o Obsidian volta a ter um caminho confiável de acesso via email/senha
