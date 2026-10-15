import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Shield, FileText, Lock, Cookie } from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/features/catalog/components/cart-drawer";
import { useCart } from "@/features/cart/use-cart";

type LegalTab = "terms" | "privacy" | "cookies" | "notice";

export default function LegalPage() {
  const [, params] = useRoute("/legal/:tab");
  const tabFromUrl = (params?.tab as LegalTab) || "terms";
  const [activeTab, setActiveTab] = useState<LegalTab>(tabFromUrl);
  const { cartCount, setCartOpen } = useCart();

  const tabs = [
    { id: "terms" as LegalTab, label: "Condiciones de Venta", icon: FileText },
    { id: "privacy" as LegalTab, label: "Política de Privacidad", icon: Lock },
    { id: "cookies" as LegalTab, label: "Política de Cookies", icon: Cookie },
    { id: "notice" as LegalTab, label: "Aviso Legal (LSSI)", icon: Shield },
  ];

  return (
    <div className="site-wrapper">
      <Helmet>
        <title>
          {activeTab === "terms"
            ? "Condiciones Generales de Venta — AMAL Watches"
            : activeTab === "privacy"
              ? "Política de Privacidad y RGPD — AMAL Watches"
              : activeTab === "cookies"
                ? "Política de Cookies — AMAL Watches"
                : "Aviso Legal — AMAL Watches"}
        </title>
        <meta
          name="description"
          content="Información legal, condiciones de venta, garantía de 5 años y política de privacidad de AMAL Watches conforme a la normativa de la Unión Europea."
        />
        <link rel="canonical" href={`https://amalwatches.com/legal/${activeTab}`} />
      </Helmet>

      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <AnnouncementBar />
      <Header cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

      <main
        id="main-content"
        tabIndex={-1}
        style={{
          maxWidth: "1000px",
          margin: "2rem auto 6rem",
          padding: "0 1.5rem",
          minHeight: "70vh",
        }}
      >
        <Link
          href="/"
          className="back-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "2rem",
            color: "var(--ink-soft, #767676)",
            fontSize: "0.9rem",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          <span>Volver al Atelier</span>
        </Link>

        <header style={{ marginBottom: "2.5rem" }}>
          <span
            className="eyebrow"
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "0.8rem",
              color: "var(--oxblood, #8b263e)",
              fontWeight: 600,
            }}
          >
            DOCUMENTACIÓN LEGAL & CUMPLIMIENTO UE
          </span>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 300,
              margin: "0.5rem 0 1rem",
              letterSpacing: "-0.02em",
            }}
          >
            Garantías y Compromiso Legal
          </h1>
          <p
            style={{
              color: "var(--ink-soft, #666)",
              maxWidth: "680px",
              lineHeight: 1.6,
            }}
          >
            En AMAL Watches la transparencia es un valor fundamental de nuestra
            manufactura. Todos nuestros procesos se rigen por los más altos estándares
            europeos de protección al consumidor y privacidad de datos.
          </p>
        </header>

        {/* Tab Navigation */}
        <nav
          style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "1px solid var(--line, rgba(0,0,0,0.1))",
            paddingBottom: "1rem",
            marginBottom: "3rem",
            overflowX: "auto",
          }}
          aria-label="Apartados legales"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: isActive ? "var(--ink, #121212)" : "transparent",
                  color: isActive ? "var(--bone, #f6f3eb)" : "var(--ink-soft, #666)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Body */}
        <article
          style={{
            lineHeight: 1.7,
            color: "var(--ink, #222)",
            fontSize: "0.95rem",
            display: "grid",
            gap: "2rem",
          }}
        >
          {activeTab === "terms" && (
            <div className="legal-section">
              <h2 style={{ fontSize: "1.6rem", fontWeight: 400, marginBottom: "1rem" }}>
                Condiciones Generales de Venta
              </h2>
              <p>
                <strong>Última actualización: Octubre 2026</strong>
              </p>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                1. Identificación del Vendedor
              </h3>
              <p>
                AMAL Watches S.L., con domicilio social en Passeig de Gràcia 42, 08007
                Barcelona (España), provista de NIF B-08923412. Correo electrónico de
                contacto: <code>atelier@amalwatches.com</code>.
              </p>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                2. Precios y Moneda
              </h3>
              <p>
                Todos los precios están expresados en Euros (€) e incluyen el Impuesto sobre el
                Valor Añadido (IVA del 21% aplicable en España y conforme al régimen OSS en
                la Unión Europea). Para envíos con destino fuera del territorio aduanero de
                la UE, el IVA no será repercutido, pudiendo el comprador asumir aranceles
                aduaneros locales.
              </p>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                3. Derecho Legal de Desistimiento (14 días naturales)
              </h3>
              <p>
                De conformidad con la normativa europea de defensa de consumidores (Directiva
                2011/83/UE y Real Decreto Legislativo 1/2007), el cliente dispone de un plazo
                de <strong>14 días naturales</strong> desde la recepción de la pieza para
                ejercer su derecho de desistimiento sin necesidad de justificación. La pieza
                debe ser devuelta en perfecto estado, sin signos de uso, en su estuche
                original y con toda la documentación y certificados de numeración intactos.
              </p>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                4. Garantía Internacional de 5 Años
              </h3>
              <p>
                Cada guardatiempo AMAL cuenta con una garantía del Atelier de{" "}
                <strong>5 años</strong> a partir de la fecha de entrega, cubriendo cualquier
                defecto de fabricación del calibre y hermeticidad garantizada. Quedan excluidos
                los daños producidos por accidentes, uso indebido o aperturas no autorizadas
                por relojeros ajenos a nuestra red de servicio técnico.
              </p>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                5. Pasarela de Pago Segura
              </h3>
              <p>
                Los pagos se tramitan exclusivamente a través de la infraestructura bancaria
                certificada PCI-DSS Nivel 1 de <strong>Stripe</strong>. AMAL Watches nunca
                recibe ni almacena los datos de tarjeta o credenciales bancarias del comprador.
              </p>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="legal-section">
              <h2 style={{ fontSize: "1.6rem", fontWeight: 400, marginBottom: "1rem" }}>
                Política de Privacidad y Protección de Datos (RGPD)
              </h2>
              <p>
                AMAL Watches S.L. cumple con el Reglamento General de Protección de Datos
                (RGPD UE 2016/679) y la Ley Orgánica 3/2018 (LOPDGDD).
              </p>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                1. Responsable del Tratamiento
              </h3>
              <p>
                AMAL Watches S.L. (Passeig de Gràcia 42, 08007 Barcelona). Delegado de
                Protección de Datos: <code>dpo@amalwatches.com</code>.
              </p>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                2. Finalidad y Legitimación
              </h3>
              <ul style={{ paddingLeft: "1.5rem", listStyleType: "disc" }}>
                <li>
                  <strong>Gestión de pedidos y entregas:</strong> Base legal: Ejecución de
                  contrato de compraventa (Art. 6.1.b RGPD).
                </li>
                <li>
                  <strong>Atención al cliente y garantía:</strong> Base legal: Cumplimiento de
                  obligación legal y contractual (Art. 6.1.c RGPD).
                </li>
                <li>
                  <strong>Boletín del Atelier:</strong> Base legal: Consentimiento explícito
                  (Art. 6.1.a RGPD).
                </li>
              </ul>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                3. Derechos del Interesado (ARCO-POL)
              </h3>
              <p>
                Puede ejercer en cualquier momento sus derechos de acceso, rectificación,
                supresión ("derecho al olvido"), limitación del tratamiento, portabilidad y
                oposición enviando un correo a <code>dpo@amalwatches.com</code> o directamente
                desde su panel de cuenta en <strong>Mi Cuenta &gt; Gestión de Datos</strong>.
              </p>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                4. Conservación de Datos
              </h3>
              <p>
                Los datos contables y fiscales asociados a facturación se conservarán durante
                los plazos legales exigidos por la legislación mercantil y tributaria española
                (mínimo 5 años). Los datos de cuentas suprimidas se anonimizan de forma
                irreversible.
              </p>
            </div>
          )}

          {activeTab === "cookies" && (
            <div className="legal-section">
              <h2 style={{ fontSize: "1.6rem", fontWeight: 400, marginBottom: "1rem" }}>
                Política de Cookies y Preferencias
              </h2>
              <p>
                Este sitio web utiliza cookies técnicas necesarias para el funcionamiento del
                carrito de compra, la sesión de cliente y la seguridad bancaria.
              </p>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                Tipología de Cookies Empleadas
              </h3>
              <div
                style={{
                  display: "grid",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <div
                  style={{
                    padding: "1rem",
                    background: "var(--parchment-soft, #f7f6f2)",
                    borderRadius: "6px",
                  }}
                >
                  <strong>1. Cookies Técnicas y Estrictamente Necesarias</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#666" }}>
                    Imprescindibles para mantener el carrito, procesar el pago en Stripe y
                    recordar la sesión segura. No requieren consentimiento según el Art. 22.2 LSSI.
                  </p>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    background: "var(--parchment-soft, #f7f6f2)",
                    borderRadius: "6px",
                  }}
                >
                  <strong>2. Cookies de Preferencias e Idioma</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#666" }}>
                    Guardan su selección de idioma (ES/EN/FR) y moneda preferida.
                  </p>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    background: "var(--parchment-soft, #f7f6f2)",
                    borderRadius: "6px",
                  }}
                >
                  <strong>3. Cookies Analíticas (Opcionales)</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#666" }}>
                    Permiten medir el rendimiento y fluidez del sitio de forma anonimizada sin
                    rastreo entre dominios. Solo se activan si usted otorga su consentimiento expreso.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    window.dispatchEvent(new Event("open-cookie-settings"));
                  }}
                >
                  Configurar Preferencias de Cookies
                </button>
              </div>
            </div>
          )}

          {activeTab === "notice" && (
            <div className="legal-section">
              <h2 style={{ fontSize: "1.6rem", fontWeight: 400, marginBottom: "1rem" }}>
                Aviso Legal (Ley de Servicios de la Sociedad de la Información)
              </h2>
              <p>
                En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios
                de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE):
              </p>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                1. Datos Identificativos
              </h3>
              <p>
                <strong>Denominación Social:</strong> AMAL Watches S.L.
                <br />
                <strong>NIF:</strong> B-08923412
                <br />
                <strong>Domicilio Social:</strong> Passeig de Gràcia 42, 08007 Barcelona, España
                <br />
                <strong>Registro Mercantil:</strong> Inscrita en el Registro Mercantil de
                Barcelona, Tomo 48210, Folio 15, Hoja B-592100.
                <br />
                <strong>Contacto:</strong> <code>atelier@amalwatches.com</code>
              </p>

              <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>
                2. Propiedad Intelectual e Industrial
              </h3>
              <p>
                Todos los contenidos del portal (textos, fotografías, gráficos, imágenes, iconos,
                tecnología, software, así como su diseño gráfico y códigos fuente) constituyen
                una obra cuya propiedad pertenece a AMAL Watches S.L., sin que puedan
                entenderse cedidos al usuario ninguno de los derechos de explotación sobre los
                mismos más allá de lo estrictamente necesario para el correcto uso de la web.
              </p>
            </div>
          )}
        </article>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
