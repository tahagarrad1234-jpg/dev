import { useState } from "react";
import { Save, Check } from "lucide-react";

export function AdminSettings() {
  const [storeName, setStoreName] = useState("AMAL Atelier");
  const [contactEmail, setContactEmail] = useState("atelier@amalwatches.com");
  const [currency, setCurrency] = useState("EUR");
  const [insuredShipping, setInsuredShipping] = useState(true);
  const [newsletterEnabled, setNewsletterEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <section className="admin-content">
      <div className="admin-page-intro">
        <div>
          <span className="admin-eyebrow">CONFIGURACIÓN</span>
          <h2>Ajustes de la Tienda</h2>
          <p>Controla la identidad, los envíos y las políticas comerciales de AMAL.</p>
        </div>
        <button className="admin-primary-btn" onClick={handleSave}>
          {saved ? <Check size={16} /> : <Save size={16} />}
          <span>{saved ? "Guardado" : "Guardar cambios"}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="admin-card settings-card" style={{ display: "grid", gap: "1.5rem", maxWidth: "680px" }}>
        <label style={{ display: "grid", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted, #888)" }}>
            Nombre Comercial del Atelier
          </span>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            style={{ padding: "0.75rem 1rem", background: "var(--color-surface, #161616)", border: "1px solid var(--color-border, #2a2a2a)", color: "#fff", borderRadius: "4px" }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted, #888)" }}>
            Email de Contacto y Notificaciones
          </span>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            style={{ padding: "0.75rem 1rem", background: "var(--color-surface, #161616)", border: "1px solid var(--color-border, #2a2a2a)", color: "#fff", borderRadius: "4px" }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted, #888)" }}>
            Moneda Base
          </span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{ padding: "0.75rem 1rem", background: "var(--color-surface, #161616)", border: "1px solid var(--color-border, #2a2a2a)", color: "#fff", borderRadius: "4px" }}
          >
            <option value="EUR">EUR (€) - Euro (Unión Europea)</option>
            <option value="USD">USD ($) - Dólar estadounidense</option>
            <option value="GBP">GBP (£) - Libra esterlina</option>
            <option value="CHF">CHF (Fr.) - Franco suizo</option>
          </select>
        </label>

        <label className="setting-toggle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderTop: "1px solid var(--color-border, #222)" }}>
          <div>
            <strong>Envío asegurado gratuito</strong>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-muted, #888)" }}>
              Mostrar badge de mensajería blindada en todas las piezas
            </p>
          </div>
          <input
            type="checkbox"
            checked={insuredShipping}
            onChange={(e) => setInsuredShipping(e.target.checked)}
          />
        </label>

        <label className="setting-toggle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderTop: "1px solid var(--color-border, #222)" }}>
          <div>
            <strong>Suscripción a Notas del Atelier</strong>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-muted, #888)" }}>
              Habilitar captación de leads en el footer con doble opt-in
            </p>
          </div>
          <input
            type="checkbox"
            checked={newsletterEnabled}
            onChange={(e) => setNewsletterEnabled(e.target.checked)}
          />
        </label>
      </form>
    </section>
  );
}
