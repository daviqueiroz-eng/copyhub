import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

export interface TrelloCard {
  cardName: string;
  cardDescription: string;
  labels: string;
  members: string;
  listName: string;
  prazoMaxRoteiros: string;
  planoMentoria: string;
}

interface TrelloImport {
  id: string;
  created_at: string;
  created_by: string | null;
  nome_arquivo: string;
  dados: Json;
  updated_at: string;
}

export const useTrelloImport = () => {
  return useQuery({
    queryKey: ["trello-import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trello_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // No data found
        }
        throw error;
      }
      return data as TrelloImport;
    },
  });
};

export const useUploadTrello = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nomeArquivo, dados }: { nomeArquivo: string; dados: TrelloCard[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("trello_imports")
        .insert({
          nome_arquivo: nomeArquivo,
          dados: dados as unknown as Json,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trello-import"] });
      toast({
        title: "Importação concluída",
        description: "O arquivo do Trello foi importado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Parser de CSV robusto que lida com campos multi-linha e aspas
export function parseTrelloCSV(csvText: string): TrelloCard[] {
  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if (char === '\n' && !insideQuotes) {
      lines.push(currentLine);
      currentLine = "";
    } else if (char === '\r' && !insideQuotes) {
      // Skip carriage returns
    } else {
      currentLine += char;
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const cardNameIdx = headers.findIndex(h => h.toLowerCase().includes("card name"));
  const descIdx = headers.findIndex(h => h.toLowerCase().includes("card description"));
  const labelsIdx = headers.findIndex(h => h.toLowerCase().includes("labels"));
  const membersIdx = headers.findIndex(h => h.toLowerCase().includes("members"));
  const listNameIdx = headers.findIndex(h => h.toLowerCase().includes("list name"));
  const prazoIdx = headers.findIndex(h => h.toLowerCase().includes("prazo máx. roteiros") || h.toLowerCase().includes("prazo max. roteiros"));
  const planoIdx = headers.findIndex(h => h.toLowerCase().includes("plano mentoria"));

  const cards: TrelloCard[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;

    cards.push({
      cardName: values[cardNameIdx] || "",
      cardDescription: values[descIdx] || "",
      labels: values[labelsIdx] || "",
      members: values[membersIdx] || "",
      listName: values[listNameIdx] || "",
      prazoMaxRoteiros: values[prazoIdx] || "",
      planoMentoria: values[planoIdx] || "",
    });
  }

  return cards;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

// Extrair lista única de copywriters (Members)
export function extractUniqueCopywriters(cards: TrelloCard[]): string[] {
  const copywriters = new Set<string>();
  
  cards.forEach(card => {
    if (card.members && card.members.trim()) {
      // Members podem estar separados por vírgula
      card.members.split(",").forEach(member => {
        const trimmed = member.trim();
        if (trimmed) copywriters.add(trimmed);
      });
    }
  });

  return Array.from(copywriters).sort((a, b) => a.localeCompare(b));
}

// Filtrar e ordenar cards por copywriter e prazo
export function filterAndSortCards(cards: TrelloCard[], copywriter: string): TrelloCard[] {
  return cards
    .filter(card => {
      if (!copywriter) return true;
      return card.members.toLowerCase().includes(copywriter.toLowerCase());
    })
    .filter(card => card.prazoMaxRoteiros) // Apenas cards com prazo definido
    .sort((a, b) => {
      const dateA = new Date(a.prazoMaxRoteiros);
      const dateB = new Date(b.prazoMaxRoteiros);
      return dateA.getTime() - dateB.getTime();
    });
}

// Calcular urgência baseado na data
export function getUrgencyLevel(dateString: string): "overdue" | "today" | "this_week" | "normal" {
  if (!dateString) return "normal";
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 7) return "this_week";
  return "normal";
}
