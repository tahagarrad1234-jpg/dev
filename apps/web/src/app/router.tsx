import { lazy, Suspense, type ReactNode } from "react";
import { Route, Switch, useLocation } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import Home from "@/features/catalog/home";
import ProductDetailPage from "@/pages/product-detail";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import NotFound from "@/pages/not-found";

// Code-split heavy routes with React.lazy
const ProtectedAdmin = lazy(() => import("@/features/admin/protected-admin"));
const AdminLoginPage = lazy(() => import("@/pages/admin-login"));
const CheckoutPage = lazy(() => import("@/pages/checkout"));
const CheckoutSuccessPage = lazy(() => import("@/pages/checkout-success"));
const FavoritesPage = lazy(() => import("@/pages/favorites"));
const AccountPage = lazy(() => import("@/pages/account"));
const LegalPage = lazy(() => import("@/pages/legal"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));

function RouteLoadingFallback() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        color: "var(--ink-soft, #767676)",
        fontFamily: "var(--font-sans, sans-serif)",
        fontSize: "0.9rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
      aria-busy="true"
      aria-label="Cargando..."
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "2px solid var(--line, rgba(0,0,0,0.1))",
            borderTopColor: "var(--oxblood, #8b263e)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span>AMAL</span>
      </div>
    </div>
  );
}

export function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

export function Router() {
  return (
    <RoutedErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/admin">
            {() => <ProtectedAdmin />}
          </Route>
          <Route path="/admin/login">
            {() => <AdminLoginPage />}
          </Route>
          <Route path="/login">{() => <LoginPage />}</Route>
          <Route path="/forgot-password">
            {() => <ForgotPasswordPage />}
          </Route>
          <Route path="/reset-password">
            {() => <ResetPasswordPage />}
          </Route>
          <Route path="/register">{() => <RegisterPage />}</Route>
          <Route path="/product/:slug" component={ProductDetailPage} />
          <Route path="/checkout/success">
            {() => <CheckoutSuccessPage />}
          </Route>
          <Route path="/checkout">
            {() => <CheckoutPage />}
          </Route>
          <Route path="/favorites">
            {() => <FavoritesPage />}
          </Route>
          <Route path="/account">
            {() => <AccountPage />}
          </Route>
          <Route path="/legal/:tab">
            {() => <LegalPage />}
          </Route>
          <Route path="/legal">
            {() => <LegalPage />}
          </Route>
          <Route>{() => <NotFound />}</Route>
        </Switch>
      </Suspense>
    </RoutedErrorBoundary>
  );
}
