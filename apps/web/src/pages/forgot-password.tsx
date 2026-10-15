import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail } from "lucide-react";
import { Link } from "wouter";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo procesar la solicitud.");
      }

      setSuccess(true);
      if (data.resetLink) {
        setDevResetLink(data.resetLink);
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
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
            Recupera
            <br />
            <em>el control.</em>
          </h1>
          <p>
            Te enviaremos un enlace confidencial y encriptado para restablecer
            tu acceso al atelier.
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
            <LockKeyhole size={13} /> Seguridad cifrada
          </span>
        </div>

        <div className="auth-form-wrap">
          <span className="auth-kicker">RECUPERACIÓN DE CUENTA</span>
          <h2>Has olvidado tu contraseña?</h2>
          <p className="auth-lead">
            Introduce el correo electrónico asociado a tu cuenta y te
            enviaremos las instrucciones de recuperación.
          </p>

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
                <strong style={{ fontSize: "15px" }}>Instrucciones enviadas</strong>
              </div>
              <p style={{ fontSize: "13px", lineHeight: "1.6", margin: "0 0 16px" }}>
                Si existe una cuenta asociada a <strong>{email}</strong>, hemos
                enviado un enlace de restablecimiento válido durante 60 minutos.
              </p>

              {devResetLink && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px dashed #137333",
                    padding: "12px",
                    borderRadius: "6px",
                    marginBottom: "16px",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Modo Desarrollo / Vista Previa:
                  </span>
                  <a
                    href={devResetLink}
                    style={{ color: "#8b263e", wordBreak: "break-all", textDecoration: "underline" }}
                  >
                    Abrir enlace de restablecimiento
                  </a>
                </div>
              )}

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
                Volver a Iniciar Sesión
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Correo electrónico
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@ejemplo.com"
                    required
                    disabled={loading}
                  />
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#999",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </label>

              {error && <p className="auth-error">{error}</p>}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}{" "}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          <p className="auth-switch" style={{ marginTop: "24px" }}>
            Te has acordado de tu clave? <a href="/login">Volver a iniciar sesión</a>
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
