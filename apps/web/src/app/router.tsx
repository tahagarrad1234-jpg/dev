import { Route, Switch, useLocation } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import AdminLoginPage from "@/pages/admin-login";
import NotFound from "@/pages/not-found";
import { ReactNode } from "react";
import Home from "@/features/catalog/home"; // We'll move Home here
import ProtectedAdmin from "@/features/admin/protected-admin"; // We'll move this here

export function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

export function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin" component={ProtectedAdmin} />
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/login">{() => <LoginPage />}</Route>
        <Route path="/register">{() => <RegisterPage />}</Route>
        <Route>{() => <NotFound />}</Route>
      </Switch>
    </RoutedErrorBoundary>
  );
}
