import { Providers } from "@/app/providers";
import { Router } from "@/app/router";
import "@/index.css";

function App() {
  return (
    <Providers>
      <Router />
    </Providers>
  );
}

export default App;
