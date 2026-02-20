import { useState } from "react";
import { Plus, Trash2, GripVertical, Pencil, Check, X, Save, FlaskConical, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCheckRoteiroViral,
  useCreateCheckRoteiroViral,
  useUpdateCheckRoteiroViral,
  useDeleteCheckRoteiroViral,
  CheckRoteiroViral,
} from "@/hooks/useCheckRoteiroViral";
import { useTiposRoteiro, useUpdateTipoRoteiro } from "@/hooks/useTiposRoteiro";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  const { data: tiposRoteiro = [] } = useTiposRoteiro();
  const updateTipo = useUpdateTipoRoteiro();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState("checks");

  // Detecção de tipo state
  const [deteccaoEdits, setDeteccaoEdits] = useState<Map<string, { palavras_chave: string; instrucoes_deteccao: string }>>(new Map());
  const [savingDeteccao, setSavingDeteccao] = useState(false);
  const [testingDeteccao, setTestingDeteccao] = useState(false);
  const [testHeadline, setTestHeadline] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem("webhook_deteccao_tipo_url") || "");

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

  // Detecção de tipo helpers
  const getDeteccaoValue = (tipoId: string, field: "palavras_chave" | "instrucoes_deteccao") => {
    const edit = deteccaoEdits.get(tipoId);
    if (edit) return edit[field];
    const tipo = tiposRoteiro.find(t => t.id === tipoId);
    return tipo?.[field] || "";
  };

  const setDeteccaoField = (tipoId: string, field: "palavras_chave" | "instrucoes_deteccao", value: string) => {
    setDeteccaoEdits(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(tipoId) || {
        palavras_chave: tiposRoteiro.find(t => t.id === tipoId)?.palavras_chave || "",
        instrucoes_deteccao: tiposRoteiro.find(t => t.id === tipoId)?.instrucoes_deteccao || "",
      };
      newMap.set(tipoId, { ...existing, [field]: value });
      return newMap;
    });
  };

  const handleSaveDeteccao = async () => {
    setSavingDeteccao(true);
    try {
      const promises = Array.from(deteccaoEdits.entries()).map(([tipoId, values]) =>
        updateTipo.mutateAsync({
          id: tipoId,
          config_extra: undefined,
          ...({ palavras_chave: values.palavras_chave || null, instrucoes_deteccao: values.instrucoes_deteccao || null } as any),
        })
      );
      
      // Also save types that weren't edited but might need updating
      for (const tipo of tiposRoteiro) {
        if (!deteccaoEdits.has(tipo.id)) continue;
        // Already handled above
      }
      
      // Use direct supabase calls since the hook might not support the new columns yet
      for (const [tipoId, values] of deteccaoEdits.entries()) {
        await supabase
          .from("tipos_roteiro")
          .update({
            palavras_chave: values.palavras_chave || null,
            instrucoes_deteccao: values.instrucoes_deteccao || null,
          })
          .eq("id", tipoId);
      }
      
      setDeteccaoEdits(new Map());
      toast({ title: "Configurações salvas!", description: "As regras de detecção foram atualizadas." });
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSavingDeteccao(false);
    }
  };

  const handleWebhookUrlChange = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem("webhook_deteccao_tipo_url", url);
  };

  const handleTestDeteccao = async () => {
    if (!testHeadline.trim()) {
      toast({ title: "Digite uma headline para testar", variant: "destructive" });
      return;
    }
    if (!webhookUrl.trim()) {
      toast({ title: "Configure a URL do webhook primeiro", variant: "destructive" });
      return;
    }
    
    setTestingDeteccao(true);
    setTestResult(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline: testHeadline }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      const tipoNome = (data.tipo || data.type || data.nome || "").toString().trim();
      
      if (tipoNome) {
        const match = tiposRoteiro.find(t => t.nome.trim().toLowerCase() === tipoNome.toLowerCase());
        if (match) {
          setTestResult(`✅ Detectado: ${match.nome}`);
        } else {
          setTestResult(`⚠️ Retornou "${tipoNome}" mas não bate com nenhum tipo cadastrado`);
        }
      } else {
        setTestResult("❌ Nenhum tipo retornado pelo webhook");
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        setTestResult("⚠️ Timeout - webhook não respondeu em 10s");
      } else {
        setTestResult("⚠️ Erro ao chamar webhook");
      }
    } finally {
      setTestingDeteccao(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Configurações do Roteiro</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex-shrink-0 grid w-full grid-cols-2">
            <TabsTrigger value="checks">Checks Virais</TabsTrigger>
            <TabsTrigger value="deteccao">Detecção de Tipo</TabsTrigger>
          </TabsList>

          <TabsContent value="checks" className="flex-1 min-h-0 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
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
              <div className="pt-4 border-t flex-shrink-0">
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
          </TabsContent>

          <TabsContent value="deteccao" className="flex-1 min-h-0 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {/* Webhook URL */}
                <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  <Label className="text-xs font-medium">URL do Webhook (n8n)</Label>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => handleWebhookUrlChange(e.target.value)}
                    placeholder="https://seu-n8n.app.n8n.cloud/webhook/..."
                    className="h-8 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    O sistema envia <code className="bg-muted px-1 rounded">{"{ headline: \"...\" }"}</code> e espera receber <code className="bg-muted px-1 rounded">{"{ tipo: \"Nome do tipo\" }"}</code>
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Use as informações abaixo como referência para configurar seu workflow no n8n.
                </p>

                {tiposRoteiro.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum tipo de roteiro cadastrado. Crie tipos primeiro na tela de roteiros.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tiposRoteiro.map(tipo => (
                      <div key={tipo.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                        <div className="font-medium text-sm">{tipo.nome}</div>
                        <div>
                          <Label className="text-xs">Palavras-chave (separadas por vírgula)</Label>
                          <Input
                            value={getDeteccaoValue(tipo.id, "palavras_chave")}
                            onChange={(e) => setDeteccaoField(tipo.id, "palavras_chave", e.target.value)}
                            placeholder="Ex: 3 coisas, 5 dicas, X maneiras"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Instruções para a IA</Label>
                          <Textarea
                            value={getDeteccaoValue(tipo.id, "instrucoes_deteccao")}
                            onChange={(e) => setDeteccaoField(tipo.id, "instrucoes_deteccao", e.target.value)}
                            placeholder="Ex: Headlines que prometem uma quantidade específica de itens, dicas ou passos"
                            className="text-sm min-h-[60px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Área de teste */}
                {tiposRoteiro.length > 0 && (
                  <div className="border rounded-lg p-3 space-y-2 bg-primary/5">
                    <Label className="text-xs font-medium">Testar detecção</Label>
                    <div className="flex gap-2">
                      <Input
                        value={testHeadline}
                        onChange={(e) => setTestHeadline(e.target.value)}
                        placeholder="Digite uma headline para testar..."
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTestDeteccao}
                        disabled={testingDeteccao}
                        className="gap-1"
                      >
                        {testingDeteccao ? <Loader2 className="h-3 w-3 animate-spin" /> : <FlaskConical className="h-3 w-3" />}
                        Testar
                      </Button>
                    </div>
                    {testResult && (
                      <p className="text-sm font-medium">{testResult}</p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Botão salvar */}
            {tiposRoteiro.length > 0 && (
              <div className="pt-4 border-t flex-shrink-0">
                <Button
                  className="w-full gap-2"
                  onClick={handleSaveDeteccao}
                  disabled={savingDeteccao || deteccaoEdits.size === 0}
                >
                  {savingDeteccao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar configurações
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
