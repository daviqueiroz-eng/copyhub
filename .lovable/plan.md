

## Plano: Upload de Foto do Mentorado + Exibir no Carrossel Tab

### Resumo

Adicionar upload de imagem na ficha do mentorado (no Sheet de detalhes). A imagem será salva no storage e a URL persistida no campo `avatar` da tabela `mentorados`. No carrossel de Tab, os cards mostrarão a foto ao invés das iniciais quando disponível.

---

### Arquivos a Modificar

| Arquivo | Descrição |
|---------|-----------|
| migration | Criar bucket `mentorado-avatars` (público) com RLS |
| `src/pages/Mentorados.tsx` | Adicionar input de upload de foto no header do Sheet + lógica de upload |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Usar `m.avatar` no carrossel Tab |

---

### 1. Migração - Bucket de Storage

Criar bucket público `mentorado-avatars` com políticas RLS para que usuários autenticados possam fazer upload e leitura:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('mentorado-avatars', 'mentorado-avatars', true);

CREATE POLICY "Users can upload mentorado avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'mentorado-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update mentorado avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'mentorado-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view mentorado avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'mentorado-avatars');
```

---

### 2. Mentorados.tsx - Upload de Foto no Sheet

No header do Sheet (onde aparece o Avatar com iniciais, linha ~342-347), tornar o avatar clicável para upload:

- Adicionar um `<input type="file" hidden>` com ref
- Ao clicar no avatar, abrir o file picker
- Ao selecionar arquivo: upload para `mentorado-avatars/{mentoradoId}/avatar.{ext}`, obter URL pública e salvar no campo `avatar` do mentorado via `handleUpdateMentorado("avatar", url)`
- Mostrar a imagem se `avatar` existir via `<AvatarImage>`

```tsx
<Avatar className="h-16 w-16 cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
  <AvatarImage src={selectedMentorado?.avatar || undefined} />
  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
    {selectedMentorado?.iniciais}
  </AvatarFallback>
</Avatar>
<input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
```

Lógica de upload:
```typescript
const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !selectedMentorado) return;
  
  const ext = file.name.split('.').pop();
  const path = `${selectedMentorado.id}/avatar.${ext}`;
  
  await supabase.storage.from('mentorado-avatars').upload(path, file, { upsert: true });
  const { data } = supabase.storage.from('mentorado-avatars').getPublicUrl(path);
  
  handleUpdateMentorado("avatar", data.publicUrl);
};
```

---

### 3. Carrossel Tab - Exibir Foto

Atualizar o card no carrossel (linha ~3129-3131) para mostrar a imagem quando disponível:

**De:**
```tsx
<div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
  {m.iniciais}
</div>
```

**Para:**
```tsx
{m.avatar ? (
  <img src={m.avatar} alt={m.nome} className="w-16 h-16 rounded-full object-cover" />
) : (
  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
    {m.iniciais}
  </div>
)}
```

---

### Visual

```text
Sheet do Mentorado:
┌────────────────────────────┐
│  [FOTO]  Davi teste        │  <- Clicar na foto abre file picker
│          Plano Pro         │
│                            │
│  Avatar | Comunicação | ...│
└────────────────────────────┘

Carrossel Tab:
┌──────────────────────────────────────────────────────┐
│                 (fundo escuro blur)                    │
│                                                        │
│   [foto]  [foto]  [DT]  [foto]  [AB]                  │
│   Ana     Bia     Davi  Eva     Alex                   │
│                                                        │
│   <- fotos reais quando disponíveis, iniciais quando não ->│
└──────────────────────────────────────────────────────┘
```
