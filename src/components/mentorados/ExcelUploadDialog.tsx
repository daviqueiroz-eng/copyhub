import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Trash2, Loader2, CheckCircle2, Globe, User } from "lucide-react";
import * as XLSX from "xlsx";
import { 
  useImportExcelHeadlines, 
  useMyHeadlinesExcel, 
  useTeamHeadlinesExcel,
  useDeleteHeadlinesByFile 
} from "@/hooks/useUserHeadlinesExcel";
import { useUserRole } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";

interface ExcelUploadDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SheetInfo {
  name: string;
  headlines: string[];
  headlineColumnName: string;
}

// Detecta se um valor parece ser URL
const isLikelyUrl = (value: string): boolean => {
  if (!value) return false;
  const urlPatterns = [
    /^https?:\/\//i,
    /^www\./i,
    /\.(com|net|org|io|br|gov|edu)/i,
    /instagram\.com/i,
    /youtube\.com/i,
    /tiktok\.com/i,
  ];
  return urlPatterns.some(pattern => pattern.test(value));
};

// Encontrar coluna de headline em um array de headers
const findHeadlineColumn = (headers: string[]): { index: number; name: string } => {
  const headlineKeywords = ['headline', 'titulo', 'título', 'headlines'];
  
  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i] || '').toLowerCase().trim();
    if (headlineKeywords.some(kw => header.includes(kw))) {
      return { index: i, name: String(headers[i]) };
    }
  }
  
  // Se não encontrar, usar a primeira coluna
  return { index: 0, name: String(headers[0] || 'Coluna A') };
};

export const ExcelUploadDialog = ({ open, onClose }: ExcelUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetsInfo, setSheetsInfo] = useState<SheetInfo[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"minhas" | "equipe">("minhas");

  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === "admin";

  const { data: myHeadlines = [] } = useMyHeadlinesExcel();
  const { data: teamHeadlines = [] } = useTeamHeadlinesExcel();
  const importMutation = useImportExcelHeadlines();
  const deleteMutation = useDeleteHeadlinesByFile();

  // Agrupar headlines por arquivo - Pessoais
  const myFileGroups = useMemo(() => {
    return myHeadlines.reduce((acc, h) => {
      const key = h.arquivo_origem || "Sem arquivo";
      if (!acc[key]) acc[key] = [];
      acc[key].push(h);
      return acc;
    }, {} as Record<string, typeof myHeadlines>);
  }, [myHeadlines]);

  // Agrupar headlines por arquivo - Equipe
  const teamFileGroups = useMemo(() => {
    return teamHeadlines.reduce((acc, h) => {
      const key = h.arquivo_origem || "Sem arquivo";
      if (!acc[key]) acc[key] = { headlines: [], isOwn: false };
      acc[key].headlines.push(h);
      acc[key].isOwn = h.user_id === user?.id;
      return acc;
    }, {} as Record<string, { headlines: typeof teamHeadlines; isOwn: boolean }>);
  }, [teamHeadlines, user?.id]);

  // Processar arquivo Excel e extrair info de todas as abas
  const processExcelFile = async (selectedFile: File) => {
    setIsProcessing(true);
    
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      
      const sheets: SheetInfo[] = [];
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        
        if (jsonData.length < 2) continue; // Pular abas vazias ou só com cabeçalho
        
        const headers = (jsonData[0] || []).map(h => String(h || ''));
        const { index: headlineColIdx, name: headlineColName } = findHeadlineColumn(headers);
        
        // Extrair headlines válidas (não vazias, não URLs)
        const validHeadlines: string[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const cellValue = row?.[headlineColIdx];
          
          if (cellValue) {
            const trimmed = String(cellValue).trim();
            if (trimmed.length > 0 && !isLikelyUrl(trimmed)) {
              validHeadlines.push(trimmed);
            }
          }
        }
        
        if (validHeadlines.length > 0) {
          sheets.push({
            name: sheetName,
            headlines: validHeadlines,
            headlineColumnName: headlineColName
          });
        }
      }
      
      setSheetsInfo(sheets);
      // Selecionar todas as abas por padrão
      setSelectedSheets(sheets.map(s => s.name));
      
    } catch (error) {
      console.error("Erro ao processar Excel:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    await processExcelFile(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
      const input = document.createElement("input");
      input.type = "file";
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      input.files = dataTransfer.files;
      handleFileChange({ target: input } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [handleFileChange]);

  const toggleSheet = (sheetName: string) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName) 
        ? prev.filter(s => s !== sheetName)
        : [...prev, sheetName]
    );
  };

  const selectAllSheets = () => {
    setSelectedSheets(sheetsInfo.map(s => s.name));
  };

  const deselectAllSheets = () => {
    setSelectedSheets([]);
  };

  // Calcular total de headlines selecionadas
  const totalSelectedHeadlines = useMemo(() => {
    return sheetsInfo
      .filter(s => selectedSheets.includes(s.name))
      .reduce((acc, s) => acc + s.headlines.length, 0);
  }, [sheetsInfo, selectedSheets]);

  const handleImport = async () => {
    if (!file || selectedSheets.length === 0) return;
    
    const isGlobal = activeTab === "equipe";
    const headlinesToImport: { headline: string; estrutura?: string; arquivo_origem: string; is_global?: boolean }[] = [];
    
    for (const sheet of sheetsInfo) {
      if (!selectedSheets.includes(sheet.name)) continue;
      
      for (const headline of sheet.headlines) {
        headlinesToImport.push({
          headline,
          arquivo_origem: `${file.name} - ${sheet.name}`,
          is_global: isGlobal,
        });
      }
    }
    
    await importMutation.mutateAsync(headlinesToImport);
    
    // Reset
    setFile(null);
    setSheetsInfo([]);
    setSelectedSheets([]);
  };

  const handleDeleteFile = async (fileName: string) => {
    if (confirm(`Remover todas as headlines do arquivo "${fileName}"?`)) {
      await deleteMutation.mutateAsync(fileName);
    }
  };

  // Limpar estado ao fechar
  useEffect(() => {
    if (!open) {
      setFile(null);
      setSheetsInfo([]);
      setSelectedSheets([]);
      setActiveTab("minhas");
    }
  }, [open]);

  // Componente de Upload Area
  const UploadArea = () => (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => document.getElementById("excel-upload")?.click()}
    >
      <input
        id="excel-upload"
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Arraste um arquivo Excel ou clique para selecionar
      </p>
      {file && (
        <p className="text-sm font-medium mt-2 text-primary">{file.name}</p>
      )}
    </div>
  );

  // Componente de seleção de abas do Excel
  const SheetSelector = () => (
    <>
      {/* Loading */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processando arquivo...
        </div>
      )}

      {/* Seleção de Abas */}
      {sheetsInfo.length > 0 && !isProcessing && (
        <div className="space-y-3 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Abas do Excel ({sheetsInfo.length} encontradas)
            </Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllSheets}
                disabled={selectedSheets.length === sheetsInfo.length}
              >
                Todas
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deselectAllSheets}
                disabled={selectedSheets.length === 0}
              >
                Nenhuma
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[150px] border rounded-md">
            <div className="p-2 space-y-1">
              {sheetsInfo.map((sheet) => (
                <div 
                  key={sheet.name}
                  className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer ${
                    selectedSheets.includes(sheet.name) 
                      ? 'bg-primary/10' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleSheet(sheet.name)}
                >
                  <Checkbox
                    id={`sheet-${sheet.name}`}
                    checked={selectedSheets.includes(sheet.name)}
                    onCheckedChange={() => toggleSheet(sheet.name)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{sheet.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      ({sheet.headlines.length} headlines)
                    </span>
                  </div>
                  {selectedSheets.includes(sheet.name) && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Resumo das headlines selecionadas */}
          {selectedSheets.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">
                  Total: {totalSelectedHeadlines} headlines de {selectedSheets.length} aba(s)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botão de Importar */}
      {sheetsInfo.length > 0 && selectedSheets.length > 0 && !isProcessing && (
        <Button
          onClick={handleImport}
          disabled={importMutation.isPending}
          className="w-full"
        >
          {importMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : activeTab === "equipe" ? (
            <Globe className="h-4 w-4 mr-2" />
          ) : (
            <User className="h-4 w-4 mr-2" />
          )}
          {activeTab === "equipe"
            ? `Compartilhar ${totalSelectedHeadlines} headlines com a equipe`
            : `Importar ${totalSelectedHeadlines} headlines`
          }
        </Button>
      )}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload de Excel com Headlines
          </DialogTitle>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={(v) => {
            setActiveTab(v as "minhas" | "equipe");
            // Limpar upload ao trocar de aba
            setFile(null);
            setSheetsInfo([]);
            setSelectedSheets([]);
          }}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="minhas" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Minhas Headlines
            </TabsTrigger>
            <TabsTrigger value="equipe" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Headlines da Equipe
            </TabsTrigger>
          </TabsList>

          {/* Aba: Minhas Headlines */}
          <TabsContent value="minhas" className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
            {/* Área de upload */}
            <UploadArea />
            
            <SheetSelector />

            {/* Lista de arquivos pessoais */}
            {Object.keys(myFileGroups).length > 0 && (
              <div className="border rounded-lg">
                <div className="bg-muted px-3 py-2 text-xs font-medium flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    Meus Arquivos
                  </span>
                  <span className="text-muted-foreground">
                    {myHeadlines.length} headlines
                  </span>
                </div>
                <ScrollArea className="max-h-32">
                  <div className="p-2 space-y-1">
                    {Object.entries(myFileGroups).map(([fileName, headlines]) => (
                      <div
                        key={fileName}
                        className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{fileName}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({headlines.length})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteFile(fileName)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          {/* Aba: Headlines da Equipe */}
          <TabsContent value="equipe" className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
            {/* Área de upload - APENAS ADMIN */}
            {isAdmin ? (
              <>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      Modo Admin: Headlines serão compartilhadas com toda a equipe
                    </span>
                  </div>
                </div>
                <UploadArea />
                <SheetSelector />
              </>
            ) : (
              <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Apenas administradores podem adicionar headlines para a equipe.</p>
                <p className="text-xs mt-1">Você pode visualizar e usar as headlines compartilhadas abaixo.</p>
              </div>
            )}

            {/* Lista de arquivos da equipe */}
            {Object.keys(teamFileGroups).length > 0 ? (
              <div className="border rounded-lg">
                <div className="bg-amber-500/10 px-3 py-2 text-xs font-medium flex justify-between items-center">
                  <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Globe className="h-3.5 w-3.5" />
                    Arquivos da Equipe
                  </span>
                  <span className="text-muted-foreground">
                    {teamHeadlines.length} headlines
                  </span>
                </div>
                <ScrollArea className="max-h-40">
                  <div className="p-2 space-y-1">
                    {Object.entries(teamFileGroups).map(([fileName, group]) => (
                      <div
                        key={fileName}
                        className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileSpreadsheet className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="text-sm truncate">{fileName}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({group.headlines.length})
                          </span>
                          <Badge variant="secondary" className="text-xs shrink-0 bg-amber-500/20 text-amber-700 dark:text-amber-400">
                            <Globe className="h-3 w-3 mr-1" />
                            Equipe
                          </Badge>
                        </div>
                        {/* Apenas o admin que fez upload pode deletar */}
                        {group.isOwn && isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteFile(fileName)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              !isAdmin && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma headline compartilhada pela equipe ainda.</p>
                </div>
              )
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
