

## Plano: Deteccao de Tipo via Webhook n8n

### Resumo

Substituir a deteccao de tipo por IA (edge function `detectar-tipo-roteiro`) por um webhook n8n. Quando o usuario termina de escrever a headline, o sistema envia a headline para o webhook configuravel. O n8n processa e retorna o nome do tipo (ex: "Lista util", "defesa de crenca"). O sistema compara o nome retornado com os tipos cadastrados e preenche automaticamente o dropdown.

---

### Mudancas

#### 1. Configuracao do webhook na aba "Deteccao de Tipo" (CheckRoteiroViralDialog)

Na aba "Deteccao de Tipo" que ja existe dentro da engrenagem, adicionar:
- Campo de URL do webhook (input) no topo, antes da lista de tipos
- Salvar a URL no localStorage (chave `webhook_deteccao_tipo_url`)
- Manter os campos de palavras-chave e instrucoes dos tipos como referencia/documentacao para o usuario configurar no n8n

#### 2. Substituir a logica de deteccao no MentoradoRoteirosView

Trocar a chamada da edge function `detectar-tipo-roteiro` por um `fetch` direto ao webhook n8n configurado:

- Enviar: `{ headline: "texto da headline" }`
- Esperar resposta: `{ tipo: "Lista util" }` (ou campo similar com o nome do tipo)
- Comparar o nome retornado (case-insensitive, trim) com `tiposRoteiro` cadastrados
- Se bater, preencher o dropdown automaticamente
- Se nao tiver webhook configurado, nao faz nada (skip silencioso)

#### 3. Teste na aba de configuracao

O botao "Testar" existente na aba "Deteccao de Tipo" tambem sera atualizado para usar o webhook ao inves da edge function.

---

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/mentorados/CheckRoteiroViralDialog.tsx` | Adicionar campo de URL do webhook na aba "Deteccao de Tipo", atualizar teste para usar webhook |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Trocar `supabase.functions.invoke("detectar-tipo-roteiro")` por `fetch` ao webhook n8n, match por nome do tipo |

### Nenhum arquivo novo necessario

A edge function `detectar-tipo-roteiro` pode ser mantida como fallback mas nao sera mais chamada.

---

### Fluxo

1. Usuario configura a URL do webhook na engrenagem > aba "Deteccao de Tipo"
2. Usuario digita uma headline no roteiro
3. Apos 2s sem digitar, sistema envia `{ headline }` para o webhook
4. n8n processa e retorna `{ tipo: "Lista util" }`
5. Sistema compara "Lista util" com os nomes dos tipos cadastrados
6. Se encontrar match, preenche o dropdown automaticamente

