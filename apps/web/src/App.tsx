import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./context/ThemeProvider";
import { router } from "./routes/router";

function App() {
  return (
    <ThemeProvider>
      <Toaster richColors position="top-center" />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
