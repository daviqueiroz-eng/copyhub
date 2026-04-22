import { useEffect, useState } from "react";
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
import { ExternalLink, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    setEmbedded(isEmbeddedWebView());
  }, []);

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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!embedded && email.toLowerCase() !== "coreadm@gmail.com") {
      toast({
        title: "Acesso negado",
        description: "Login com email/senha disponível apenas para administradores.",
        variant: "destructive",
      });
      return;
    }

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
            Entre com sua conta Google para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {embedded && !showAdminLogin && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Ambiente embutido detectado</AlertTitle>
              <AlertDescription className="space-y-2">
                <p className="text-xs">
                  O Google não autentica de forma confiável dentro do Obsidian.
                  Para entrar aqui mesmo, use email e senha; se ainda não tiver senha,
                  envie o link de criação abaixo.
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
              </AlertDescription>
            </Alert>
          )}
          {showAdminLogin || embedded ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{embedded ? "Seu email" : "Email Administrativo"}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={embedded ? "voce@empresa.com" : "coreadm@gmail.com"}
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
                {loading ? "Carregando..." : embedded ? "Entrar com email" : "Entrar como Admin"}
              </Button>

              {embedded && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={handlePasswordReset}
                >
                  Criar / recuperar senha por email
                </Button>
              )}

              {!embedded && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminLogin(false);
                    setEmail("");
                    setPassword("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Voltar para login com Google
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
                onClick={() => setShowAdminLogin(true)}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                {embedded ? "Usar login com email" : "Login administrativo"}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Apenas emails pré-autorizados podem acessar a plataforma.
                <br />
                {embedded
                  ? "Se seu email já foi liberado, crie uma senha pelo botão de recuperação."
                  : "Entre em contato com o administrador se não conseguir fazer login."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
