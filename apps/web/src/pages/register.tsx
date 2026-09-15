import { FormEvent, useState } from "react";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { authApi } from "@/lib/auth-api";

type RegisterPageProps = { onSuccess?: () => void };

export default function RegisterPage({ onSuccess }: RegisterPageProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    authApi
      .register(
        [data.get("firstName"), data.get("lastName")]
          .map((value) => String(value).trim())
          .filter(Boolean)
          .join(" "),
        String(data.get("email")),
        String(data.get("password")),
      )
      .then(() => {
        setSubmitted(true);
        onSuccess?.();
      })
      .catch((requestError: Error) => {
        setSubmitted(false);
        setError(requestError.message);
      });
  };

  return (
    <main className="auth-page">
      <section className="auth-visual register-visual">
        <a href="/" className="auth-brand">
          <span>A</span> AMAL
        </a>
        <div className="auth-visual-copy">
          <span>AMAL / UNA MIRADA MAS LENTA</span>
          <h1>
            Haz espacio
            <br />
            <em>para lo esencial.</em>
          </h1>
          <p>
            Recibe acceso temprano a nuevas piezas, historias de makers y el
            cuidado que merece tu reloj.
          </p>
        </div>
        <small>PEQUENAS SERIES / MATERIALES HONESTOS</small>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-top">
          <a href="/" className="auth-mobile-brand">
            <span>A</span> AMAL
          </a>
          <span>
            <LockKeyhole size={13} /> Registro seguro
          </span>
        </div>
        <div className="auth-form-wrap">
          {submitted ? (
            <div className="auth-success">
              <div>
                <Check size={25} />
              </div>
              <span className="auth-kicker">CUENTA CREADA</span>
              <h2>
                Bienvenido
                <br />
                <em>a AMAL.</em>
              </h2>
              <p>
                Tu espacio personal esta listo. Ya puedes explorar la coleccion
                y guardar tus piezas favoritas.
              </p>
              <a className="auth-submit" href="/">
                Explorar la coleccion <ArrowRight size={16} />
              </a>
            </div>
          ) : (
            <>
              <span className="auth-kicker">TU ESPACIO PERSONAL</span>
              <h2>Crear una cuenta</h2>
              <p className="auth-lead">
                Una cuenta sencilla para guardar tus elecciones y seguir tus
                pedidos.
              </p>
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-two-fields">
                  <label>
                    Nombre
                    <input name="firstName" required />
                  </label>
                  <label>
                    Apellido
                    <input name="lastName" required />
                  </label>
                </div>
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
                    placeholder="Al menos 8 caracteres"
                    minLength={8}
                    required
                  />
                </label>
                <label className="auth-check">
                  <input type="checkbox" required />{" "}
                  <span>
                    Acepto las condiciones de uso y la politica de privacidad.
                  </span>
                </label>
                {error && <p className="auth-error">{error}</p>}
                <button className="auth-submit" type="submit">
                  Crear cuenta <ArrowRight size={16} />
                </button>
              </form>
              <p className="auth-switch">
                Ya tienes una cuenta? <a href="/login">Iniciar sesion</a>
              </p>
            </>
          )}
        </div>
        <small className="auth-legal">
          Tus datos se guardan de forma segura y solo se utilizan para gestionar
          tu cuenta AMAL.
        </small>
      </section>
    </main>
  );
}
