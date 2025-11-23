import { NavLink } from "react-router-dom";
import {
  MessageSquare,
  Users,
  Sparkles,
  FileText,
  ClipboardCheck,
  GraduationCap,
  Calendar,
  Lightbulb,
  UserCog,
  User,
  Zap,
  LayoutDashboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAtividadesNaoVisualizadas } from "@/hooks/useAtividadesGerais";

const menuItems = [
  { title: "Mural", url: "/", icon: MessageSquare },
  { title: "Dash Geral", url: "/dash-geral", icon: LayoutDashboard },
  { title: "Meu Perfil", url: "/perfil", icon: User },
  { title: "Meus Mentorados", url: "/mentorados", icon: Users },
  { title: "Banco de Prompts", url: "/prompts", icon: Sparkles },
  { title: "Planilhas Importantes", url: "/headlines", icon: FileText },
  { title: "Teste de Conhecimento", url: "/testes", icon: ClipboardCheck },
  { title: "Treinamentos", url: "/treinamentos", icon: GraduationCap },
  { title: "Atividades", url: "/modo-flow", icon: Zap },
  { title: "Calendário", url: "/calendario", icon: Calendar },
  { title: "Ideias de Melhorias", url: "/ideias-melhorias", icon: Lightbulb },
  { title: "Gerenciar Usuários", url: "/usuarios", icon: UserCog },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { data: contadorNaoLidas = 0 } = useAtividadesNaoVisualizadas();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-primary font-semibold text-base mb-2">
            {open && "Central da Equipe"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                      {item.title === "Atividades" && contadorNaoLidas > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {contadorNaoLidas}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
