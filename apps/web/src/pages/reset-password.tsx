import { FormEvent, useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("token");
    if (queryToken) {
      setToken(queryToken);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Token de recuperación no encontrado o inválido.");
      return;
    }

    if (password.length < 10) {
      setError("La contraseña debe tener al menos 10 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar la contraseña.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Error al actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <a href="/" className="auth-brand">
          <span>A</span> AMAL
        </a>
        <div className="auth-visual-copy">
          <span>AMAL / SEGURIDAD DEL ATELIER</span>
          <h1>
            Nueva clave,
            <br />
            <em>misma excelencia.</em>
          </h1>
          <p>
            Establece una contraseña robusta para proteger tu historial y pedidos.
          </p>
        </div>
        <small>EST. 1987 / GENEVA - TOKYO</small>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-top">
          <a href="/" className="auth-mobile-brand">
            <span>A</span> AMAL
          </a>
          <span>
            <LockKeyhole size={13} /> Cifrado de extremo a extremo
          </span>
        </div>

        <div className="auth-form-wrap">
          <span className="auth-kicker">SEGURIDAD DE LA CUENTA</span>
          <h2>Restablecer contraseña</h2>
          <p className="auth-lead">
            Introduce tu nueva contraseña de al menos 10 caracteres.
          </p>

          {!token && !success && (
            <div
              style={{
                background: "rgba(217, 48, 37, 0.08)",
                border: "1px solid #d93025",
                borderRadius: "8px",
                padding: "20px",
                marginTop: "16px",
                color: "#d93025",
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              <strong>Falta el enlace de autorización</strong>
              <p style={{ margin: "8px 0 16px" }}>
                No se ha detectado ningún código de recuperación válido. Por favor, solicita un nuevo enlace.
              </p>
              <Link
                href="/forgot-password"
                style={{
                  display: "inline-block",
                  padding: "10px 16px",
                  background: "#121212",
                  color: "#ffffff",
                  borderRadius: "4px",
                  fontSize: "12px",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          )}

          {success ? (
            <div
              style={{
                background: "rgba(230, 244, 234, 0.7)",
                border: "1px solid #137333",
                borderRadius: "8px",
                padding: "24px 20px",
                marginTop: "16px",
                color: "#137333",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <CheckCircle2 size={20} />
                <strong style={{ fontSize: "15px" }}>Contraseña actualizada</strong>
              </div>
              <p style={{ fontSize: "13px", lineHeight: "1.6", margin: "0 0 16px" }}>
                Tu clave ha sido renovada con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.
              </p>
              <Link
                href="/login"
                style={{
                  display: "inline-block",
                  padding: "10px 18px",
                  background: "#121212",
                  color: "#ffffff",
                  borderRadius: "4px",
                  fontSize: "13px",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Iniciar Sesión
              </Link>
            </div>
          ) : token ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Nueva contraseña
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 10 caracteres"
                    required
                    minLength={10}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#888",
                      padding: 0,
                    }}
                    title={showPassword ? "Ocultar" : "Mostrar"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label>
                Confirmar nueva contraseña
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  required
                  minLength={10}
                  disabled={loading}
                />
              </label>

              {error && <p className="auth-error">{error}</p>}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? "Actualizando..." : "Actualizar contraseña"}{" "}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : null}

          <p className="auth-switch" style={{ marginTop: "24px" }}>
            Deseas cancelar? <a href="/login">Volver al inicio de sesión</a>
          </p>
        </div>

        <small className="auth-legal">
          Al continuar, aceptas las condiciones de uso y la política de
          privacidad de AMAL.
        </small>
      </section>
    </main>
  );
}
