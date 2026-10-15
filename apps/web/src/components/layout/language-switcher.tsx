import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || "es").substring(0, 2) as SupportedLanguage;

  const handleLanguageChange = (code: SupportedLanguage) => {
    i18n.changeLanguage(code);
  };

  return (
    <div
      className="language-switcher"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "11px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
      aria-label="Selector de idioma / Language selector"
    >
      <Globe size={13} style={{ opacity: 0.6, marginRight: "2px" }} aria-hidden="true" />
      {SUPPORTED_LANGUAGES.map((lang, idx) => {
        const isActive = currentLang === lang.code;
        return (
          <span key={lang.code} style={{ display: "inline-flex", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              aria-label={`Cambiar idioma a ${lang.label}`}
              aria-pressed={isActive}
              style={{
                background: "none",
                border: "none",
                padding: "2px 4px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "11px",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--ink, #121212)" : "var(--ink-soft, #767676)",
                textDecoration: isActive ? "underline" : "none",
                textUnderlineOffset: "3px",
                transition: "color 0.2s ease",
              }}
            >
              {lang.flag}
            </button>
            {idx < SUPPORTED_LANGUAGES.length - 1 && (
              <span style={{ opacity: 0.3, userSelect: "none" }}>/</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
