import { RouterProvider } from "react-router-dom";
import { Toaster } from "@/shared/components/ui/sonner";
import { ThemeProvider } from "./context/ThemeProvider";
import { router } from "./routes/router";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { GlobalCursor } from "@/shared/components/ui/GlobalCursor";

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <GlobalCursor />
        <Toaster position="bottom-right" />
        <RouterProvider router={router} />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
