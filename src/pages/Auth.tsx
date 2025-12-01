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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = isSignUp 
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password);
    
    if (error) {
      toast({
        title: isSignUp ? "Erro ao criar conta" : "Erro ao entrar",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else if (isSignUp) {
      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login.",
      });
      setIsSignUp(false);
      setPassword("");
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
            {isSignUp ? "Crie sua conta para acessar a plataforma" : "Entre para acessar a plataforma"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
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
                minLength={6}
              />
            </div>

            <Button 
              type="submit"
              variant="default" 
              className="w-full h-12 text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Carregando..." : (isSignUp ? "Criar conta" : "Entrar")}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setPassword("");
              }}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              {isSignUp ? "Já tem conta? Fazer login" : "Não tem conta? Criar conta"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button 
            onClick={handleGoogleSignIn} 
            variant="outline" 
            className="w-full h-12 text-base font-semibold"
            disabled={loading}
          >
            Entrar com Google
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Apenas emails pré-autorizados podem acessar a plataforma.
            <br />
            Entre em contato com o administrador se não conseguir fazer login.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
