import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Cookie } from "lucide-react";

export function Footer({ onNotice }: { onNotice?: (msg: string) => void }) {
  const { t } = useTranslation();

  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new Event("open-cookie-settings"));
  };

  return (
    <footer className="site-footer">
      <a href="#top" className="wordmark" data-testid="link-footer-home">
        <span>A</span> AMAL
      </a>
      <p style={{ maxWidth: "460px", margin: "0.5rem 0 1.5rem", color: "var(--ink-soft, #767676)", fontSize: "0.9rem" }}>
        Objetos pensados para perdurar y medir el tiempo con serenidad.
      </p>

      <div className="footer-links" style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <a href="/#collection" data-testid="link-footer-collection">
          {t("nav.collection", "Colección")}
        </a>
        <a href="/#atelier" data-testid="link-footer-atelier">
          {t("nav.atelier", "Atelier")}
        </a>
        <Link href="/legal/terms">
          {t("footer.terms", "Términos de Venta")}
        </Link>
        <Link href="/legal/privacy">
          {t("footer.privacy", "Privacidad")}
        </Link>
        <Link href="/legal/cookies">
          {t("footer.cookies", "Cookies")}
        </Link>
        <Link href="/legal/notice">
          {t("footer.legalNotice", "Aviso Legal")}
        </Link>
        <button
          type="button"
          onClick={handleOpenCookieSettings}
          style={{
            background: "none",
            border: "none",
            color: "var(--ink-soft, #767676)",
            fontSize: "inherit",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: 0,
          }}
          data-testid="button-cookie-settings"
        >
          <Cookie size={13} />
          <span>Preferencias de Cookies</span>
        </button>
        <button
          type="button"
          onClick={() => onNotice?.("Atención al cliente: atelier@amalwatches.com")}
          data-testid="button-contact"
          style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}
        >
          {t("nav.contact", "Contacto")}
        </button>
      </div>

      <small style={{ color: "var(--ink-soft, #767676)", fontSize: "0.8rem" }}>
        © 2026 AMAL Watches S.L. Todos los derechos reservados. Ediciones numeradas.
      </small>
    </footer>
  );
}
