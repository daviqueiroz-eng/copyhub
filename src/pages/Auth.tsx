import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, isEmbeddedWebView } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, Info, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BUILD_TIME = typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : "dev";

const forceAppUpdate = async () => {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) await reg.unregister();
    }
  } catch {
    // ignore
  }
  window.location.href = window.location.origin + "?v=" + Date.now();
};

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [embedded, setEmbedded] = useState(false);
  const [providerDisabled, setProviderDisabled] = useState(false);

  useEffect(() => {
    setEmbedded(isEmbeddedWebView());
  }, []);

  const shouldShowPasswordLogin = useMemo(
    () => embedded || showPasswordLogin,
    [embedded, showPasswordLogin]
  );

  const handleOpenExternal = () => {
    try {
      window.open(window.location.href, "_blank", "noopener,noreferrer");
    } catch {
      // fallback: copia URL
      navigator.clipboard?.writeText(window.location.href);
      toast({
        title: "Link copiado",
        description: "Cole no seu navegador padrão para entrar.",
      });
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha a senha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await signInWithEmail(email, password);
    
    if (error) {
      if (/provider Email|Email logins are disabled|email_provider_disabled/i.test(error.message || "")) {
        setProviderDisabled(true);
      }
      toast({
        title: "Erro ao entrar",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "Informe seu email",
        description: "Digite seu email para receber o link de criação/recuperação de senha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email enviado",
        description: "Abra o link recebido para definir sua senha e depois entre no Obsidian.",
      });
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        title: "Erro ao conectar com Google",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/mentorados", { replace: true });
    }
  }, [authLoading, navigate, user]);

  if (authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo</CardTitle>
          <CardDescription>
            Acesse com Google ou com a senha manual criada pelo administrador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providerDisabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Login por email desativado</AlertTitle>
              <AlertDescription className="text-xs">
                O administrador precisa ativar o provider <strong>Email</strong> em
                Lovable Cloud → Users → Auth Settings → Sign In Methods → Email.
                Enquanto isso, somente login com Google funcionará.
              </AlertDescription>
            </Alert>
          )}
          {embedded && !showPasswordLogin && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Ambiente embutido detectado</AlertTitle>
              <AlertDescription className="space-y-2">
                <p className="text-xs">
                  O Google não autentica de forma confiável dentro do Obsidian.
                  Para entrar aqui mesmo, use email e senha. Se preferir, você ainda pode abrir o Google no navegador.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleOpenExternal}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir Google no navegador
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full gap-2"
                  onClick={forceAppUpdate}
                >
                  Forçar atualização do app
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {shouldShowPasswordLogin ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Seu email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button 
                type="submit"
                variant="default" 
                className="w-full h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? "Carregando..." : "Entrar com email e senha"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={handlePasswordReset}
              >
                Esqueci minha senha
              </Button>

              {!embedded && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordLogin(false);
                    setEmail("");
                    setPassword("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Voltar para opções de login
                </button>
              )}
            </form>
          ) : (
            <>
              <Button 
                onClick={handleGoogleSignIn} 
                variant="default" 
                className="w-full h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? "Carregando..." : "Entrar com Google"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordLogin(true)}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Entrar com email e senha
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Apenas emails pré-autorizados podem acessar a plataforma.
                <br />
                {embedded
                  ? "Se o administrador já definiu sua senha, você já pode entrar aqui no Obsidian."
                  : "Se precisar de acesso manual, peça ao administrador para definir uma senha para seu usuário."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      {embedded && (
        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-muted-foreground">
          build {BUILD_TIME}
        </div>
      )}
    </div>
  );
}
