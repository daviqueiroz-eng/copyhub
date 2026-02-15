

## Plano: Comando /4 para abrir iframe integrado

### Resumo

Ao digitar `/4` em qualquer campo de headline ou roteiro, um dialog fullscreen sera aberto contendo um iframe do site `http://52.70.107.176:3000/dashboard/4/new-chat/21`. O comando funciona nos campos normais e nos blocos de Overdelivery.

---

### Arquivos a Modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Adicionar estado e handler para /4, renderizar dialog com iframe |
| `src/components/mentorados/OverdeliveryView.tsx` | Adicionar handler para /4, propagar abertura do dialog para o pai |
| `src/components/mentorados/SlashCommandPopover.tsx` | Adicionar /4 na legenda do footer |

---

### Detalhes

**1. MentoradoRoteirosView.tsx**

- Novo estado: `showIframeDialog` (boolean)
- Na funcao de deteccao de comandos (linha ~1195), adicionar deteccao de `/4`:
  - Limpar o `/4` do texto (mesmo padrao do `/3`)
  - Setar `showIframeDialog = true`
  - Fechar o popover se estiver aberto
- Renderizar um `Dialog` fullscreen com o iframe:

```tsx
<Dialog open={showIframeDialog} onOpenChange={setShowIframeDialog}>
  <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0">
    <iframe
      src="http://52.70.107.176:3000/dashboard/4/new-chat/21"
      className="w-full h-full border-0 rounded-lg"
      title="Chat IA"
    />
  </DialogContent>
</Dialog>
```

**2. OverdeliveryView.tsx**

- Receber nova prop `onOpenIframeDialog` do pai
- Na deteccao de `/4`, limpar o texto e chamar `onOpenIframeDialog()`

**3. SlashCommandPopover.tsx - Legenda**

- Adicionar `/4` na linha de atalhos do footer do popover

**4. Legenda de Atalhos na sidebar**

- Adicionar linha `/4 Chat IA` na secao de Atalhos (linha ~2152)

---

### Resultado

O usuario digita `/4` em qualquer campo de headline ou roteiro e um dialog grande abre com o site integrado via iframe, permitindo interagir sem sair da pagina de roteiros.
