

## Plano: Chat de Revisão Inline nos Roteiros ✅ IMPLEMENTADO

### Resumo

O "Modo Revisar" separado (RoteiroRevisaoDialog como dialog full-screen) foi substituído por um **chat inline** que aparece diretamente abaixo de cada roteiro que tem texto na estrutura.

---

### Componentes Criados/Modificados

| Arquivo | Status |
|---------|--------|
| `src/components/mentorados/RoteiroInlineChat.tsx` | ✅ CRIADO - Chat compacto por roteiro |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | ✅ MODIFICADO - Integração do chat inline |
| `src/components/mentorados/RoteiroChecklist.tsx` | ✅ MODIFICADO - Removido callback onRevisarPlay |
| `src/components/mentorados/RoteiroRevisaoDialog.tsx` | ⚠️ Mantido mas não utilizado |

---

### Funcionalidades do Chat Inline

1. **Aparece automaticamente** quando a estrutura tem texto
2. **Input estilo Claude/Lovable** com textarea + botões abaixo
3. **Botão "+"** para tipos de ajuste
4. **Seletor de tipo de chat** (Padrão, ou tipos personalizados)
5. **Histórico de mensagens** por roteiro (colapsável)
6. **Atualiza roteiro automaticamente** via edge function `revisar-roteiro`

---

### Layout Implementado

```text
+--------------------------------------------------+
| ○  HEADLINE 05:                                  |
| X coisas incríveis que vão acontecer...          |
+--------------------------------------------------+
| ESTRUTURA 05:                                    |
| [textarea com texto do roteiro]                  |
|                                  1139 caracteres |
+--------------------------------------------------+
| [Mensagens do chat - colapsável]                 |
+--------------------------------------------------+
| +------------------------------------------+     |
| | Responder...                             |     |
| +------------------------------------------+     |
|                                                  |
| [+] [Clock]               [Tipo Chat v] [>]      |
+--------------------------------------------------+
```

---

### Próximos Passos Opcionais

- [ ] Remover completamente RoteiroRevisaoDialog.tsx
- [ ] Persistir histórico de mensagens no localStorage
- [ ] Adicionar atalhos de teclado (Ctrl+Enter já implementado)
