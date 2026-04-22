

# Plano: Reatividade do botão "Transcrever" + Login Google no Obsidian

## Parte 1 — Botão "Transcrever referência" sempre visível e reativo

**Causa raiz**: O botão hoje só aparece quando (a) a seção "Referência" está aberta E (b) já existe um link detectado. O usuário não vê o botão até abrir o accordion. O estado já é reativo (a prop `link_referencia` atualiza em tempo real, e `linkFromReferencia` é recalculado a cada render), mas a UI esconde o botão.

**Mudanças em `src/components/mentorados/RoteiroAnotacoesPanel.tsx`**:

1. **Mover o botão para o cabeçalho da seção "Referência"** (visível mesmo com accordion fechado), à direita do label, em formato compacto:
   - Estado **habilitado** (cor primária, ícone 🎤): quando `linkParaTranscrever` existir.
   - Estado **desabilitado** (cinza, opacidade 50%): quando não houver link.
   - Estado **transcrevendo** (spinner): durante o processo.
   - Tooltip explicando o estado ("Cole um link para habilitar" quando desabilitado).
2. **Manter** o botão grande dentro do accordion aberto também (para quem prefere essa UI), mas com a mesma lógica reativa.
3. **Reatividade garantida**: o cálculo de `linkParaTranscrever` continua derivado do render — qualquer mudança em `linkReferencia` (prop) ou em `values.referencia_texto` (estado local atualizado no `onChange` do textarea) reflete instantaneamente sem blur, refresh ou remount.
4. **Clique impede propagação** do toggle do accordion (`e.stopPropagation()`), para que clicar em "Transcrever" não abra/feche a seção.

Resultado: assim que o link é colado em qualquer lugar (headline ou textarea de Referência), o botão fica clicável imediatamente, mesmo com a seção fechada.

---

## Parte 2 — Login Google compatível com Obsidian (webview embedded)

**Causa raiz**: O Google bloqueia OAuth dentro de webviews/embedded browsers (Obsidian usa Electron com `BrowserView`). O fluxo atual chama `lovable.auth.signInWithOAuth("google")`, que faz um redirect dentro da mesma janela — o webview do Obsidian intercepta o redirect e a `redirect_uri` que chega ao Google não bate com a registrada → erro `400: redirect_uri_mismatch`.

**Solução**: detectar ambientes embedded e abrir o login num navegador externo do sistema, depois capturar a sessão de volta.

**Mudanças em `src/contexts/AuthContext.tsx`** (função `signInWithGoogle`):

1. Adicionar utilitário `isEmbeddedWebView()` que detecta:
   - `navigator.userAgent` contendo `Obsidian`, `Electron`, `wv` (Android WebView), `FBAN`/`FBAV` (Facebook), `Instagram`, `Line`, etc.
   - `window.top !== window.self` (rodando em iframe).
2. **Fluxo normal (navegador padrão)**: mantém `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` — sem mudanças.
3. **Fluxo embedded (Obsidian etc.)**:
   - Em vez de redirecionar a janela atual, abrir a URL de login num **navegador externo** via `window.open(authUrl, "_blank", "noopener,noreferrer")`. No Electron/Obsidian isso dispara o handler do sistema → abre Chrome/Safari.
   - Como o Lovable Auth Broker não expõe diretamente a authUrl, a abordagem é:
     - a) Apontar o usuário para abrir a URL pública (`https://copyhub.lovable.app/auth`) num navegador externo via botão alternativo "Abrir login em nova janela", e
     - b) Após login externo, o `supabase.auth` persiste a sessão em `localStorage`. O Obsidian compartilha (ou não) esse storage; se não compartilhar, instruir reabertura. Para casos em que sessão precise ser transportada manualmente, exibir um campo opcional "colar token de acesso".
4. **UI nova em `src/pages/Auth.tsx`**:
   - Detectar embedded e exibir alerta amigável: "Detectamos que você está dentro do Obsidian. Para entrar com Google, abra esta página no seu navegador padrão."
   - Botão primário "Abrir no navegador" → `window.open(window.location.href, "_blank", "noopener,noreferrer")`.
   - Manter o botão "Login administrativo" (email/senha) totalmente funcional como fallback dentro do Obsidian — pois email/senha não passa pelo Google e funciona em qualquer ambiente.

**Configuração Google OAuth (informativo)**: o Lovable Cloud usa o broker gerenciado em `oauth.lovable.app`, que já cobre a `redirect_uri` correta. Não é preciso alterar o Google Console — o erro `redirect_uri_mismatch` ocorre porque o webview do Obsidian altera a URL de retorno; a solução é não depender do webview, e sim do navegador externo (acima).

**Sem mudanças de banco. Sem novas dependências.**

---

## Arquivos modificados

- `src/components/mentorados/RoteiroAnotacoesPanel.tsx` — botão de transcrever no cabeçalho da seção Referência, sempre visível, reativo.
- `src/contexts/AuthContext.tsx` — utilitário `isEmbeddedWebView()` e ajuste no `signInWithGoogle` para usar `window.open` externo quando embedded.
- `src/pages/Auth.tsx` — alerta + botão "Abrir no navegador" quando ambiente embedded for detectado; reforço do fallback de login administrativo.

