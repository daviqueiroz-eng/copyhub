

## Plano: Separar Versao Admin e Usuario no Upload de Excel

### Situacao Atual

O sistema ja tem suporte tecnico para headlines globais (`is_global = true`), mas a interface mistura tudo:

- O toggle "Compartilhar com toda a equipe" so aparece **apos** o admin selecionar um arquivo
- Nao ha uma separacao visual clara entre os modos
- Usuarios nao entendem facilmente que existem headlines compartilhadas pela equipe

---

### Solucao Proposta

Criar duas abas claras no dialogo de upload:

**Aba 1 - "Minhas Headlines"** (para todos)
- Usuario ve apenas SEUS arquivos importados
- Faz upload de arquivos que so ele ve

**Aba 2 - "Headlines da Equipe"** (para todos lerem, so admin escreve)
- Todos os usuarios veem os arquivos compartilhados pelo admin
- APENAS admin ve o botao de "Upload Excel" nesta aba
- Quando admin faz upload nesta aba, automaticamente `is_global = true`

---

### Layout Visual

```text
+----------------------------------------------------------+
|  Upload de Excel com Headlines                            X |
|----------------------------------------------------------|
| [Minhas Headlines] [Headlines da Equipe]                   |
|----------------------------------------------------------|
|                                                            |
|  Aba "Headlines da Equipe" (para usuario comum):          |
|  +------------------------------------------------------+ |
|  | [Arquivo] Headlines - Emagrecimento      (150)  [Eq] | |
|  | [Arquivo] Headlines - Cristaos           (200)  [Eq] | |
|  | [Arquivo] Headlines - Pets               (80)   [Eq] | |
|  +------------------------------------------------------+ |
|  Total: 430 headlines disponiveis da equipe               |
|                                                            |
|  Aba "Headlines da Equipe" (para ADMIN):                  |
|  [Upload Excel para Equipe]  <- botao de upload           |
|  +------------------------------------------------------+ |
|  | [Arquivo] Headlines - Emagrecimento (150) [Eq] [X]   | |
|  | [Arquivo] Headlines - Cristaos      (200) [Eq] [X]   | |
|  +------------------------------------------------------+ |
|                                                            |
+----------------------------------------------------------+
```

---

### Arquivos a Modificar

| Arquivo | Mudancas |
|---------|----------|
| `src/components/mentorados/ExcelUploadDialog.tsx` | Adicionar Tabs para separar "Minhas" vs "Equipe", logica condicional para admin |
| `src/hooks/useUserHeadlinesExcel.ts` | Adicionar query separada para headlines globais e pessoais |

---

### Detalhes Tecnicos

#### 1. Novo Hook: Separar Queries

```typescript
// Headlines pessoais do usuario (nao globais)
export const useMyHeadlinesExcel = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-headlines-excel", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_headlines_excel")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_global", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

// Headlines globais (da equipe)
export const useTeamHeadlinesExcel = () => {
  return useQuery({
    queryKey: ["team-headlines-excel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_headlines_excel")
        .select("*")
        .eq("is_global", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
```

#### 2. Interface com Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Dentro do DialogContent:
<Tabs defaultValue="minhas">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="minhas">Minhas Headlines</TabsTrigger>
    <TabsTrigger value="equipe">Headlines da Equipe</TabsTrigger>
  </TabsList>
  
  <TabsContent value="minhas">
    {/* Area de upload pessoal */}
    {/* Lista de arquivos proprios */}
  </TabsContent>
  
  <TabsContent value="equipe">
    {/* Area de upload - APENAS se isAdmin */}
    {isAdmin && <UploadArea ... isGlobal={true} />}
    
    {/* Lista de arquivos da equipe */}
    {teamFileGroups.map(...)}
    
    {/* Mensagem se nao for admin */}
    {!isAdmin && teamHeadlines.length === 0 && (
      <p>Nenhuma headline compartilhada pela equipe ainda.</p>
    )}
  </TabsContent>
</Tabs>
```

#### 3. Logica de Upload

Quando o upload for feito na aba "Equipe":
- `is_global` sera automaticamente `true`
- Apenas admins tem acesso a essa aba para upload

Quando o upload for feito na aba "Minhas":
- `is_global` sera `false`
- Qualquer usuario pode fazer upload

---

### Fluxo de Uso

**Usuario Comum:**
1. Abre o dialogo de upload
2. Ve aba "Minhas Headlines" - pode fazer upload pessoal
3. Ve aba "Headlines da Equipe" - ve headlines compartilhadas pelo admin (sem botao de upload)

**Admin:**
1. Abre o dialogo de upload
2. Aba "Minhas Headlines" - upload pessoal (so ele ve)
3. Aba "Headlines da Equipe" - upload que TODOS os usuarios verao

---

### Consideracoes

- O toggle de "Compartilhar" sera removido - a aba define isso automaticamente
- Na aba "Equipe", o admin ve botao de delete apenas para arquivos que ELE subiu
- Badges visuais: "Meu" (azul) na aba pessoal, "Equipe" (amarelo/globo) na aba de equipe
- Manter a query existente `useUserHeadlinesExcel` para uso no `HeadlinesRandomDialog` (que busca ambas)

