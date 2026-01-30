

## Plano: Integrar Instagram Reels (Inteligencia Core) via Iframe

### Resumo

Adicionar uma nova pagina que exibe a ferramenta de extracao de transcricoes de reels do Inteligencia Core via iframe, seguindo o mesmo padrao ja utilizado no "Core Manager".

---

### O que sera feito

1. **Criar nova pagina**: `src/pages/InstagramReels.tsx` com iframe apontando para `https://inteligenciacore.com.br/dashboard/admin/instagram-reels`

2. **Adicionar rota no App.tsx**: Nova rota `/instagram-reels` protegida

3. **Adicionar ao menu lateral**: Novo item no `AppSidebar.tsx` com icone apropriado (Instagram ou Video)

---

### Layout da Nova Pagina

```text
+----------------------------------------------------------+
| Instagram Reels                                           |
| Extracao de transcricoes de videos                        |
+----------------------------------------------------------+
|                                                          |
|   [IFRAME - inteligenciacore.com.br/dashboard/admin/     |
|              instagram-reels]                             |
|                                                          |
|   (ocupando 100% da altura disponivel)                    |
|                                                          |
+----------------------------------------------------------+
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/InstagramReels.tsx` | CRIAR | Nova pagina com iframe |
| `src/App.tsx` | MODIFICAR | Adicionar rota `/instagram-reels` |
| `src/components/AppSidebar.tsx` | MODIFICAR | Adicionar item no menu lateral |

---

### Codigo da Nova Pagina

```tsx
// src/pages/InstagramReels.tsx
const InstagramReels = () => {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="border-b bg-background p-4">
        <h1 className="text-2xl font-bold text-foreground">Instagram Reels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Extracao de transcricoes de videos
        </p>
      </div>
      <div className="flex-1 relative">
        <iframe
          src="https://inteligenciacore.com.br/dashboard/admin/instagram-reels"
          className="absolute inset-0 w-full h-full border-0"
          title="Instagram Reels - Inteligencia Core"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default InstagramReels;
```

---

### Item do Menu Lateral

Sera adicionado um novo item com:
- **Titulo**: "Instagram Reels"
- **URL**: `/instagram-reels`
- **Icone**: `Video` ou `Instagram` (do lucide-react)
- **Posicao**: Abaixo do "Core Manager" ou proximo a ferramentas de analise

---

### Consideracoes Importantes

**Autenticacao:**
- O site do Inteligencia Core tem sua propria tela de login
- O usuario precisara fazer login no Inteligencia Core separadamente (dentro do iframe)
- O login do nosso sistema nao e compartilhado com o Inteligencia Core

**Restricoes de iframe:**
- Se o site do Inteligencia Core tiver protecao contra iframe (X-Frame-Options ou Content-Security-Policy), o embed nao funcionara
- Nesse caso, seria necessario contatar o administrador do Inteligencia Core para liberar o dominio do seu app

**Alternativa se iframe nao funcionar:**
- Abrir em nova aba (link externo) em vez de embed
- Ou consumir uma API do Inteligencia Core se disponivel

---

### Proximos Passos Apos Implementacao

1. Testar se o iframe carrega corretamente
2. Se nao carregar, verificar console do navegador por erros de CORS/X-Frame-Options
3. Se necessario, ajustar para abrir em nova aba

