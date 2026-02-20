

## Plano: Auto-deteccao de Tipo por IA + Configuracao na Engrenagem + Fix de Scroll

### Resumo

Tres mudancas:
1. **Auto-deteccao de tipo**: Quando o usuario digita/cola uma headline, a IA analisa o texto e muda automaticamente o dropdown "Tipo..." para o tipo correto
2. **Configuracao na engrenagem**: Adicionar uma nova aba/secao no dialog que abre ao clicar na engrenagem do "Revisar" para configurar as regras de deteccao automatica de tipo (com campo de instrucoes para ensinar a IA)
3. **Fix de scroll**: Corrigir o scroll do `CheckRoteiroViralDialog` para permitir rolar o conteudo

---

### Detalhes Tecnicos

#### 1. Nova coluna na tabela `tipos_roteiro`

Adicionar `palavras_chave` (text, nullable) e `instrucoes_deteccao` (text, nullable) para cada tipo de roteiro. O campo `palavras_chave` armazena palavras/frases separadas por virgula que ajudam na deteccao rapida. O campo `instrucoes_deteccao` guarda instrucoes para a IA aprender a identificar o tipo.

**Migracao SQL:**
```sql
ALTER TABLE tipos_roteiro 
  ADD COLUMN palavras_chave text,
  ADD COLUMN instrucoes_deteccao text;
```

#### 2. Edge Function `detectar-tipo-roteiro`

Nova edge function que recebe a headline e a lista de tipos (com nomes, palavras-chave e instrucoes) e retorna o ID do tipo detectado:

- Usa Lovable AI (google/gemini-3-flash-preview)
- Prompt do sistema: "Voce e um classificador de headlines de video. Com base na headline fornecida e nas descricoes dos tipos disponiveis, retorne o tipo mais adequado."
- Retorna `{ tipo_id: string | null }` usando tool calling para output estruturado
- Se nenhum tipo for identificado, retorna null

#### 3. Logica de auto-deteccao no `MentoradoRoteirosView.tsx`

- Apos o usuario terminar de digitar a headline (debounce 2s apos parar de digitar OU no blur do campo headline):
  - Se a headline tiver conteudo significativo (> 10 caracteres)
  - Se o tipo ainda nao foi definido manualmente (tipo_roteiro_id == null)
  - Chamar a edge function com a headline e os tipos disponiveis
  - Se retornar um tipo, atualizar automaticamente o dropdown
- O usuario pode sempre mudar manualmente depois (a auto-deteccao so roda quando nao tem tipo selecionado)
- Mostrar um indicador sutil (Loader2 pequeno ao lado do select) enquanto detecta

#### 4. Configuracao na engrenagem do "Revisar"

Modificar o `CheckRoteiroViralDialog` para ter 2 abas:
- **Aba 1: "Checks Virais"** (conteudo atual - regras de validacao)
- **Aba 2: "Deteccao de Tipo"** (nova - configurar como a IA detecta tipos)

Na aba "Deteccao de Tipo":
- Lista dos tipos de roteiro existentes (da tabela `tipos_roteiro`)
- Para cada tipo, campos editaveis:
  - Nome (readonly, vem do tipo)
  - Palavras-chave (input - separadas por virgula)
  - Instrucoes para IA (textarea - descrever como identificar este tipo)
- Botao "Salvar" que atualiza os campos na tabela `tipos_roteiro`
- Botao "Testar" que pega a headline atual e roda a deteccao para validar

#### 5. Fix de scroll no `CheckRoteiroViralDialog`

O dialog atual usa `max-h-[85vh]` mas o `ScrollArea` pode nao estar respeitando o limite. Correcao:
- Adicionar `overflow-hidden` no `DialogContent`
- Garantir que o `ScrollArea` tenha altura calculada corretamente com `max-h` explicito
- Usar `flex flex-col` e `min-h-0` para garantir que o flex child permita scroll

---

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/detectar-tipo-roteiro/index.ts` | Edge function que classifica headline em tipo usando IA |

### Arquivos a Modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useTiposRoteiro.ts` | Adicionar campos `palavras_chave` e `instrucoes_deteccao` no tipo |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Adicionar logica de auto-deteccao com debounce |
| `src/components/mentorados/CheckRoteiroViralDialog.tsx` | Adicionar aba "Deteccao de Tipo" + fix de scroll |
| `src/components/mentorados/RoteiroChecklist.tsx` | Nenhuma mudanca necessaria (engrenagem ja abre o dialog) |

---

### Fluxo do Usuario

1. Usuario abre roteiros de um mentorado
2. Digita uma headline: "faca essas 3 coisas se quiser ser mais produtivo em 2026!!"
3. Apos 2 segundos sem digitar, um loader aparece ao lado do dropdown "Tipo..."
4. A IA identifica que e um tipo "Lista" e automaticamente muda o dropdown
5. Para configurar a deteccao, clica na engrenagem do "Revisar" no checklist
6. No dialog, vai para a aba "Deteccao de Tipo"
7. Para o tipo "Lista", adiciona palavras-chave: "3 coisas, 5 dicas, X maneiras"
8. Adiciona instrucoes: "Headlines que prometem uma quantidade especifica de itens, dicas ou passos"
9. Salva e testa com uma headline para validar

