import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Lobby from "@/pages/Lobby";
import Game from "@/pages/Game";
import Recap from "@/pages/Recap";
import { GameProvider } from "./lib/gameContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Lobby} />
      <Route path="/game/:roomId" component={Game} />
      <Route path="/recap/:roomId" component={Recap} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <TooltipProvider>
          <Toaster />
          <div className="watercolor-overlay fixed inset-0 pointer-events-none"></div>
          <Router />
        </TooltipProvider>
      </GameProvider>
    </QueryClientProvider>
  );
}

export default App;
