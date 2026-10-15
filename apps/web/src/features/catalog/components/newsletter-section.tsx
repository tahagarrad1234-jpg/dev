import { useState } from "react";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";

export function NewsletterSection({ onNotice }: { onNotice?: (msg: string) => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Por favor, introduce un correo electrónico válido");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "No se pudo completar la suscripción");
      }

      setStatus("success");
      setEmail("");
      onNotice?.("¡Bienvenido al Diario de AMAL!");
    } catch (err) {
      setStatus("idle");
      setErrorMsg((err as Error).message || "Error al suscribirse");
    }
  };

  return (
    <section className="closing-note" id="notes">
      <div className="closing-quote">
        "El placer reside
        <br />
        <em>en la elección serena."</em>
      </div>

      <div className="closing-details">
        <span>DIARIO AMAL / 01</span>
        <p>
          Una breve nota mensual sobre relojería independiente, artesanos y los
          rituales del tiempo. Sin estridencias ni promociones vacías.
        </p>

        {status === "success" ? (
          <div className="newsletter-success" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-fg, #fff)", padding: "0.75rem 0" }}>
            <Check size={18} color="var(--oxblood, #8b263e)" />
            <span>Ya estás suscrito. Gracias por acompañarnos.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="newsletter-form" style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", maxWidth: "420px" }}>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
                aria-label="Correo para el boletín"
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  background: "var(--color-surface, rgba(255,255,255,0.04))",
                  border: "1px solid var(--color-border, rgba(255,255,255,0.15))",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "0.9rem",
                }}
              />
              <button
                type="submit"
                className="closing-cta"
                disabled={status === "loading"}
                data-testid="button-join-notes"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                {status === "loading" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <span>Suscribirme</span>
                    <ArrowUpRight size={15} />
                  </>
                )}
              </button>
            </div>
            {errorMsg && (
              <p style={{ color: "var(--oxblood, #ff6b6b)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                {errorMsg}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
