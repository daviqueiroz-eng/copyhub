
Objetivo: fazer o login com Google voltar a funcionar de forma estável, sem perder nenhum dado, e sair do ciclo de “erro diferente a cada tentativa”.

## Problema identificado

O frontend não é o problema principal.

Pelo código atual:
- o app usa `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- não existe `supabase.auth.signInWithOAuth(...)` no projeto
- portanto, não há mistura de fluxo OAuth direto no código cliente

Pelas telas enviadas:
- o provider Google continua em **Your own credentials**
- o erro deixou de ser `redirect_uri_mismatch` e virou `failed to exchange authorization code`

Isso mostra que:
1. o Google já está aceitando o login
2. o callback já está chegando
3. a falha agora acontece no **exchange server-side do code por sessão**

Conclusão: o ponto mais provável é **configuração inconsistente das credenciais customizadas** no backend:
- `client_id` e `client_secret` não pertencem exatamente ao mesmo OAuth Client
- ou houve rotação/troca de secret e o valor salvo no backend não corresponde mais ao client atual
- ou o provider ainda está em modo BYOK quando o fluxo do app está preparado para operar melhor com o broker gerenciado

## O que será feito

### 1) Restaurar o caminho confiável primeiro
Reconfigurar o provider Google para **Managed by Lovable** no backend.

Isso é a forma mais segura de restaurar o login imediatamente porque:
- elimina dependência do `client_id`/`client_secret` customizados que hoje parecem inconsistentes
- usa o broker gerenciado já compatível com o fluxo `lovable.auth.signInWithOAuth`
- evita nova divergência entre Google Cloud e a configuração do backend

### 2) Validar o fluxo completo no domínio publicado
Testar especificamente no ambiente publicado:
- abrir `/auth`
- clicar em **Entrar com Google**
- validar:
  - tela do Google
  - retorno ao app
  - criação de sessão
  - usuário autenticado

A validação principal será no domínio publicado (`copyhub.lovable.app`), que é o fluxo real de produção.

### 3) Confirmar que não há regressão no login manual
Como o login por email/senha já voltou a funcionar, ele será mantido intocado.
Nada será alterado em:
- usuários
- senhas
- perfis
- whitelist
- roles
- sessões já existentes

### 4) Só se houver necessidade futura de credenciais próprias
Se depois você quiser voltar a usar credenciais próprias do Google, a volta para BYOK deve ser feita do jeito correto:
- criar ou revisar **um único OAuth Client Web** no mesmo projeto Google
- usar exatamente o `client_id` e o `client_secret` desse mesmo client
- cadastrar apenas os redirect URLs mostrados pelo backend
- revalidar o fluxo inteiro

Mas isso fica como etapa opcional posterior. Para resolver agora, a prioridade é **tirar o app do modo BYOK quebrado e voltar para o modo gerenciado estável**.

## Arquivos e áreas impactadas

### Configuração backend
- provider Google no Lovable Cloud

### Código do projeto
Nenhum arquivo precisa ser alterado para restaurar o login, porque o código cliente atual já está usando o método correto.

## Garantias

Nada será apagado ou resetado:
- `auth.users`
- `profiles`
- `user_roles`
- `allowed_emails`
- senhas manuais já definidas
- dados dos usuários
- arquivos armazenados

Também não haverá:
- migração SQL
- exclusão de usuários
- troca de estrutura do banco
- mudança no fluxo de email/senha

## Resultado esperado

Ao final:
- o botão **Entrar com Google** volta a funcionar
- o usuário autentica normalmente com a conta Google
- o callback completa
- o code exchange cria a sessão
- o usuário entra na plataforma sem erro

## Critério de sucesso

O problema será considerado resolvido quando o fluxo abaixo funcionar sem erro:
`Login Google -> callback -> sessão criada -> redirecionamento para /mentorados`
