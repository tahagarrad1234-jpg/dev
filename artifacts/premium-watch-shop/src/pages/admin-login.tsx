import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/auth-api";

export default function AdminLoginPage() {
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    authApi
      .adminLogin(String(data.get("email")), String(data.get("password")))
      .then(() => {
        window.location.href = "/admin";
      })
      .catch((requestError: Error) => setError(requestError.message));
  };

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <a href="/" className="auth-brand">
          <span>A</span> AMAL <small>ADMIN</small>
        </a>
        <div className="admin-auth-icon">
          <ShieldCheck size={24} />
        </div>
        <span className="auth-kicker">ESPACIO PRIVADO</span>
        <h1>
          Acceso de
          <br />
          <em>administrador.</em>
        </h1>
        <p>Gestiona pedidos, catalogo y clientes desde tu espacio AMAL.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Correo de administrador
            <input
              type="email"
              name="email"
              placeholder="admin@amal.local"
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
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-submit" type="submit">
            Entrar al panel <ArrowRight size={16} />
          </button>
        </form>
        <small className="admin-auth-hint">
          <LockKeyhole size={13} /> Sesion protegida con cookie segura
        </small>
        <a className="admin-auth-back" href="/">
          Volver a la tienda
        </a>
      </section>
    </main>
  );
}
