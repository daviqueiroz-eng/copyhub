import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TranscricaoProvider } from "@/contexts/TranscricaoContext";
import { ViraisRealtimeProvider } from "@/contexts/ViraisRealtimeProvider";
import { HeadlineVotacoesRealtimeProvider } from "@/contexts/HeadlineVotacoesRealtimeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "./components/Layout";
import Mural from "./pages/Mural";
import Acompanhamento from "./pages/Acompanhamento";
import Mentorados from "./pages/Mentorados";
import Prompts from "./pages/Prompts";
import Headlines from "./pages/Headlines";
import Testes from "./pages/Testes";
import TrinkaGame from "./pages/TrinkaGame";
import AnaliseRoteiroGame from "./pages/AnaliseRoteiroGame";
import Admin from "./pages/Admin";
import Treinamentos from "./pages/Treinamentos";
import Calendario from "./pages/Calendario";
import IdeasMelhorias from "./pages/IdeasMelhorias";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import Atividades from "./pages/Atividades";
import DashGeral from "./pages/DashGeral";
import CoreStudioTasks from "./pages/CoreStudioTasks";
import Virais from "./pages/Virais";
import RoteiroPublico from "./pages/RoteiroPublico";

const queryClient = new QueryClient();

const RootRedirect = () => {
  const location = useLocation();
  const hash = location.hash || "";
  const hasAuthHash = hash.includes("access_token=") || hash.includes("refresh_token=") || hash.includes("error=");

  if (hasAuthHash) {
    return <Navigate to={{ pathname: "/auth", hash }} replace />;
  }

  return <Navigate to="/mentorados" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Sonner />
          <TranscricaoProvider>
            <ViraisRealtimeProvider>
            <HeadlineVotacoesRealtimeProvider>
            <Routes>
              <Route path="/r/:token" element={<RoteiroPublico />} />
              <Route
                path="*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/" element={<RootRedirect />} />
                      <Route path="/dash-geral" element={<ProtectedRoute><DashGeral /></ProtectedRoute>} />
                      <Route path="/acompanhamento" element={<ProtectedRoute><Acompanhamento /></ProtectedRoute>} />
                      <Route path="/perfil" element={<Navigate to="/acompanhamento" replace />} />
                      <Route path="/mentorados" element={<ProtectedRoute><Mentorados /></ProtectedRoute>} />
                      <Route path="/core-manager" element={<ProtectedRoute><CoreStudioTasks /></ProtectedRoute>} />
                      <Route path="/headlines" element={<ProtectedRoute><Headlines /></ProtectedRoute>} />
                      <Route path="/testes" element={<ProtectedRoute><Testes /></ProtectedRoute>} />
                      <Route path="/testes/trinka" element={<ProtectedRoute><TrinkaGame /></ProtectedRoute>} />
                      <Route path="/testes/analise-roteiro" element={<ProtectedRoute><AnaliseRoteiroGame /></ProtectedRoute>} />
                      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                      <Route path="/treinamentos" element={<ProtectedRoute><Treinamentos /></ProtectedRoute>} />
                      <Route path="/modo-flow" element={<ProtectedRoute><Atividades /></ProtectedRoute>} />
                      <Route path="/calendario" element={<ProtectedRoute><Calendario /></ProtectedRoute>} />
                      <Route path="/ideias-melhorias" element={<ProtectedRoute><IdeasMelhorias /></ProtectedRoute>} />
                      <Route path="/usuarios" element={<ProtectedRoute><GerenciarUsuarios /></ProtectedRoute>} />
                      <Route path="/virais" element={<ProtectedRoute><Virais /></ProtectedRoute>} />
                      <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
            </HeadlineVotacoesRealtimeProvider>
            </ViraisRealtimeProvider>
          </TranscricaoProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
