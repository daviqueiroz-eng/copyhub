

# Plano: Restaurar login com Google (voltar ao broker gerenciado do Lovable)

## Diagnóstico

O erro `Erro 400: redirect_uri_mismatch` na tela do Google só acontece quando o app está usando **credenciais Google personalizadas (Client ID/Secret próprios)** que não têm o redirect URI exato cadastrado. No fluxo gerenciado pelo Lovable (`oauth.lovable.app`), os redirect URIs já vêm pré-registrados e esse erro **não ocorre**.

Mesmo nas tentativas anteriores, o provider Google segue configurado em modo "BYOK" (credenciais próprias) — por isso, todo login via Google quebra com `redirect_uri_mismatch` apesar do código frontend estar correto (`lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` sem params extras).

A correção é **trocar o provider Google de volta para o modo gerenciado do Lovable**, sem mexer em código de auth, em usuários, em senhas, em sessões ou em qualquer tabela.

## O que será feito

### 1) Reconfigurar o provider Google para o modo gerenciado
Usar a tool `supabase--configure_social_auth` para o provider `google` apontando para o broker oficial do Lovable. Isso:
- remove a dependência do Client ID/Secret personalizados que estão causando `redirect_uri_mismatch`
- ativa automaticamente os redirect URIs corretos (`copyhub.lovable.app`, `id-preview--…lovable.app`, `oauth.lovable.app/callback`)
- mantém o módulo `src/integrations/lovable/index.ts` exatamente como está (já está correto)

### 2) Validar o frontend (sem alterações de comportamento)
O código atual em `AuthContext.signInWithGoogle` já está correto:
- usa `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- não passa `prompt` nem outros `extraParams` que confundam o broker
- mantém detecção de Obsidian/webview para abrir externamente

Nenhum arquivo precisa ser alterado.

### 3) Validação após a troca
- Abrir `/auth` no navegador comum → clicar em **Entrar com Google** → deve redirecionar para a tela de consentimento Google **sem** `redirect_uri_mismatch` → voltar autenticado.
- Email/senha continua funcionando como hoje (não muda nada).
- Sessões existentes permanecem válidas.

## Garantias (o que NÃO será tocado)

- ✅ Nenhum SQL, migração ou tabela alterada
- ✅ `auth.users`, `profiles`, `user_roles`, `allowed_emails` intactos
- ✅ Senhas manuais definidas pelo admin permanecem válidas
- ✅ Sessões ativas dos usuários permanecem válidas
- ✅ Provider Email/Senha continua ativo
- ✅ Nenhum arquivo do código de auth precisa ser editado

## Arquivos modificados

Nenhum arquivo do projeto. A correção é exclusivamente na **configuração do provider Google no Lovable Cloud** (via tool de configuração de social auth).

## Resultado esperado

- O erro `redirect_uri_mismatch` deixa de aparecer na tela do Google.
- Login com Google volta a funcionar exatamente como funcionava antes — para `davi.queiroz@coreeducacao.com` e qualquer outro email da whitelist.
- Login por email/senha continua funcionando normalmente.
- No Obsidian, segue o comportamento atual (botão abre Google em navegador externo; email/senha funciona dentro do webview).

