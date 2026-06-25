import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronRight } from "lucide-react";

type Guia = {
  guia_numero: number;
  slug: string | null;
  token: string;
  nome: string;
};
type Dados = {
  mentorado_nome: string;
  guias: Guia[];
  error?: string;
};

export default function MentoradoPublico() {
  const { slug } = useParams<{ slug: string }>();
  const [dados, setDados] = useState<Dados | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_mentorado_publico", {
        _slug_or_token: slug,
      });
      if (error) {
        setDados({ mentorado_nome: "", guias: [], error: error.message });
      } else {
        setDados(data as unknown as Dados);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dados || dados.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Link inválido ou expirado</h1>
          <p className="text-sm text-muted-foreground">
            Peça um novo link para o mentor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Roteiros de
          </p>
          <h1 className="text-2xl font-semibold">{dados.mentorado_nome}</h1>
          <p className="text-sm text-muted-foreground">
            Selecione uma guia para visualizar e comentar.
          </p>
        </header>

        {dados.guias.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            Nenhuma guia disponível no momento.
          </div>
        ) : (
          <ul className="space-y-2">
            {dados.guias.map((g) => {
              const target = g.slug || g.token;
              return (
                <li key={g.guia_numero}>
                  <Link
                    to={`/r/${target}`}
                    className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-semibold w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "#B8860B", color: "white" }}
                      >
                        {g.guia_numero}
                      </span>
                      <span className="text-sm font-medium">{g.nome}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}