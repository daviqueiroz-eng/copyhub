import { useEffect, useMemo, useState } from "react";
import {
  useConquistasVideos,
  useUpsertConquistaVideo,
  useDeleteConquistaVideo,
  useUpdateSeguidores,
  uploadConquistaThumbnail,
  MILESTONES,
  formatViews,
  type ConquistaVideo,
} from "@/hooks/useMentoradoConquistas";
import { Trophy, Target, Rocket, Gem, Plus, Play, Pencil, Trash2, ExternalLink, Upload, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const iconMap = { trophy: Trophy, target: Target, rocket: Rocket, gem: Gem } as const;

interface Props {
  mentoradoId: string;
  seguidoresAtual: number;
  readOnly?: boolean;
}

export function ConquistasSection({ mentoradoId, seguidoresAtual, readOnly = false }: Props) {
  const { data: videos = [] } = useConquistasVideos(mentoradoId);
  const upsert = useUpsertConquistaVideo();
  const remove = useDeleteConquistaVideo();
  const updateSeg = useUpdateSeguidores();

  const [editing, setEditing] = useState<Partial<ConquistaVideo> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [seguidoresInput, setSeguidoresInput] = useState<string>(String(seguidoresAtual || 0));
  useEffect(() => {
    setSeguidoresInput(String(seguidoresAtual || 0));
  }, [seguidoresAtual]);

  const saveSeguidores = () => {
    const n = Math.max(0, Number(seguidoresInput.replace(/\D/g, "")) || 0);
    if (n === seguidoresAtual) return;
    updateSeg.mutate({ mentorado_id: mentoradoId, seguidores_atual: n });
    toast.success("Seguidores atualizados");
  };

  const openNew = () => setEditing({ mentorado_id: mentoradoId, titulo: "", visualizacoes: 0 });

  const handleSave = async () => {
    if (!editing) return;
    await upsert.mutateAsync({
      id: editing.id,
      mentorado_id: mentoradoId,
      titulo: editing.titulo || "",
      link: editing.link || null,
      thumbnail_url: editing.thumbnail_url || null,
      visualizacoes: Number(editing.visualizacoes) || 0,
      data_publicacao: editing.data_publicacao || null,
    });
    setEditing(null);
    toast.success("Vídeo salvo");
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadConquistaThumbnail(file, mentoradoId);
      setEditing((e) => (e ? { ...e, thumbnail_url: url } : e));
    } catch (err: any) {
      toast.error("Falha no upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-3 font-poppins">
      {/* Seguidores */}
      <div className="rounded-xl border bg-card p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Seguidores atuais</p>
          <p className="text-xs text-muted-foreground">
            Usado para calcular o progresso das metas de seguidores.
          </p>
        </div>
        {readOnly ? (
          <p className="text-lg font-semibold">{formatViews(seguidoresAtual || 0)}</p>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="h-9 w-36 text-right"
              value={seguidoresInput}
              onChange={(e) => setSeguidoresInput(e.target.value)}
              onBlur={saveSeguidores}
              onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
            />
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MILESTONES.map((m) => {
          const Icon = iconMap[m.icon as keyof typeof iconMap];
          const current =
            m.tipo === "video"
              ? videos.length > 0
                ? 1
                : 0
              : seguidoresAtual || 0;
          const pct = Math.min(100, Math.round((current / m.target) * 100));
          const done = current >= m.target;
          return (
            <div
              key={m.key}
              className="rounded-xl border bg-card p-4 flex flex-col items-center text-center gap-2 shadow-sm"
            >
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center"
                style={{ background: `${m.color}20` }}
              >
                <Icon className="h-7 w-7" style={{ color: m.color }} />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">{m.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{m.desc}</p>
              </div>
              <div
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border"
                style={{
                  borderColor: `${m.color}66`,
                  background: `${m.color}15`,
                  color: m.color,
                }}
              >
                <Star className="h-3 w-3" fill={done ? m.color : "none"} />
                {done ? "Desbloqueada" : "Em progresso"}
              </div>
              <div className="w-full space-y-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: m.color }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {m.tipo === "video"
                    ? `${Math.min(current, m.target)}/${m.target}`
                    : `${formatViews(current)}/${formatViews(m.target)}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vídeos que viralizaram */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Vídeos que viralizaram</h3>
          {!readOnly && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={openNew}>
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          )}
        </div>
        {videos.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Nenhum vídeo cadastrado ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {videos.map((v) => (
              <div key={v.id} className="group space-y-2">
                <a
                  href={v.link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => !v.link && e.preventDefault()}
                  className="block relative aspect-video rounded-lg overflow-hidden bg-muted"
                >
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt={v.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Play className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow">
                      <Play className="h-4 w-4 text-black" fill="currentColor" />
                    </div>
                  </div>
                </a>
                <div>
                  <p className="text-xs font-medium line-clamp-2 leading-snug">{v.titulo}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <span className="text-primary font-medium">
                      {formatViews(v.visualizacoes || 0)} visualizações
                    </span>
                  </div>
                  {v.data_publicacao && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {format(new Date(v.data_publicacao), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setEditing(v)}>
                      <Pencil className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] text-destructive"
                      onClick={() => remove.mutate({ id: v.id, mentorado_id: mentoradoId })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog edit/create */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="font-poppins">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar vídeo" : "Adicionar vídeo viral"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Título</Label>
              <Input
                value={editing?.titulo || ""}
                onChange={(e) => setEditing((s) => (s ? { ...s, titulo: e.target.value } : s))}
                placeholder="Ex: 3 hábitos que mudaram minha produtividade"
              />
            </div>
            <div>
              <Label className="text-xs">Link do vídeo</Label>
              <Input
                value={editing?.link || ""}
                onChange={(e) => setEditing((s) => (s ? { ...s, link: e.target.value } : s))}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Visualizações</Label>
                <Input
                  type="number"
                  value={editing?.visualizacoes ?? 0}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, visualizacoes: Number(e.target.value) } : s))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={editing?.data_publicacao || ""}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, data_publicacao: e.target.value } : s))
                  }
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Print / thumbnail</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={editing?.thumbnail_url || ""}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, thumbnail_url: e.target.value } : s))
                  }
                  placeholder="Cole URL ou envie um arquivo"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  />
                  <span className="inline-flex items-center gap-1 px-3 py-2 text-xs border rounded-md hover:bg-accent">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? "Enviando..." : "Enviar"}
                  </span>
                </label>
              </div>
              {editing?.thumbnail_url && (
                <img
                  src={editing.thumbnail_url}
                  alt="preview"
                  className="mt-2 rounded-md max-h-32 object-cover"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}