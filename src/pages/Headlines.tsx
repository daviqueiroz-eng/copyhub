import { useState, useRef } from "react";
import { Plus, Search, Trash2, ExternalLink, Upload, FolderPlus, ClipboardPaste } from "lucide-react";
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  useCategories, 
  useHeadlines, 
  useCreateCategory, 
  useCreateHeadline,
  useUpdateHeadline,
  useDeleteHeadline,
  useCreateMultipleHeadlines
} from "@/hooks/useHeadlines";

const gatilhosOptions = [
  "Autoridade",
  "Medo/Perda",
  "Solução",
  "Transformação",
  "Segredo",
  "Curiosidade",
  "Problema comum",
  "Urgência",
  "Exclusividade",
];

const estruturaOptions = [
  "Comando + Benefício",
  "Nunca faça X sem Y",
  "Se você quer X, faça Y",
  "Convite + Resultado",
  "X coisas que ninguém conta",
  "Como fazer X?",
  "Vamos analisar X",
  "O segredo de X",
];

const Headlines = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: categories = [] } = useCategories();
  const [activeTab, setActiveTab] = useState(categories[0]?.key || "comunicacao");
  const { data: headlines = [] } = useHeadlines(activeTab);
  
  const createCategory = useCreateCategory();
  const createHeadline = useCreateHeadline();
  const updateHeadline = useUpdateHeadline();
  const deleteHeadline = useDeleteHeadline();
  const createMultipleHeadlines = useCreateMultipleHeadlines();

  const filteredHeadlines = headlines.filter(
    (h) =>
      h.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.gatilhos?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const addNewRow = () => {
    createHeadline.mutate({
      category_key: activeTab,
      headline: "",
      referencia: null,
      gatilhos: null,
      estrutura: null,
    });
  };

  const deleteRow = (id: string) => {
    deleteHeadline.mutate({ id, categoryKey: activeTab });
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Digite um nome para a nova categoria.",
        variant: "destructive",
      });
      return;
    }

    const categoryKey = newCategoryName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");

    if (categories.find(c => c.key === categoryKey)) {
      toast({
        title: "Categoria já existe",
        description: "Uma categoria com este nome já foi criada.",
        variant: "destructive",
      });
      return;
    }

    createCategory.mutate(
      { name: newCategoryName, key: categoryKey },
      {
        onSuccess: () => {
          setActiveTab(categoryKey);
          setNewCategoryName("");
          setShowNewCategoryDialog(false);
        },
      }
    );
  };

  const handlePasteMultiple = () => {
    if (!pasteText.trim()) {
      toast({
        title: "Nenhum conteúdo",
        description: "Cole o texto com as headlines antes de importar.",
        variant: "destructive",
      });
      return;
    }

    const lines = pasteText.split('\n').filter(line => line.trim() !== '');
    const newHeadlines = lines.map(line => {
      const parts = line.split(/\t+/).map(p => p.trim());
      
      return {
        category_key: activeTab,
        headline: parts[0] || "",
        referencia: parts[1] || null,
        gatilhos: null,
        estrutura: null,
      };
    });

    createMultipleHeadlines.mutate(
      { headlines: newHeadlines, categoryKey: activeTab },
      {
        onSuccess: () => {
          setPasteText("");
          setShowPasteDialog(false);
        },
      }
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetMapping: Record<string, string> = {
          'Comunicação': 'comunicacao',
          'Cristão': 'cristao',
          'Ginecologista / Obstetro': 'gineocologista',
          'Ginecologista/Obstetro': 'gineocologista',
          'Espiritualidade': 'espiritualidade',
          'Medicina': 'medicina',
          'Psicologia': 'psicologia',
          'Saúde e emagrecimento': 'saude',
          'Criação de filhos': 'filhos',
          'Corredor de imóveis': 'imoveis',
          'Arquitetura': 'arquitetura',
          'Fisioterapia': 'fisioterapia',
          'Advogado imobiliário': 'advogadoimobiliario',
          'Advogado (LGPD)': 'advogadolgpd',
          'Estética / cirurgia plástica': 'estetica',
          'Estética/cirurgia plástica': 'estetica',
          'Dermatologista': 'dermatologista',
          'Empreendedor': 'empreendedor'
        };

        const allHeadlines: any[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

          const categoriaKey = sheetMapping[sheetName] || 
            sheetName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").replace(/\//g, "");

          jsonData.forEach((row: any) => {
            const headlineText = row.Headline || row.headline || row.HEADLINE || "";
            const referencia = row.Referência || row.referencia || row.Referencia || row.REFERENCIA || row.link || row.Link || "";

            if (headlineText && headlineText.trim() !== "") {
              allHeadlines.push({
                category_key: categoriaKey,
                headline: headlineText.trim(),
                referencia: referencia ? referencia.trim() : null,
                gatilhos: null,
                estrutura: null,
              });
            }
          });
        });

        if (allHeadlines.length > 0) {
          createMultipleHeadlines.mutate(
            { headlines: allHeadlines, categoryKey: activeTab },
            {
              onSuccess: () => {
                toast({
                  title: "Importação concluída!",
                  description: `${allHeadlines.length} headlines importadas de ${workbook.SheetNames.length} categorias.`,
                });
              },
            }
          );
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Erro ao importar:", error);
        toast({
          title: "Erro na importação",
          description: "Não foi possível ler o arquivo. Verifique se é um Excel válido.",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Banco de Headlines
          </h2>
          <p className="text-muted-foreground mt-1">
            Biblioteca organizada por categorias
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={addNewRow}>
            <Plus className="h-4 w-4" />
            Nova Linha
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowPasteDialog(true)}
          >
            <ClipboardPaste className="h-4 w-4" />
            Colar Múltiplas
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowNewCategoryDialog(true)}
          >
            <FolderPlus className="h-4 w-4" />
            Novo Nicho
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar headline ou gatilho..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Importar Excel
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex-wrap h-auto gap-2 bg-muted/50 p-2">
          {categories.map((category) => (
            <TabsTrigger
              key={category.key}
              value={category.key}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((categoria) => (
          <TabsContent key={categoria.key} value={categoria.key} className="mt-6">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10 hover:bg-primary/10">
                      <TableHead className="w-12 font-semibold">#</TableHead>
                      <TableHead className="min-w-[400px] font-semibold">
                        Headline
                      </TableHead>
                      <TableHead className="min-w-[300px] font-semibold">
                        Referência
                      </TableHead>
                      <TableHead className="min-w-[180px] font-semibold">
                        Gatilhos de atenção
                      </TableHead>
                      <TableHead className="min-w-[200px] font-semibold">
                        Estrutura infalível
                      </TableHead>
                      <TableHead className="w-24 font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHeadlines.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          {searchTerm
                            ? "Nenhuma headline encontrada"
                            : "Clique em 'Nova Linha' para começar"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHeadlines.map((headline, index) => (
                        <TableRow
                          key={headline.id}
                          className="hover:bg-muted/50 group"
                        >
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Input
                              defaultValue={headline.headline}
                              placeholder="Digite a headline..."
                              className="border-0 focus-visible:ring-1 bg-transparent"
                              onBlur={(e) => {
                                if (e.target.value !== headline.headline) {
                                  updateHeadline.mutate({
                                    id: headline.id,
                                    headline: e.target.value,
                                  });
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                defaultValue={headline.referencia || ""}
                                placeholder="Cole o link..."
                                className="border-0 focus-visible:ring-1 bg-transparent"
                                onBlur={(e) => {
                                  if (e.target.value !== (headline.referencia || "")) {
                                    updateHeadline.mutate({
                                      id: headline.id,
                                      referencia: e.target.value || null,
                                    });
                                  }
                                }}
                              />
                              {headline.referencia && (
                                <a
                                  href={headline.referencia}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              defaultValue={headline.gatilhos || undefined}
                              onValueChange={(value) => {
                                updateHeadline.mutate({
                                  id: headline.id,
                                  gatilhos: value,
                                });
                              }}
                            >
                              <SelectTrigger className="border-0 focus:ring-1 bg-transparent">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-popover">
                                {gatilhosOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              defaultValue={headline.estrutura || undefined}
                              onValueChange={(value) => {
                                updateHeadline.mutate({
                                  id: headline.id,
                                  estrutura: value,
                                });
                              }}
                            >
                              <SelectTrigger className="border-0 focus:ring-1 bg-transparent">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-popover">
                                {estruturaOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteRow(headline.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {filteredHeadlines.length} headlines nesta categoria
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  {gatilhosOptions.length} tipos de gatilhos
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  {estruturaOptions.length} estruturas
                </Badge>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog para criar nova categoria */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Nicho</DialogTitle>
            <DialogDescription>
              Digite o nome da nova categoria/nicho para organizar suas headlines.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome do Nicho</Label>
              <Input
                id="category-name"
                placeholder="Ex: Marketing Digital, Advocacia..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory}>
              Criar Nicho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para colar múltiplas linhas */}
      <Dialog open={showPasteDialog} onOpenChange={setShowPasteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Colar Múltiplas Headlines</DialogTitle>
            <DialogDescription>
              Cole suas headlines abaixo. Cada linha será uma nova entrada na categoria atual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paste-text">Cole aqui (Ctrl+V)</Label>
              <Textarea
                id="paste-text"
                placeholder="Cole suas headlines aqui, uma por linha..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Categoria atual: <strong>{activeTab}</strong>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePasteMultiple}>
              Importar {pasteText.split('\n').filter(l => l.trim()).length} linhas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Headlines;
