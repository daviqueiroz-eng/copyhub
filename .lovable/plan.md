# Tornar o app instalável (PWA simples)

Abordagem manifest-only: o app fica instalável no celular (Adicionar à tela inicial) e no desktop (botão "Instalar" no Chrome/Edge), sem service worker e sem cache offline — assim evitamos qualquer risco de travar atualizações no editor do Lovable.

## O que será feito

1. **Criar `public/manifest.webmanifest`** com:
   - `name`: "Central da Equipe"
   - `short_name`: "Central"
   - `start_url`: "/"
   - `scope`: "/"
   - `display`: "standalone"
   - `background_color` e `theme_color`: branco / dourado (#B8860B) seguindo a identidade do projeto
   - `icons`: 192x192 e 512x512 (normal e maskable)

2. **Adicionar tags no `index.html`**:
   - `<link rel="manifest" href="/manifest.webmanifest">`
   - `<meta name="theme-color" content="#ffffff">`
   - `<meta name="apple-mobile-web-app-capable" content="yes">`
   - `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
   - `<meta name="apple-mobile-web-app-title" content="Central">`
   - `<link rel="apple-touch-icon" href="/icon-192.png">`

3. **Aguardar você enviar a imagem do ícone**. Quando enviar, eu:
   - Gero as versões 192x192, 512x512 e apple-touch-icon (180x180)
   - Coloco em `/public/` e atualizo o manifest

## O que NÃO será feito

- Sem `vite-plugin-pwa`, sem service worker, sem cache offline (evita problemas de cache no preview).
- Sem mudanças em lógica de negócio, autenticação ou backend.
- Sem `display: fullscreen` (mantemos `standalone`, que é o padrão para apps instalados).

## Como instalar depois de publicado

- **Android/Chrome**: menu → "Instalar app" / "Adicionar à tela inicial".
- **iPhone/Safari**: botão compartilhar → "Adicionar à Tela de Início".
- **Desktop (Chrome/Edge)**: ícone de instalação na barra de endereço.

## Próximo passo

Me envie a imagem que será o ícone do app (de preferência quadrada, mínimo 512x512) e eu finalizo a implementação.
