

## Plano: Transformar Resposta do n8n no Formato Esperado

### Problema Identificado

O n8n está retornando a resposta neste formato:
```json
[{"output":"X remédios de farmácia..."}]
```

Mas o frontend espera:
```json
{ "roteiros": [{ "key": "1-1", "estrutura": "..." }] }
```

O n8n retorna um array com a propriedade `output`, enquanto o código espera um objeto com `roteiros` contendo `key` e `estrutura`.

---

### Solução

Modificar a Edge Function para:
1. Guardar os `keys` do payload original
2. Transformar a resposta do n8n para o formato esperado
3. Mapear cada `output` de volta para seu respectivo `key`

---

### Lógica de Transformação

```text
ENTRADA (payload enviado para n8n):
{
  "roteiros": [
    { "key": "1-2", "headline": "X remédios..." }
  ]
}

RESPOSTA DO N8N:
[
  { "output": "Texto do roteiro gerado..." }
]

RESPOSTA TRANSFORMADA (para o frontend):
{
  "roteiros": [
    { "key": "1-2", "estrutura": "Texto do roteiro gerado..." }
  ]
}
```

---

### Mudanças na Edge Function

Atualizar `supabase/functions/n8n-webhook/index.ts`:

```typescript
// Guardar os keys do payload original
const originalKeys = payload.roteiros?.map((r: { key: string }) => r.key) || [];

// ... fazer o fetch para n8n ...

// Transformar resposta do n8n
let transformedData;

if (Array.isArray(data)) {
  // N8n retorna array de { output: string }
  transformedData = {
    roteiros: data.map((item: { output: string }, index: number) => ({
      key: originalKeys[index] || `unknown-${index}`,
      estrutura: item.output || "",
    })),
  };
} else if (data.roteiros) {
  // Já está no formato correto
  transformedData = data;
} else {
  // Formato desconhecido
  transformedData = { roteiros: [] };
}

return new Response(JSON.stringify(transformedData), { ... });
```

---

### Resultado Esperado

Quando o n8n retornar:
```json
[{"output":"Texto do roteiro..."}]
```

A Edge Function transformará para:
```json
{
  "roteiros": [
    { "key": "1-2", "estrutura": "Texto do roteiro..." }
  ]
}
```

E o frontend conseguirá:
1. Encontrar o roteiro pela `key`
2. Preencher o campo `estrutura` com o texto gerado
3. Salvar no banco de dados

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/n8n-webhook/index.ts` | Adicionar transformação da resposta do n8n |

