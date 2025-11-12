import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCog, Lock, Unlock, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  nome: string;
  email: string;
  avatar?: string;
  ativo: boolean;
  roles: string[];
  created_at: string;
}

interface AllowedEmail {
  email: string;
  nome: string;
}

export default function GerenciarUsuarios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [newNome, setNewNome] = useState("");

  // Buscar usuários
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-usuarios`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ action: "list" }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch users");
      }

      return response.json() as Promise<{ users: User[]; allowedEmails: AllowedEmail[] }>;
    },
  });

  // Mutation para ações de usuário
  const actionMutation = useMutation({
    mutationFn: async (params: { action: string; userId?: string; status?: boolean; role?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-usuarios`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Action failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Sucesso",
        description: "Ação executada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para adicionar email à whitelist
  const addEmailMutation = useMutation({
    mutationFn: async ({ email, nome }: { email: string; nome: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-usuarios`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ action: "add_to_whitelist", email, nome }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add email");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setNewEmail("");
      setNewNome("");
      toast({
        title: "Sucesso",
        description: "Email adicionado à whitelist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    if (userId === user?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode modificar seu próprio status",
        variant: "destructive",
      });
      return;
    }
    actionMutation.mutate({ action: "toggle_status", userId, status: !currentStatus });
  };

  const handleDelete = (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode deletar sua própria conta",
        variant: "destructive",
      });
      return;
    }
    if (confirm("Tem certeza que deseja deletar este usuário?")) {
      actionMutation.mutate({ action: "delete", userId });
    }
  };

  const handleUpdateRole = (userId: string, role: string) => {
    if (userId === user?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode modificar sua própria role",
        variant: "destructive",
      });
      return;
    }
    actionMutation.mutate({ action: "update_role", userId, role });
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail && newNome) {
      addEmailMutation.mutate({ email: newEmail, nome: newNome });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <UserCog className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
      </div>

      {/* Adicionar novo usuário à whitelist */}
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Adicionar Usuário à Whitelist
        </h2>
        <form onSubmit={handleAddEmail} className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Nome do usuário"
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={addEmailMutation.isPending}>
              {addEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </div>
        </form>
      </div>

      {/* Tabela de usuários */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={usuario.avatar} />
                      <AvatarFallback>
                        {usuario.nome.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{usuario.nome}</span>
                  </div>
                </TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  <Badge variant={usuario.ativo ? "default" : "destructive"}>
                    {usuario.ativo ? "Ativo" : "Bloqueado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={usuario.roles[0] || "user"}
                    onValueChange={(value) => handleUpdateRole(usuario.id, value)}
                    disabled={usuario.id === user?.id || actionMutation.isPending}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {new Date(usuario.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(usuario.id, usuario.ativo)}
                      disabled={actionMutation.isPending || usuario.id === user?.id}
                    >
                      {usuario.ativo ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(usuario.id)}
                      disabled={actionMutation.isPending || usuario.id === user?.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Lista de emails na whitelist */}
      {data?.allowedEmails && data.allowedEmails.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Emails Autorizados na Whitelist</h2>
          <div className="space-y-2">
            {data.allowedEmails.map((email) => (
              <div
                key={email.email}
                className="flex items-center justify-between p-3 bg-muted rounded"
              >
                <div>
                  <p className="font-medium">{email.nome}</p>
                  <p className="text-sm text-muted-foreground">{email.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}