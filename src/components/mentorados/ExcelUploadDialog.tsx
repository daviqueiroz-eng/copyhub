import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, Trash2, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { useImportExcelHeadlines, useUserHeadlinesExcel, useDeleteHeadlinesByFile } from "@/hooks/useUserHeadlinesExcel";

interface ExcelUploadDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ExcelUploadDialog = ({ open, onClose }: ExcelUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [headlineColumn, setHeadlineColumn] = useState<string>("");
  const [estruturaColumn, setEstruturaColumn] = useState<string>("");
  const [allRows, setAllRows] = useState<string[][]>([]);

  const { data: existingHeadlines = [] } = useUserHeadlinesExcel();
  const importMutation = useImportExcelHeadlines();
  const deleteMutation = useDeleteHeadlinesByFile();

  // Agrupar headlines por arquivo
  const fileGroups = existingHeadlines.reduce((acc, h) => {
    const key = h.arquivo_origem || "Sem arquivo";
    if (!acc[key]) acc[key] = [];
    acc[key].push(h);
    return acc;
  }, {} as Record<string, typeof existingHeadlines>);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

      if (jsonData.length > 0) {
        const headerRow = jsonData[0].map((h) => String(h || ""));
        setHeaders(headerRow);
        setPreview(jsonData.slice(1, 6).map((row) => row.map((cell) => String(cell || ""))));
        setAllRows(jsonData.slice(1).map((row) => row.map((cell) => String(cell || ""))));
        setHeadlineColumn("");
        setEstruturaColumn("");
      }
    } catch (error) {
      console.error("Erro ao ler arquivo:", error);
    }
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

  const handleImport = async () => {
    if (!file || !headlineColumn) return;

    const headlineIdx = headers.indexOf(headlineColumn);
    const estruturaIdx = estruturaColumn ? headers.indexOf(estruturaColumn) : -1;

    const headlines = allRows
      .filter((row) => row[headlineIdx]?.trim())
      .map((row) => ({
        headline: row[headlineIdx].trim(),
        estrutura: estruturaIdx >= 0 ? row[estruturaIdx]?.trim() : undefined,
        arquivo_origem: file.name,
      }));

    await importMutation.mutateAsync(headlines);
    
    // Reset
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setAllRows([]);
    setHeadlineColumn("");
    setEstruturaColumn("");
  };

  const handleDeleteFile = async (fileName: string) => {
    if (confirm(`Remover todas as headlines do arquivo "${fileName}"?`)) {
      await deleteMutation.mutateAsync(fileName);
    }
  };

  const totalHeadlinesToImport = headlineColumn
    ? allRows.filter((row) => row[headers.indexOf(headlineColumn)]?.trim()).length
    : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload de Excel com Headlines
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Área de upload */}
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

          {/* Preview e seleção de colunas */}
          {headers.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coluna de Headline *</Label>
                  <Select value={headlineColumn} onValueChange={setHeadlineColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Coluna de Estrutura (opcional)</Label>
                  <Select value={estruturaColumn} onValueChange={setEstruturaColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {headers.filter((h) => h !== headlineColumn).map((h, i) => (
                        <SelectItem key={i} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview das primeiras linhas */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 text-xs font-medium">
                  Preview (primeiras 5 linhas)
                </div>
                <ScrollArea className="h-32">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {headers.map((h, i) => (
                          <th key={i} className="px-2 py-1 text-left font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b">
                          {row.map((cell, j) => (
                            <td key={j} className="px-2 py-1 truncate max-w-[150px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>

              <Button
                onClick={handleImport}
                disabled={!headlineColumn || importMutation.isPending}
                className="w-full"
              >
                {importMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Importar {totalHeadlinesToImport} headlines
              </Button>
            </div>
          )}

          {/* Lista de arquivos já importados */}
          {Object.keys(fileGroups).length > 0 && (
            <div className="border rounded-lg">
              <div className="bg-muted px-3 py-2 text-xs font-medium flex justify-between items-center">
                <span>Arquivos Importados</span>
                <span className="text-muted-foreground">
                  {existingHeadlines.length} headlines total
                </span>
              </div>
              <ScrollArea className="max-h-40">
                <div className="p-2 space-y-1">
                  {Object.entries(fileGroups).map(([fileName, headlines]) => (
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
