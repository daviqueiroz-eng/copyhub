
## Plano: Implementar Check do Roteiro Viral

### Visao Geral

Criar um sistema de verificacao automatica de roteiros virais onde:
1. **Apenas administradores** podem cadastrar itens de check (regras/padroes) e como identifica-los
2. O acesso de configuracao e feito clicando em "Revisar" no cronometro (item do checklist)
3. Os checks aparecem ao lado de cada roteiro quando as regras nao estao sendo cumpridas

---

### Layout do Check do Roteiro Viral

Seguindo a imagem de referencia, os checks aparecerao ao lado de cada roteiro:

```text
+--------------------------------+     +----------------------+
| HEADLINE 05:                   |     | Check do             |
| X coisas incriveis...          |     | roteiro viral        |
|--------------------------------|     |----------------------|
| ESTRUTURA 05:                  |     | ○ faltou cta         |
| Primeiro, seu gosto por        |     | ○ sem apresentacao   |
| comida muda de verdade...      |     | ○ Nome do mentorado  |
|                                |     |   errado             |
|                   1139 chars   |     | ○ sem itensificador  |
+--------------------------------+     +----------------------+
```

---

### Estrutura do Banco de Dados

Nova tabela `check_roteiro_viral`:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Identificador unico |
| nome | text | Nome do check (ex: "faltou cta") |
| descricao | text | Descricao do que o check verifica |
| regra_tipo | text | Tipo de regra: "contem", "nao_contem", "regex", "mentorado_nome" |
| regra_valor | text | Valor a verificar (ex: palavras-chave, padrao regex) |
| campo | text | Campo a verificar: "headline", "estrutura", "ambos" |
| ativo | boolean | Se o check esta ativo |
| ordem | integer | Ordem de exibicao |
| created_at | timestamp | Data de criacao |

---

### Tipos de Regras Suportadas

1. **contem** - Texto deve conter determinadas palavras (para CTA, apresentacao, etc)
2. **nao_contem** - Texto NAO deve conter determinadas palavras
3. **regex** - Padrao regex para verificacoes mais complexas
4. **mentorado_nome** - Verificar se o nome do mentorado aparece corretamente no texto

---

### Exemplos de Checks Pre-configurados

| Nome | Regra Tipo | Regra Valor | Campo |
|------|------------|-------------|-------|
| "faltou cta" | contem | "segue, siga, compartilha, curte" | estrutura |
| "sem apresentacao" | contem | "eu me chamo, meu nome, eu sou" | estrutura |
| "Nome do mentorado errado" | mentorado_nome | - | estrutura |
| "sem intensificador" | contem | "como nunca antes, de verdade, realmente" | estrutura |

---

### Arquivos a Criar/Modificar

| Arquivo | Mudancas |
|---------|----------|
| **Migracao SQL** | Criar tabela `check_roteiro_viral` com RLS (apenas admin escreve) |
| `src/hooks/useCheckRoteiroViral.ts` | Hook para CRUD dos checks (admin) e leitura (todos) |
| `src/components/mentorados/CheckRoteiroViralDialog.tsx` | Dialog para admin gerenciar checks (abre pelo "Revisar") |
| `src/components/mentorados/CheckRoteiroViralPanel.tsx` | Painel lateral que mostra checks nao cumpridos |
| `src/components/mentorados/RoteiroChecklist.tsx` | Adicionar botao de config no item "Revisar" (apenas admin) |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Integrar o painel de checks ao lado dos roteiros |

---

### Detalhes Tecnicos

#### 1. Migracao SQL

```sql
CREATE TABLE public.check_roteiro_viral (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  regra_tipo TEXT NOT NULL DEFAULT 'contem', -- contem, nao_contem, regex, mentorado_nome
  regra_valor TEXT, -- palavras separadas por virgula ou regex
  campo TEXT NOT NULL DEFAULT 'estrutura', -- headline, estrutura, ambos
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS: Todos podem ler, apenas admin pode modificar
ALTER TABLE public.check_roteiro_viral ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver checks"
  ON public.check_roteiro_viral FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admin pode criar checks"
  ON public.check_roteiro_viral FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode atualizar checks"
  ON public.check_roteiro_viral FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode deletar checks"
  ON public.check_roteiro_viral FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

#### 2. Hook useCheckRoteiroViral

```typescript
export interface CheckRoteiroViral {
  id: string;
  nome: string;
  descricao: string | null;
  regra_tipo: 'contem' | 'nao_contem' | 'regex' | 'mentorado_nome';
  regra_valor: string | null;
  campo: 'headline' | 'estrutura' | 'ambos';
  ativo: boolean;
  ordem: number;
  created_at: string;
}

// Query para buscar todos os checks ativos
// Mutations para CRUD (verificando role admin)
```

#### 3. Funcao de Verificacao

```typescript
const verificarCheck = (
  check: CheckRoteiroViral,
  headline: string,
  estrutura: string,
  mentoradoNome: string
): boolean => {
  const textoParaVerificar = check.campo === 'headline' 
    ? headline 
    : check.campo === 'estrutura' 
      ? estrutura 
      : `${headline} ${estrutura}`;

  switch (check.regra_tipo) {
    case 'contem':
      // Verificar se ALGUMA das palavras aparece
      const palavras = check.regra_valor?.split(',').map(p => p.trim().toLowerCase()) || [];
      return palavras.some(p => textoParaVerificar.toLowerCase().includes(p));
      
    case 'nao_contem':
      // Verificar se NENHUMA das palavras aparece
      const palavrasProibidas = check.regra_valor?.split(',').map(p => p.trim().toLowerCase()) || [];
      return !palavrasProibidas.some(p => textoParaVerificar.toLowerCase().includes(p));
      
    case 'regex':
      const regex = new RegExp(check.regra_valor || '', 'i');
      return regex.test(textoParaVerificar);
      
    case 'mentorado_nome':
      // Verificar se nome do mentorado aparece (primeiro nome ou nome completo)
      const primeiroNome = mentoradoNome.split(' ')[0].toLowerCase();
      return textoParaVerificar.toLowerCase().includes(primeiroNome);
      
    default:
      return true;
  }
};
```

#### 4. Integracao no RoteiroChecklist - Botao de Config no "Revisar"

```tsx
// No item "Revisar" do checklist
{item.id === "revisar" && isAdmin && (
  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6"
    onClick={() => setShowCheckViralDialog(true)}
    title="Configurar checks do roteiro viral"
  >
    <Settings className="h-3.5 w-3.5" />
  </Button>
)}
```

#### 5. Painel de Checks ao Lado dos Roteiros

No `MentoradoRoteirosView`, o painel aparecera entre o roteiro e o checklist (ou ao lado direito de cada roteiro individualmente):

```tsx
// Por roteiro - mostrar checks que falharam
const checksQueFalharam = checksAtivos.filter(check => 
  !verificarCheck(check, roteiro.headline, roteiro.estrutura, mentoradoNome)
);

{checksQueFalharam.length > 0 && (
  <CheckRoteiroViralPanel 
    checks={checksQueFalharam}
    className="mt-4"
  />
)}
```

---

### Fluxo de Uso

**Para Administrador:**
1. Vai ate a pagina de roteiros de qualquer mentorado
2. No checklist lateral, no item "Revisar", clica no icone de config (engrenagem)
3. Abre o dialog de gerenciamento de checks
4. Pode criar/editar/excluir/reordenar os checks
5. Define regras como "contem palavras X" ou "nao contem Y"

**Para Usuarios:**
1. Ao editar roteiros, veem automaticamente os checks que falharam
2. Cada roteiro mostra apenas os checks que NAO passaram
3. Quando corrigem o texto, o check some automaticamente (reativo)

---

### Design do CheckRoteiroViralPanel

Layout visual inspirado na imagem de referencia:

```tsx
<div className="border rounded-xl p-4 bg-background">
  <h4 className="font-bold text-center mb-4">
    Check do<br/>roteiro viral
  </h4>
  <div className="space-y-3">
    {checksQueFalharam.map(check => (
      <div key={check.id} className="flex items-center gap-2 border rounded-lg p-3">
        <div className="w-4 h-4 rounded-full border-2 border-current" />
        <span className="text-sm font-medium">{check.nome}</span>
      </div>
    ))}
  </div>
</div>
```

---

### Consideracoes

- Checks sao globais (nao por usuario) - todos veem os mesmos
- Apenas admin pode criar/editar/excluir
- Verificacao e feita em tempo real no frontend (reativo)
- Quando roteiro passa em todos os checks, o painel nao aparece
- Interface acessivel via checklist para manter fluxo de trabalho
