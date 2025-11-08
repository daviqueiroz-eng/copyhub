import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "./components/Layout";
import Mural from "./pages/Mural";
import Mentorados from "./pages/Mentorados";
import Prompts from "./pages/Prompts";
import Headlines from "./pages/Headlines";
import Intensificadores from "./pages/Intensificadores";
import Testes from "./pages/Testes";
import TrinkaGame from "./pages/TrinkaGame";
import AnaliseRoteiroGame from "./pages/AnaliseRoteiroGame";
import Admin from "./pages/Admin";
import Treinamentos from "./pages/Treinamentos";
import Calendario from "./pages/Calendario";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Mural />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/mentorados" element={<Mentorados />} />
              <Route path="/prompts" element={<Prompts />} />
              <Route path="/headlines" element={<Headlines />} />
              <Route path="/intensificadores" element={<Intensificadores />} />
              <Route path="/testes" element={<Testes />} />
              <Route path="/testes/trinka" element={<TrinkaGame />} />
              <Route path="/testes/analise-roteiro" element={<AnaliseRoteiroGame />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/treinamentos" element={<Treinamentos />} />
              <Route path="/calendario" element={<Calendario />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
