import { useState } from "react";
import { Plus, X, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useNichos, useCreateNicho } from "@/hooks/useNichos";
import {
  usePerfisReferencia,
  useCreatePerfilReferencia,
} from "@/hooks/usePerfisReferencia";
import { useAuth } from "@/contexts/AuthContext";
import { FORMATOS_VIRAL, ViralFilters } from "@/hooks/useVirais";

interface Props {
  filters: ViralFilters;
  onChange: (f: ViralFilters) => void;
}

export const ViraisFiltersBar = ({ filters, onChange }: Props) => {
  const { user } = useAuth();
  const { data: nichos = [] } = useNichos();
  const createNicho = useCreateNicho();
  const { data: perfis = [] } = usePerfisReferencia();
  const createPerfil = useCreatePerfilReferencia();
  const [novoNicho, setNovoNicho] = useState("");
  const [openNicho, setOpenNicho] = useState(false);
  const [openFormato, setOpenFormato] = useState(false);
  const [openPerfil, setOpenPerfil] = useState(false);
  const [novoPerfilNome, setNovoPerfilNome] = useState("");
  const [novoPerfilLink, setNovoPerfilLink] = useState("");

  const selectedNichos = filters.nichoIds || [];
  const selectedFormatos = filters.formatos || [];
  const selectedPerfis = filters.perfilIds || [];

  const isMesAtivo = (() => {
    if (!filters.dataInicio || !filters.dataFim) return false;
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return (
      new Date(filters.dataInicio).getTime() === start.getTime()
    );
  })();

  const toggleNicho = (id: string) => {
    const next = selectedNichos.includes(id)
      ? selectedNichos.filter((n) => n !== id)
      : [...selectedNichos, id];
    onChange({ ...filters, nichoIds: next });
  };

  const toggleFormato = (v: string) => {
    const next = selectedFormatos.includes(v)
      ? selectedFormatos.filter((f) => f !== v)
      : [...selectedFormatos, v];
    onChange({ ...filters, formatos: next });
  };

  const togglePerfil = (id: string) => {
    const next = selectedPerfis.includes(id)
      ? selectedPerfis.filter((p) => p !== id)
      : [...selectedPerfis, id];
    onChange({ ...filters, perfilIds: next });
  };

  const handleCreateNicho = async () => {
    if (!novoNicho.trim()) return;
    const created = await createNicho.mutateAsync(novoNicho.trim());
    setNovoNicho("");
    if (created?.id) {
      onChange({ ...filters, nichoIds: [...selectedNichos, created.id] });
    }
  };

  const handleCreatePerfil = async () => {
    const nome = novoPerfilNome.trim();
    const link = novoPerfilLink.trim();
    if (!nome || !link || !user?.id) return;
    const created = await createPerfil.mutateAsync({
      nome,
      inscritos: "",
      link,
      nicho_id: selectedNichos[0] || null,
      user_id: user.id,
    });
    setNovoPerfilNome("");
    setNovoPerfilLink("");
    if (created?.id) {
      onChange({ ...filters, perfilIds: [...selectedPerfis, created.id] });
    }
  };

  const toggleMes = (v: boolean) => {
    if (v) {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      onChange({
        ...filters,
        dataInicio: start.toISOString(),
        dataFim: end.toISOString(),
      });
    } else {
      onChange({ ...filters, dataInicio: null, dataFim: null });
    }
  };

  const limpar = () =>
    onChange({
      nichoIds: [],
      formatos: [],
      perfilIds: [],
      meusVirais: false,
      dataInicio: null,
      dataFim: null,
      orderBy: filters.orderBy || "recentes",
    });

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-card border rounded-lg">
      {/* Nicho */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <Label className="text-xs text-muted-foreground">Nicho</Label>
        <Popover open={openNicho} onOpenChange={setOpenNicho}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-between">
              <span className="truncate text-sm">
                {selectedNichos.length === 0
                  ? "Todos"
                  : `${selectedNichos.length} selecionado(s)`}
              </span>
              <Plus className="h-3 w-3 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <div className="flex gap-1 mb-2">
              <Input
                placeholder="Novo nicho..."
                value={novoNicho}
                onChange={(e) => setNovoNicho(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateNicho();
                }}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={handleCreateNicho}
                disabled={!novoNicho.trim()}
                className="h-8 px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {nichos.map((n) => (
                <button
                  key={n.id}
                  onClick={() => toggleNicho(n.id)}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${
                    selectedNichos.includes(n.id) ? "bg-accent" : ""
                  }`}
                >
                  {selectedNichos.includes(n.id) ? "✓ " : ""}
                  {n.nome}
                </button>
              ))}
              {nichos.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">
                  Nenhum nicho cadastrado.
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Formato */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <Label className="text-xs text-muted-foreground">Formato</Label>
        <Popover open={openFormato} onOpenChange={setOpenFormato}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-between">
              <span className="truncate text-sm">
                {selectedFormatos.length === 0
                  ? "Todos"
                  : `${selectedFormatos.length} selecionado(s)`}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-2" align="start">
            {FORMATOS_VIRAL.map((f) => (
              <button
                key={f.value}
                onClick={() => toggleFormato(f.value)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${
                  selectedFormatos.includes(f.value) ? "bg-accent" : ""
                }`}
              >
                {selectedFormatos.includes(f.value) ? "✓ " : ""}
                {f.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Perfil */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <Label className="text-xs text-muted-foreground">Perfil</Label>
        <Popover open={openPerfil} onOpenChange={setOpenPerfil}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-between">
              <span className="truncate text-sm">
                {selectedPerfis.length === 0
                  ? "Todos"
                  : `${selectedPerfis.length} selecionado(s)`}
              </span>
              <Plus className="h-3 w-3 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <div className="flex flex-col gap-1 mb-2">
              <Input
                placeholder="Nome do perfil..."
                value={novoPerfilNome}
                onChange={(e) => setNovoPerfilNome(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex gap-1">
                <Input
                  placeholder="Link do perfil..."
                  value={novoPerfilLink}
                  onChange={(e) => setNovoPerfilLink(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreatePerfil();
                  }}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleCreatePerfil}
                  disabled={!novoPerfilNome.trim() || !novoPerfilLink.trim()}
                  className="h-8 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {perfis.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePerfil(p.id)}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${
                    selectedPerfis.includes(p.id) ? "bg-accent" : ""
                  }`}
                >
                  {selectedPerfis.includes(p.id) ? "✓ " : ""}
                  {p.nome}
                </button>
              ))}
              {perfis.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">
                  Nenhum perfil cadastrado.
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Meus virais */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Meus virais</Label>
        <div className="h-9 flex items-center px-2">
          <Switch
            checked={!!filters.meusVirais}
            onCheckedChange={(v) => onChange({ ...filters, meusVirais: v })}
          />
        </div>
      </div>

      {/* Esse mês */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Esse mês</Label>
        <div className="h-9 flex items-center px-2">
          <Switch checked={isMesAtivo} onCheckedChange={toggleMes} />
        </div>
      </div>

      {/* Período */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">De</Label>
        <div className="relative">
          <Input
            type="date"
            value={filters.dataInicio?.slice(0, 10) || ""}
            onChange={(e) =>
              onChange({
                ...filters,
                dataInicio: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : null,
              })
            }
            className="h-9 text-sm w-[150px]"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Até</Label>
        <Input
          type="date"
          value={filters.dataFim?.slice(0, 10) || ""}
          onChange={(e) =>
            onChange({
              ...filters,
              dataFim: e.target.value
                ? new Date(
                    new Date(e.target.value).setHours(23, 59, 59, 999)
                  ).toISOString()
                : null,
            })
          }
          className="h-9 text-sm w-[150px]"
        />
      </div>

      <Button variant="ghost" size="sm" onClick={limpar} className="h-9">
        Limpar filtros
      </Button>

      {/* Chips de filtros ativos */}
      {(selectedNichos.length > 0 || selectedFormatos.length > 0) && (
        <div className="basis-full flex flex-wrap gap-1 mt-1">
          {selectedNichos.map((id) => {
            const n = nichos.find((x) => x.id === id);
            if (!n) return null;
            return (
              <Badge
                key={id}
                variant="secondary"
                className="gap-1 cursor-pointer"
                onClick={() => toggleNicho(id)}
              >
                {n.nome}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
          {selectedFormatos.map((f) => {
            const fmt = FORMATOS_VIRAL.find((x) => x.value === f);
            if (!fmt) return null;
            return (
              <Badge
                key={f}
                variant="secondary"
                className="gap-1 cursor-pointer"
                onClick={() => toggleFormato(f)}
              >
                {fmt.label}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};