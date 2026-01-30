import { useState } from "react";
import { Plus, Trash2, GripVertical, Pencil, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useCheckRoteiroViral,
  useCreateCheckRoteiroViral,
  useUpdateCheckRoteiroViral,
  useDeleteCheckRoteiroViral,
  CheckRoteiroViral,
} from "@/hooks/useCheckRoteiroViral";

interface CheckRoteiroViralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REGRA_TIPOS = [
  { value: "contem", label: "Contém (palavras separadas por vírgula)" },
  { value: "nao_contem", label: "Não contém" },
  { value: "regex", label: "Expressão regular" },
  { value: "mentorado_nome", label: "Nome do mentorado" },
  { value: "ia", label: "Inteligente (IA) - usa descrição" },
];

const CAMPOS = [
  { value: "headline", label: "Headline" },
  { value: "estrutura", label: "Estrutura" },
  { value: "ambos", label: "Ambos" },
];

export const CheckRoteiroViralDialog = ({
  open,
  onOpenChange,
}: CheckRoteiroViralDialogProps) => {
  const { data: checks = [], isLoading } = useCheckRoteiroViral();
  const createCheck = useCreateCheckRoteiroViral();
  const updateCheck = useUpdateCheckRoteiroViral();
  const deleteCheck = useDeleteCheckRoteiroViral();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    regra_tipo: "contem",
    regra_valor: "",
    campo: "estrutura",
    ativo: true,
    ordem: 0,
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      regra_tipo: "contem",
      regra_valor: "",
      campo: "estrutura",
      ativo: true,
      ordem: checks.length,
    });
  };

  const handleCreate = () => {
    if (!formData.nome.trim()) return;

    createCheck.mutate(
      {
        nome: formData.nome,
        descricao: formData.descricao || null,
        regra_tipo: formData.regra_tipo,
        regra_valor: formData.regra_valor || null,
        campo: formData.campo,
        ativo: formData.ativo,
        ordem: checks.length,
      },
      {
        onSuccess: () => {
          resetForm();
          setShowNewForm(false);
        },
      }
    );
  };

  const handleUpdate = (check: CheckRoteiroViral) => {
    updateCheck.mutate(
      {
        id: check.id,
        nome: formData.nome,
        descricao: formData.descricao || null,
        regra_tipo: formData.regra_tipo,
        regra_valor: formData.regra_valor || null,
        campo: formData.campo,
        ativo: formData.ativo,
      },
      {
        onSuccess: () => {
          setEditingId(null);
          resetForm();
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este check?")) {
      deleteCheck.mutate(id);
    }
  };

  const handleToggleAtivo = (check: CheckRoteiroViral) => {
    updateCheck.mutate({
      id: check.id,
      ativo: !check.ativo,
    });
  };

  const startEditing = (check: CheckRoteiroViral) => {
    setEditingId(check.id);
    setFormData({
      nome: check.nome,
      descricao: check.descricao || "",
      regra_tipo: check.regra_tipo,
      regra_valor: check.regra_valor || "",
      campo: check.campo,
      ativo: check.ativo,
      ordem: check.ordem,
    });
    setShowNewForm(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configurar Checks do Roteiro Viral</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Lista de checks existentes */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : checks.length === 0 && !showNewForm ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum check configurado ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {checks.map((check) => (
                  <div
                    key={check.id}
                    className="border rounded-lg p-3 bg-muted/30"
                  >
                    {editingId === check.id ? (
                      // Form de edição inline
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Nome</Label>
                            <Input
                              value={formData.nome}
                              onChange={(e) =>
                                setFormData((f) => ({ ...f, nome: e.target.value }))
                              }
                              placeholder="Ex: faltou cta"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Campo</Label>
                            <Select
                              value={formData.campo}
                              onValueChange={(v) =>
                                setFormData((f) => ({ ...f, campo: v }))
                              }
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CAMPOS.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Tipo de regra</Label>
                          <Select
                            value={formData.regra_tipo}
                            onValueChange={(v) =>
                              setFormData((f) => ({ ...f, regra_tipo: v }))
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {REGRA_TIPOS.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.regra_tipo !== "mentorado_nome" && formData.regra_tipo !== "ia" && (
                          <div>
                            <Label className="text-xs">
                              Valor da regra{" "}
                              {formData.regra_tipo === "contem" &&
                                "(separe por vírgula)"}
                            </Label>
                            <Textarea
                              value={formData.regra_valor}
                              onChange={(e) =>
                                setFormData((f) => ({
                                  ...f,
                                  regra_valor: e.target.value,
                                }))
                              }
                              placeholder={
                                formData.regra_tipo === "contem"
                                  ? "Ex: segue, siga, compartilha, curte"
                                  : formData.regra_tipo === "regex"
                                  ? "Ex: \\d{3,}"
                                  : ""
                              }
                              className="text-sm min-h-[60px]"
                            />
                          </div>
                        )}
                        <div>
                          <Label className="text-xs">
                            Descrição {formData.regra_tipo === "ia" ? "*" : "(opcional)"}
                          </Label>
                          <Textarea
                            value={formData.descricao}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                descricao: e.target.value,
                              }))
                            }
                            placeholder={
                              formData.regra_tipo === "ia"
                                ? "Descreva o que a IA deve verificar. Ex: verificar se o nome do mentorado está escrito corretamente ao longo do roteiro"
                                : "Descrição do que este check verifica"
                            }
                            className="text-sm min-h-[60px]"
                          />
                          {formData.regra_tipo === "ia" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              A IA usará esta descrição para analisar o roteiro automaticamente
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={formData.ativo}
                              onCheckedChange={(v) =>
                                setFormData((f) => ({ ...f, ativo: v }))
                              }
                            />
                            <Label className="text-xs">Ativo</Label>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(check)}
                              disabled={!formData.nome.trim()}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Visualização do check
                      <div className="flex items-start gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-1 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium text-sm ${
                                !check.ativo && "text-muted-foreground line-through"
                              }`}
                            >
                              {check.nome}
                            </span>
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {check.campo}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {check.regra_tipo === "mentorado_nome"
                              ? "Verifica nome do mentorado"
                              : check.regra_tipo === "ia"
                              ? "🤖 IA verifica automaticamente"
                              : check.regra_valor}
                          </p>
                          {check.descricao && (
                            <p className="text-xs text-muted-foreground/70 mt-1 italic">
                              {check.descricao}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={check.ativo}
                            onCheckedChange={() => handleToggleAtivo(check)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEditing(check)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(check.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Form para novo check */}
            {showNewForm && (
              <div className="border rounded-lg p-4 bg-primary/5 space-y-3">
                <h4 className="font-medium text-sm">Novo Check</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nome *</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, nome: e.target.value }))
                      }
                      placeholder="Ex: faltou cta"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Campo</Label>
                    <Select
                      value={formData.campo}
                      onValueChange={(v) =>
                        setFormData((f) => ({ ...f, campo: v }))
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMPOS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Tipo de regra</Label>
                  <Select
                    value={formData.regra_tipo}
                    onValueChange={(v) =>
                      setFormData((f) => ({ ...f, regra_tipo: v }))
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGRA_TIPOS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.regra_tipo !== "mentorado_nome" && formData.regra_tipo !== "ia" && (
                  <div>
                    <Label className="text-xs">
                      Valor da regra{" "}
                      {formData.regra_tipo === "contem" && "(separe por vírgula)"}
                    </Label>
                    <Textarea
                      value={formData.regra_valor}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          regra_valor: e.target.value,
                        }))
                      }
                      placeholder={
                        formData.regra_tipo === "contem"
                          ? "Ex: segue, siga, compartilha, curte"
                          : formData.regra_tipo === "regex"
                          ? "Ex: \\d{3,}"
                          : ""
                      }
                      className="text-sm min-h-[60px]"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-xs">
                    Descrição {formData.regra_tipo === "ia" ? "*" : "(opcional)"}
                  </Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        descricao: e.target.value,
                      }))
                    }
                    placeholder={
                      formData.regra_tipo === "ia"
                        ? "Descreva o que a IA deve verificar. Ex: verificar se o nome do mentorado está escrito corretamente ao longo do roteiro"
                        : "Descrição do que este check verifica"
                    }
                    className="text-sm min-h-[60px]"
                  />
                  {formData.regra_tipo === "ia" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      A IA usará esta descrição para analisar o roteiro automaticamente
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.ativo}
                    onCheckedChange={(v) =>
                      setFormData((f) => ({ ...f, ativo: v }))
                    }
                  />
                  <Label className="text-xs">Ativo</Label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewForm(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={!formData.nome.trim() || createCheck.isPending}
                  >
                    Criar check
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Botão para adicionar */}
        {!showNewForm && !editingId && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                resetForm();
                setShowNewForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar check
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
