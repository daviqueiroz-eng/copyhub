import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Mural from "./pages/Mural";
import Mentorados from "./pages/Mentorados";
import Prompts from "./pages/Prompts";
import Headlines from "./pages/Headlines";
import Intensificadores from "./pages/Intensificadores";
import Testes from "./pages/Testes";
import Treinamentos from "./pages/Treinamentos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Mural />} />
            <Route path="/mentorados" element={<Mentorados />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/headlines" element={<Headlines />} />
            <Route path="/intensificadores" element={<Intensificadores />} />
            <Route path="/testes" element={<Testes />} />
            <Route path="/treinamentos" element={<Treinamentos />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
