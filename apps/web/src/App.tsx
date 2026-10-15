import { Providers } from "@/app/providers";
import { Router } from "@/app/router";
import { CookieBanner } from "@/components/common/cookie-banner";
import "@/index.css";

function App() {
  return (
    <Providers>
      <Router />
      <CookieBanner />
    </Providers>
  );
}

export default App;
