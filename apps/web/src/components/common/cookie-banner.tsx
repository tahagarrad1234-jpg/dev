import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Cookie, Check, Shield, Settings2 } from "lucide-react";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = "amal_cookie_consent";

export function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [preferences, setPreferences] = useState<{ analytics: boolean; marketing: boolean }>({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setIsOpen(true);
    }

    const handleOpenSettings = () => {
      setIsCustomizing(true);
      setIsOpen(true);
    };

    window.addEventListener("open-cookie-settings", handleOpenSettings);
    return () => {
      window.removeEventListener("open-cookie-settings", handleOpenSettings);
    };
  }, []);

  const savePreferences = (prefs: { analytics: boolean; marketing: boolean }) => {
    const fullPreferences: CookiePreferences = {
      necessary: true,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullPreferences));
    setIsOpen(false);
    setIsCustomizing(false);
  };

  const handleAcceptAll = () => {
    savePreferences({ analytics: true, marketing: true });
  };

  const handleRejectNonEssential = () => {
    savePreferences({ analytics: false, marketing: false });
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Configuración de Cookies y Privacidad"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        background: "rgba(18, 18, 18, 0.96)",
        backdropFilter: "blur(16px)",
        color: "#f6f3eb",
        borderTop: "1px solid rgba(255, 255, 255, 0.12)",
        padding: "1.5rem 2rem",
        boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <Cookie size={24} color="var(--oxblood, #ff8da1)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 500, margin: "0 0 0.4rem" }}>
              Privacidad y Preferencias de Cookies
            </h3>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(246, 243, 235, 0.75)", lineHeight: 1.5 }}>
              En AMAL Watches utilizamos cookies técnicas indispensables para el funcionamiento
              seguro del carrito y pagos con Stripe. Opcionalmente, puede autorizar el uso de
              cookies analíticas que nos permiten calibrar la fluidez y rendimiento de la boutique.
              Consulte nuestra{" "}
              <Link href="/legal/cookies" style={{ color: "#fff", textDecoration: "underline" }}>
                Política de Cookies
              </Link>{" "}
              y{" "}
              <Link href="/legal/privacy" style={{ color: "#fff", textDecoration: "underline" }}>
                Política de Privacidad
              </Link>.
            </p>
          </div>
        </div>

        {isCustomizing && (
          <div
            style={{
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: "8px",
              display: "grid",
              gap: "0.8rem",
              fontSize: "0.85rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Técnicas y Seguridad (Siempre activas)</strong>
                <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.6)", fontSize: "0.78rem" }}>
                  Mantenimiento del carrito, sesión del cliente y prevención de fraude en pagos.
                </p>
              </div>
              <input type="checkbox" checked disabled style={{ cursor: "not-allowed" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Analíticas y Rendimiento</strong>
                <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.6)", fontSize: "0.78rem" }}>
                  Métricas anónimas para optimizar la velocidad de carga de las piezas.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                style={{ cursor: "pointer", width: "16px", height: "16px" }}
              />
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          {!isCustomizing ? (
            <>
              <button
                type="button"
                onClick={() => setIsCustomizing(true)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#f6f3eb",
                  padding: "0.55rem 1rem",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Settings2 size={14} />
                <span>Personalizar</span>
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#f6f3eb",
                  padding: "0.55rem 1rem",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Solo Necesarias
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                style={{
                  background: "var(--bone, #f6f3eb)",
                  border: "none",
                  color: "var(--ink, #121212)",
                  fontWeight: 600,
                  padding: "0.55rem 1.25rem",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Aceptar Todas
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsCustomizing(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.7)",
                  padding: "0.55rem 1rem",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                style={{
                  background: "var(--bone, #f6f3eb)",
                  border: "none",
                  color: "var(--ink, #121212)",
                  fontWeight: 600,
                  padding: "0.55rem 1.25rem",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Guardar Selección
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
