import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGrupoTags, useCreateGrupoTag, useUpdateGrupoTag, useDeleteGrupoTag } from "@/hooks/useGruposTags";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface GrupoTagManagerProps {
  grupoId: string;
}

const PRESET_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#eab308", // yellow
  "#f97316", // orange
  "#ef4444", // red
  "#a855f7", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
];

export function GrupoTagManager({ grupoId }: GrupoTagManagerProps) {
  const { data: tags = [], isLoading } = useGrupoTags(grupoId);
  const createTag = useCreateGrupoTag();
  const updateTag = useUpdateGrupoTag();
  const deleteTag = useDeleteGrupoTag();

  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState(PRESET_COLORS[0]);

  const handleCreate = async () => {
    if (!novoNome.trim()) {
      toast({ title: "Digite o nome da tag", variant: "destructive" });
      return;
    }

    try {
      await createTag.mutateAsync({
        grupo_id: grupoId,
        nome: novoNome.trim(),
        cor: novaCor,
      });
      toast({ title: "Tag criada!" });
      setNovoNome("");
      setNovaCor(PRESET_COLORS[tags.length % PRESET_COLORS.length]);
    } catch (error: any) {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing Tags */}
      <div className="space-y-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 p-2 rounded-lg border">
            <div
              className="h-6 w-6 rounded-full shrink-0"
              style={{ backgroundColor: tag.cor }}
            />
            <Input
              value={tag.nome}
              onChange={(e) => updateTag.mutate({ id: tag.id, grupo_id: grupoId, nome: e.target.value })}
              className="h-8 flex-1"
            />
            <div className="flex gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className={`h-5 w-5 rounded-full transition-transform ${tag.cor === color ? 'ring-2 ring-offset-1 ring-foreground scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => updateTag.mutate({ id: tag.id, grupo_id: grupoId, cor: color })}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => deleteTag.mutate({ id: tag.id, grupo_id: grupoId })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add New Tag */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-full shrink-0"
            style={{ backgroundColor: novaCor }}
          />
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome da nova tag"
            className="h-8 flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button size="sm" className="h-8" onClick={handleCreate} disabled={createTag.isPending}>
            {createTag.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex gap-1 mt-2 justify-center">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={`h-6 w-6 rounded-full transition-transform ${novaCor === color ? 'ring-2 ring-offset-1 ring-foreground scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: color }}
              onClick={() => setNovaCor(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
