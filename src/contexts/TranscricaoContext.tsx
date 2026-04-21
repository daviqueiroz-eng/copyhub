import { createContext, useCallback, useContext, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const TRANSCRIBE_WEBHOOK_URL =
  "https://eduardocorestudio.app.n8n.cloud/webhook/96d8a870-b483-4863-a854-5ec579bba0d0";

type TranscricaoState = {
  // Map roteiroId -> está transcrevendo?
  pending: Record<string, boolean>;
  start: (params: {
    roteiroId: string;
    headline?: string;
    linkReferencia: string;
    mentoradoNome?: string;
  }) => void;
  isPending: (roteiroId: string) => boolean;
};

const TranscricaoContext = createContext<TranscricaoState | null>(null);

export const TranscricaoProvider = ({ children }: { children: React.ReactNode }) => {
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const inFlightRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const start = useCallback(
    async ({
      roteiroId,
      headline,
      linkReferencia,
      mentoradoNome,
    }: {
      roteiroId: string;
      headline?: string;
      linkReferencia: string;
      mentoradoNome?: string;
    }) => {
      if (!roteiroId || !linkReferencia) return;
      if (inFlightRef.current.has(roteiroId)) return;
      inFlightRef.current.add(roteiroId);
      setPending((p) => ({ ...p, [roteiroId]: true }));

      try {
        const res = await fetch(TRANSCRIBE_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roteiro_id: roteiroId,
            headline: headline ?? "",
            link_referencia: linkReferencia,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.text();
        let texto = "";
        try {
          const json = JSON.parse(raw);
          texto =
            (typeof json === "string" && json) ||
            json?.transcricao ||
            json?.text ||
            json?.texto ||
            json?.output ||
            json?.result ||
            json?.data ||
            (Array.isArray(json) &&
              (json[0]?.transcricao || json[0]?.text || json[0]?.output)) ||
            "";
          if (typeof texto !== "string") texto = JSON.stringify(texto);
        } catch {
          texto = raw;
        }
        if (!texto || !texto.trim()) {
          throw new Error("Resposta vazia do webhook");
        }

        // Buscar valor atual do banco para anexar (não sobrescrever)
        const { data: anotacaoExistente } = await supabase
          .from("mentorados_roteiros_anotacoes")
          .select("id, referencia_texto, user_id")
          .eq("roteiro_id", roteiroId)
          .maybeSingle();

        const atual = (anotacaoExistente?.referencia_texto ?? "").trim();
        const novoValor = atual ? `${atual}\n\n${texto}` : texto;

        if (anotacaoExistente?.id) {
          const { error } = await supabase
            .from("mentorados_roteiros_anotacoes")
            .update({ referencia_texto: novoValor })
            .eq("id", anotacaoExistente.id);
          if (error) throw error;
        } else {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id;
          if (!userId) throw new Error("Usuário não autenticado");
          const { error } = await supabase
            .from("mentorados_roteiros_anotacoes")
            .insert({
              roteiro_id: roteiroId,
              user_id: userId,
              referencia_texto: novoValor,
            });
          if (error) throw error;
        }

        // Invalidar cache para refletir no painel quando o usuário voltar
        queryClient.invalidateQueries({ queryKey: ["roteiro_anotacoes", roteiroId] });

        toast({
          title: "Transcrição concluída",
          description: mentoradoNome ? `Salva em ${mentoradoNome}` : undefined,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        toast({
          title: "Falha ao transcrever referência",
          description: mentoradoNome ? `${mentoradoNome}: ${msg}` : msg,
          variant: "destructive",
        });
      } finally {
        inFlightRef.current.delete(roteiroId);
        setPending((p) => {
          const next = { ...p };
          delete next[roteiroId];
          return next;
        });
      }
    },
    [queryClient]
  );

  const isPending = useCallback(
    (roteiroId: string) => !!pending[roteiroId],
    [pending]
  );

  return (
    <TranscricaoContext.Provider value={{ pending, start, isPending }}>
      {children}
    </TranscricaoContext.Provider>
  );
};

export const useTranscricaoReferencia = () => {
  const ctx = useContext(TranscricaoContext);
  if (!ctx) {
    throw new Error("useTranscricaoReferencia must be used within TranscricaoProvider");
  }
  return ctx;
};
