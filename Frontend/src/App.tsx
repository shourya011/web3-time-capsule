import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './config/wagmi';
import WrongNetworkBanner from './components/WrongNetworkBanner';
import { WalletConnectionMonitor } from './components/WalletConnectionMonitor';
import { Footer } from './components/Footer';
import Home from "./pages/Home";
import CreateCapsule from "./pages/CreateCapsule";
import Dashboard from "./pages/Dashboard";
import Social from "./pages/Social";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import CapsuleDetail from "./pages/CapsuleDetail";
import HowItWorks from "./pages/HowItWorks";
import IPFSDemo from "./pages/IPFSDemo";
import Reveal from "./pages/Reveal";

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <TooltipProvider>
          <WalletConnectionMonitor />
          <Toaster />
          <Sonner />
          <WrongNetworkBanner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateCapsule />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/social" element={<Social />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/capsule/:id" element={<CapsuleDetail />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/reveal" element={<Reveal />} />
              <Route path="/ipfs-demo" element={<IPFSDemo />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
