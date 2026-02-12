

## Plano: Substituir "Ordem de Prioridade" por iframe do Controle de Mentorado

### Resumo

Substituir o componente `OrdemPrioridadeView` no lado direito da pagina de Mentorados por um iframe que carrega `https://controledementorado.lovable.app/`. O layout split-screen se mantem (lista de mentorados a esquerda, iframe a direita).

---

### Arquivo a Modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/Mentorados.tsx` | Trocar `OrdemPrioridadeView` por iframe em ambos os layouts (mobile e desktop) |

---

### Mudancas

**1. Layout Desktop (xl+) - linhas 310-321**

Substituir o titulo "Ordem de Prioridade", subtitulo e o `<OrdemPrioridadeView />` por um iframe que ocupa todo o espaco disponivel:

```tsx
{/* Lado direito: Controle de Mentorado */}
<div className="flex-1 min-w-0 border-l flex flex-col min-h-0">
  <iframe
    src="https://controledementorado.lovable.app/"
    className="w-full h-full border-0"
    title="Controle de Mentorado"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    loading="lazy"
  />
</div>
```

**2. Layout Mobile - linhas 262-265**

Substituir a tab "prioridade" para tambem renderizar o iframe ao inves do componente:

```tsx
<TabsContent value="prioridade" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
  <iframe
    src="https://controledementorado.lovable.app/"
    className="w-full h-full border-0 min-h-[70vh]"
    title="Controle de Mentorado"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    loading="lazy"
  />
</TabsContent>
```

**3. Limpeza**

Remover o import do `OrdemPrioridadeView` ja que nao sera mais utilizado.

---

### Resultado

O lado direito do layout desktop ficara identico a segunda imagem de referencia: o iframe do site externo ocupa todo o espaco, sem header/titulo proprio, integrado diretamente ao lado da lista de mentorados.

