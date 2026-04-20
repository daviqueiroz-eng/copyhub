import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TermoViral } from "./useTermosVirais";

export type RevisaoErrorTipo =
  | "ortografico"
  | "gramatical"
  | "nome_cliente"
  | "mentorado";

export type RevisaoError = {
  id: string;
  tipo: RevisaoErrorTipo;
  texto: string;
  sugestoes: string[];
  mensagem: string;
  posicao: {
    guiaNumero: number;
    ordem: number;
    field: "headline" | "estrutura";
    inicio: number;
    fim: number;
  };
};

type RoteiroLocal = { headline: string; estrutura: string };

interface UseRevisaoInteligenteParams {
  enabled: boolean;
  guiaAtiva: number;
  guiaQuantidade: number;
  roteirosLocais: Map<string, RoteiroLocal>;
  mentoradoNome: string;
  termosVirais: TermoViral[];
}

// Hash simples para evitar reprocessar o mesmo conteúdo
const hashString = (str: string): string => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(h);
};

// Remove acentos para comparação case/diacritic-insensitive
const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Detecta variações erradas do nome do mentorado (case incorreto, sem acento)
const detectNomeCliente = (
  text: string,
  nomeOriginal: string,
  guiaNumero: number,
  ordem: number,
  field: "headline" | "estrutura"
): RevisaoError[] => {
  if (!nomeOriginal || nomeOriginal.trim().length < 2) return [];
  const erros: RevisaoError[] = [];

  // Considera apenas o primeiro nome para reduzir falsos positivos
  const primeiroNome = nomeOriginal.trim().split(/\s+/)[0];
  if (primeiroNome.length < 3) return [];

  const nomeStripped = stripAccents(primeiroNome);
  const regex = new RegExp(`\\b\\w{${primeiroNome.length}}\\b`, "g");

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const ocorrencia = match[0];
    if (ocorrencia === primeiroNome) continue; // forma correta
    if (stripAccents(ocorrencia) === nomeStripped) {
      erros.push({
        id: `nome-${guiaNumero}-${ordem}-${field}-${match.index}`,
        tipo: "nome_cliente",
        texto: ocorrencia,
        sugestoes: [primeiroNome],
        mensagem: `Nome do cliente escrito de forma diferente do cadastro ("${primeiroNome}")`,
        posicao: {
          guiaNumero,
          ordem,
          field,
          inicio: match.index,
          fim: match.index + ocorrencia.length,
        },
      });
    }
  }
  return erros;
};

// Cruza com termos virais já registrados pelo mentorado
const detectMentoradoTermos = (
  text: string,
  termos: TermoViral[],
  guiaNumero: number,
  ordem: number,
  field: "headline" | "estrutura"
): RevisaoError[] => {
  if (!text || termos.length === 0) return [];
  const erros: RevisaoError[] = [];
  const seen = new Set<string>();

  termos.forEach((termo) => {
    const t = termo.termo?.trim();
    if (!t || t.length < 3) return;
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$1");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const key = `${match.index}-${t}`;
      if (seen.has(key)) continue;
      seen.add(key);
      erros.push({
        id: `mentorado-${guiaNumero}-${ordem}-${field}-${match.index}-${termo.id}`,
        tipo: "mentorado",
        texto: match[0],
        sugestoes: [],
        mensagem: `Mentorado já pontuou com este termo${termo.nicho_nome ? ` (${termo.nicho_nome})` : ""}`,
        posicao: {
          guiaNumero,
          ordem,
          field,
          inicio: match.index,
          fim: match.index + match[0].length,
        },
      });
    }
  });
  return erros;
};

// Encontra a posição real (inicio/fim) do "original" no texto, próximo a uma posição aproximada
const findOccurrence = (
  text: string,
  needle: string,
  approxPos: number
): { inicio: number; fim: number } | null => {
  if (!needle) return null;
  // tenta primeiro perto da posição aproximada
  const window = 100;
  const start = Math.max(0, approxPos - window);
  const slice = text.substring(start, approxPos + window + needle.length);
  const localIdx = slice.indexOf(needle);
  if (localIdx >= 0) {
    const inicio = start + localIdx;
    return { inicio, fim: inicio + needle.length };
  }
  // fallback: busca global
  const idx = text.indexOf(needle);
  if (idx >= 0) return { inicio: idx, fim: idx + needle.length };
  return null;
};

export const useRevisaoInteligente = ({
  enabled,
  guiaAtiva,
  guiaQuantidade,
  roteirosLocais,
  mentoradoNome,
  termosVirais,
}: UseRevisaoInteligenteParams) => {
  const [errors, setErrors] = useState<RevisaoError[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiCache, setAiCache] = useState<Map<string, RevisaoError[]>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  // Snapshot estável dos textos da guia ativa para evitar reprocessar
  const textsSnapshot = useMemo(() => {
    const out: Array<{
      key: string;
      ordem: number;
      headline: string;
      estrutura: string;
    }> = [];
    for (let ordem = 1; ordem <= guiaQuantidade; ordem++) {
      const key = `${guiaAtiva}-${ordem}`;
      const r = roteirosLocais.get(key) || { headline: "", estrutura: "" };
      out.push({ key, ordem, headline: r.headline || "", estrutura: r.estrutura || "" });
    }
    return out;
  }, [guiaAtiva, guiaQuantidade, roteirosLocais]);

  const snapshotHash = useMemo(
    () =>
      hashString(
        textsSnapshot.map((t) => `${t.ordem}|${t.headline}|${t.estrutura}`).join("\n")
      ),
    [textsSnapshot]
  );

  const runAnalysis = useCallback(async () => {
    if (!enabled) {
      setErrors([]);
      return;
    }
    const myRunId = ++runIdRef.current;
    setIsAnalyzing(true);

    // 1) Análise local instantânea (nome cliente + termos virais)
    const localErrors: RevisaoError[] = [];
    textsSnapshot.forEach(({ ordem, headline, estrutura }) => {
      (["headline", "estrutura"] as const).forEach((field) => {
        const text = field === "headline" ? headline : estrutura;
        if (!text) return;
        localErrors.push(
          ...detectNomeCliente(text, mentoradoNome, guiaAtiva, ordem, field)
        );
        localErrors.push(
          ...detectMentoradoTermos(text, termosVirais, guiaAtiva, ordem, field)
        );
      });
    });

    // 2) Análise IA (ortográfico + gramatical) — usa cache por hash de texto
    const aiResultsAll: RevisaoError[] = [];
    const newCache = new Map(aiCache);

    const checkText = async (
      text: string,
      ordem: number,
      field: "headline" | "estrutura"
    ) => {
      if (!text || text.trim().length < 10) return;
      const cacheKey = `${field}|${hashString(text)}`;
      let cached = newCache.get(cacheKey);
      if (!cached) {
        try {
          const { data, error } = await supabase.functions.invoke("spell-check", {
            body: { text, language: "pt-BR" },
          });
          if (error || !data?.errors) {
            cached = [];
          } else {
            cached = (data.errors as any[])
              .map((err, idx) => {
                const original = err.original || "";
                const pos = findOccurrence(text, original, err.position || 0);
                if (!pos) return null;
                const tipo: RevisaoErrorTipo =
                  err.type === "grammar" ? "gramatical" : "ortografico";
                return {
                  id: `ai-${guiaAtiva}-${ordem}-${field}-${idx}-${pos.inicio}`,
                  tipo,
                  texto: original,
                  sugestoes: err.suggestion ? [err.suggestion] : [],
                  mensagem: err.message || `Sugestão: "${err.suggestion || ""}"`,
                  posicao: {
                    guiaNumero: guiaAtiva,
                    ordem,
                    field,
                    inicio: pos.inicio,
                    fim: pos.fim,
                  },
                } as RevisaoError;
              })
              .filter((e): e is RevisaoError => e !== null);
          }
          newCache.set(cacheKey, cached);
        } catch (e) {
          cached = [];
        }
      } else {
        // recriar com IDs/posições atualizados para o texto atual
        cached = cached
          .map((c, idx) => {
            const pos = findOccurrence(text, c.texto, c.posicao.inicio);
            if (!pos) return null;
            return {
              ...c,
              id: `ai-${guiaAtiva}-${ordem}-${field}-${idx}-${pos.inicio}`,
              posicao: {
                guiaNumero: guiaAtiva,
                ordem,
                field,
                inicio: pos.inicio,
                fim: pos.fim,
              },
            };
          })
          .filter((c): c is RevisaoError => c !== null);
      }
      aiResultsAll.push(...cached);
    };

    for (const t of textsSnapshot) {
      if (myRunId !== runIdRef.current) return; // cancelado
      await checkText(t.headline, t.ordem, "headline");
      if (myRunId !== runIdRef.current) return;
      await checkText(t.estrutura, t.ordem, "estrutura");
    }

    if (myRunId !== runIdRef.current) return;
    setAiCache(newCache);
    setErrors([...localErrors, ...aiResultsAll]);
    setIsAnalyzing(false);
  }, [enabled, textsSnapshot, mentoradoNome, termosVirais, guiaAtiva, aiCache]);

  // Debounce 800ms ao mudar conteúdo / habilitar
  useEffect(() => {
    if (!enabled) {
      setErrors([]);
      setIsAnalyzing(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runAnalysis();
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, snapshotHash, mentoradoNome, termosVirais.length]);

  const removeError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    errors,
    isAnalyzing,
    reanalisar: runAnalysis,
    removeError,
  };
};