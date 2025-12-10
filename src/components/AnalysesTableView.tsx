import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Search, Eye, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Highlight = {
  id: string;
  text: string;
  color: string;
  annotation?: string;
  annotations?: string[];
};

type Progresso = {
  id: string;
  roteiro_id: string;
  user_id: string;
  completado: boolean;
  data_completado: string | null;
  sublinhados?: Highlight[] | null;
  estrutura_invisivel?: string | null;
  gatilhos_atencao?: string | null;
  estrutura_roteiro?: string | null;
  o_que_tornou_viral?: string | null;
  melhorias_potencial?: string | null;
  carga_cognitiva?: number | null;
};

type Roteiro = {
  id: string;
  titulo: string;
  nicho_id?: string;
  criador_conteudo?: string;
  visualizacoes?: string;
};

type CorAnalise = {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
};

type Nicho = {
  id: string;
  nome: string;
};

interface AnalysesTableViewProps {
  progressos: Progresso[];
  roteiros: Roteiro[];
  cores: CorAnalise[];
  nichos: Nicho[];
  onSelectAnalysis: (progressoId: string) => void;
}

export const AnalysesTableView = ({
  progressos,
  roteiros,
  cores,
  nichos,
  onSelectAnalysis,
}: AnalysesTableViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNicho, setSelectedNicho] = useState<string>("all");
  const [selectedCor, setSelectedCor] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filtrar apenas progressos completados
  const completedProgressos = useMemo(() => {
    return progressos.filter(p => p.completado);
  }, [progressos]);

  // Calcular contagem de highlights por cor para cada progresso
  const getHighlightCounts = (sublinhados: Highlight[] | null) => {
    if (!sublinhados || !Array.isArray(sublinhados)) return {};
    
    const counts: Record<string, number> = {};
    sublinhados.forEach(h => {
      counts[h.color] = (counts[h.color] || 0) + 1;
    });
    return counts;
  };

  // Filtrar progressos
  const filteredProgressos = useMemo(() => {
    return completedProgressos.filter(progresso => {
      const roteiro = roteiros.find(r => r.id === progresso.roteiro_id);
      if (!roteiro) return false;

      // Filtro por busca
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = roteiro.titulo.toLowerCase().includes(term);
        const matchesCreator = roteiro.criador_conteudo?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesCreator) return false;
      }

      // Filtro por nicho
      if (selectedNicho !== "all" && roteiro.nicho_id !== selectedNicho) {
        return false;
      }

      // Filtro por cor
      if (selectedCor !== "all") {
        const counts = getHighlightCounts(progresso.sublinhados);
        if (!counts[selectedCor]) return false;
      }

      return true;
    });
  }, [completedProgressos, roteiros, searchTerm, selectedNicho, selectedCor]);

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getHighlightsForColor = (sublinhados: Highlight[] | null, color: string) => {
    if (!sublinhados) return [];
    return sublinhados.filter(h => h.color === color);
  };

  return (
    <Card className="p-4 w-full">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou criador..."
            className="pl-9"
          />
        </div>
        
        <Select value={selectedNicho} onValueChange={setSelectedNicho}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por nicho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os nichos</SelectItem>
            {nichos.map((nicho) => (
              <SelectItem key={nicho.id} value={nicho.id}>
                {nicho.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCor} onValueChange={setSelectedCor}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {cores.map((cor) => (
              <SelectItem key={cor.id} value={cor.cor}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: cor.cor }}
                  />
                  {cor.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contador */}
      <div className="mb-3 text-sm text-muted-foreground">
        {filteredProgressos.length} análise{filteredProgressos.length !== 1 ? 's' : ''} encontrada{filteredProgressos.length !== 1 ? 's' : ''}
      </div>

      {/* Tabela com scroll horizontal e vertical */}
      <div className="w-full overflow-x-auto border rounded-lg">
        <ScrollArea className="h-[calc(100vh-450px)] min-h-[400px]">
          <Table className="min-w-[1400px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px] sticky left-0 bg-muted/50"></TableHead>
                <TableHead className="min-w-[280px] sticky left-[50px] bg-muted/50">Roteiro</TableHead>
                <TableHead className="min-w-[140px]">Nicho</TableHead>
                <TableHead className="min-w-[140px]">Criador</TableHead>
                <TableHead className="w-[100px] text-center">Views</TableHead>
                {cores.map((cor) => (
                  <TableHead key={cor.id} className="min-w-[120px] text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full border flex-shrink-0"
                        style={{ backgroundColor: cor.cor }}
                      />
                      <span className="text-xs font-medium">{cor.nome}</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-[110px] text-center">Data</TableHead>
                <TableHead className="w-[90px]"></TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredProgressos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={cores.length + 7} className="text-center py-8 text-muted-foreground">
                  Nenhuma análise encontrada com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filteredProgressos.map((progresso) => {
                const roteiro = roteiros.find(r => r.id === progresso.roteiro_id);
                if (!roteiro) return null;
                
                const nicho = nichos.find(n => n.id === roteiro.nicho_id);
                const counts = getHighlightCounts(progresso.sublinhados);
                const isExpanded = expandedRows.has(progresso.id);

                return (
                  <>
                    <TableRow 
                      key={progresso.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => toggleRowExpansion(progresso.id)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[250px]" title={roteiro.titulo}>
                            {roteiro.titulo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {nicho ? (
                          <Badge variant="secondary" className="text-xs">
                            {nicho.nome}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {roteiro.criador_conteudo ? (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[100px]">{roteiro.criador_conteudo}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {roteiro.visualizacoes ? (
                          <div className="flex items-center justify-center gap-1 text-sm">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            <span>{roteiro.visualizacoes}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      {cores.map((cor) => (
                        <TableCell key={cor.id} className="text-center">
                          {counts[cor.cor] ? (
                            <Badge 
                              className="text-xs font-bold"
                              style={{ 
                                backgroundColor: cor.cor,
                                color: isLightColor(cor.cor) ? '#000' : '#fff'
                              }}
                            >
                              {counts[cor.cor]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">0</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {progresso.data_completado
                          ? format(new Date(progresso.data_completado), "dd/MM/yy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAnalysis(progresso.id);
                          }}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Linha expandida */}
                    {isExpanded && (
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={cores.length + 7}>
                          <div className="p-4 space-y-4">
                            {/* Grid de highlights por cor */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {cores.map((cor) => {
                                const highlights = getHighlightsForColor(progresso.sublinhados, cor.cor);
                                if (highlights.length === 0) return null;
                                
                                return (
                                  <div key={cor.id} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-4 h-4 rounded border"
                                        style={{ backgroundColor: cor.cor }}
                                      />
                                      <span className="font-medium text-sm">{cor.nome}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {highlights.length}
                                      </Badge>
                                    </div>
                                    <div className="space-y-1 pl-6">
                                      {highlights.slice(0, 5).map((h, idx) => (
                                        <div key={h.id || idx} className="text-xs">
                                          <span 
                                            className="px-1 py-0.5 rounded"
                                            style={{ backgroundColor: cor.cor, color: isLightColor(cor.cor) ? '#000' : '#fff' }}
                                          >
                                            {h.text.length > 50 ? h.text.slice(0, 50) + '...' : h.text}
                                          </span>
                                          {h.annotation && (
                                            <span className="ml-2 text-muted-foreground">
                                              → {h.annotation}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                      {highlights.length > 5 && (
                                        <span className="text-xs text-muted-foreground">
                                          +{highlights.length - 5} mais...
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Resumo da análise */}
                            {(progresso.estrutura_invisivel || progresso.gatilhos_atencao || progresso.o_que_tornou_viral) && (
                              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {progresso.estrutura_invisivel && (
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">Estrutura da Headline</span>
                                    <p className="text-sm mt-1 line-clamp-2">{progresso.estrutura_invisivel}</p>
                                  </div>
                                )}
                                {progresso.gatilhos_atencao && (
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">Gatilhos da Atenção</span>
                                    <p className="text-sm mt-1 line-clamp-2">{progresso.gatilhos_atencao}</p>
                                  </div>
                                )}
                                {progresso.o_que_tornou_viral && (
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">O que tornou viral</span>
                                    <p className="text-sm mt-1 line-clamp-2">{progresso.o_que_tornou_viral}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </ScrollArea>
      </div>
    </Card>
  );
};

// Função auxiliar para determinar se uma cor é clara
function isLightColor(color: string): boolean {
  // Remove # se presente
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // Calcula luminosidade
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
