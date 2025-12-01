import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Apenas coreadm@gmail.com pode fazer login com email/senha
    if (email.toLowerCase() !== "coreadm@gmail.com") {
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
          {showAdminLogin ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Administrativo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="coreadm@gmail.com"
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
                {loading ? "Carregando..." : "Entrar como Admin"}
              </Button>

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
                Login administrativo
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Apenas emails pré-autorizados podem acessar a plataforma.
                <br />
                Entre em contato com o administrador se não conseguir fazer login.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
