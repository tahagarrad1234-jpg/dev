import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { authApi } from "@/lib/auth-api";

type LoginPageProps = { onSuccess?: () => void };

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    authApi
      .login(String(data.get("email")), String(data.get("password")))
      .then(() => {
        if (onSuccess) onSuccess();
        else window.location.href = "/";
      })
      .catch((requestError: Error) => setError(requestError.message));
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <a href="/" className="auth-brand">
          <span>A</span> AMAL
        </a>
        <div className="auth-visual-copy">
          <span>AMAL / OBJETOS CON HISTORIA</span>
          <h1>
            El tiempo,
            <br />
            <em>a tu manera.</em>
          </h1>
          <p>Accede a tus pedidos, favoritos y notas privadas del atelier.</p>
        </div>
        <small>EST. 1987 / GENEVA - TOKYO</small>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-top">
          <a href="/" className="auth-mobile-brand">
            <span>A</span> AMAL
          </a>
          <span>
            <LockKeyhole size={13} /> Acceso seguro
          </span>
        </div>
        <div className="auth-form-wrap">
          <span className="auth-kicker">BIENVENIDO DE NUEVO</span>
          <h2>Iniciar sesion</h2>
          <p className="auth-lead">
            Entra para continuar con tu experiencia AMAL.
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Correo electronico
              <input
                type="email"
                name="email"
                placeholder="tu@ejemplo.com"
                required
              />
            </label>
            <label>
              Contrasena
              <input
                type="password"
                name="password"
                placeholder="Tu contrasena"
                required
              />
            </label>
            <div className="auth-form-row">
              <label className="auth-check">
                <input type="checkbox" /> <span>Recordarme</span>
              </label>
              <a href="mailto:info@amalwatches.com">
                Has olvidado tu contrasena?
              </a>
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" type="submit">
              Iniciar sesion <ArrowRight size={16} />
            </button>
          </form>
          <p className="auth-switch">
            Aun no tienes una cuenta? <a href="/register">Crear cuenta</a>
          </p>
        </div>
        <small className="auth-legal">
          Al continuar, aceptas las condiciones de uso y la politica de
          privacidad de AMAL.
        </small>
      </section>
    </main>
  );
}
