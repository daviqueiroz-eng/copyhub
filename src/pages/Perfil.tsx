import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Upload, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const perfilSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cargo: z.enum(['junior', 'pleno', 'senior']),
  pdi: z.string().optional(),
});

type PerfilFormData = z.infer<typeof perfilSchema>;

const Perfil = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    values: {
      nome: profile?.nome || "",
      cargo: (profile?.cargo as 'junior' | 'pleno' | 'senior') || 'junior',
      pdi: profile?.pdi || "",
    },
  });

  const cargoValue = watch("cargo");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 5MB.");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error("Formato não suportado. Use JPG, PNG ou WEBP.");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PerfilFormData) => {
    try {
      let avatarUrl = profile?.avatar;

      // Upload do avatar se houver arquivo
      if (avatarFile) {
        avatarUrl = await uploadAvatar.mutateAsync(avatarFile);
      }

      // Atualizar perfil
      await updateProfile.mutateAsync({
        nome: data.nome,
        cargo: data.cargo,
        pdi: data.pdi || null,
        avatar: avatarUrl || null,
      });

      toast.success("Perfil atualizado com sucesso!");
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <Card className="p-8">
          <div className="space-y-6 animate-pulse">
            <div className="h-32 w-32 rounded-full bg-muted"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  const currentAvatar = avatarPreview || profile?.avatar;
  const initials = profile?.nome?.substring(0, 2).toUpperCase() || "US";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Meu Perfil</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações pessoais e desenvolvimento
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={currentAvatar || undefined} alt={profile?.nome} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center gap-2">
              <Label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Alterar Foto
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou WEBP. Máximo 5MB.
              </p>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              {...register("nome")}
              placeholder="Seu nome completo"
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado
            </p>
          </div>

          {/* Cargo */}
          <div className="space-y-4">
            <Label>Cargo</Label>
            <RadioGroup
              value={cargoValue}
              onValueChange={(value) =>
                setValue("cargo", value as 'junior' | 'pleno' | 'senior')
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="junior" id="junior" />
                <Label htmlFor="junior" className="cursor-pointer font-normal">
                  Junior
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pleno" id="pleno" />
                <Label htmlFor="pleno" className="cursor-pointer font-normal">
                  Pleno
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="senior" id="senior" />
                <Label htmlFor="senior" className="cursor-pointer font-normal">
                  Sênior
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* PDI */}
          <div className="space-y-2">
            <Label htmlFor="pdi">
              PDI - Processo de Desenvolvimento Individual
            </Label>
            <Textarea
              id="pdi"
              {...register("pdi")}
              placeholder="Descreva seus objetivos de desenvolvimento, áreas que deseja melhorar, metas de curto e longo prazo..."
              className="min-h-[150px]"
            />
            {errors.pdi && (
              <p className="text-sm text-destructive">{errors.pdi.message}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              disabled={updateProfile.isPending || uploadAvatar.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateProfile.isPending || uploadAvatar.isPending}
            >
              {(updateProfile.isPending || uploadAvatar.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Perfil
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Perfil;
