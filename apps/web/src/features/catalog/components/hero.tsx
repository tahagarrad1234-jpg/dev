import { ArrowUpRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-eyebrow">
          <Sparkles size={13} />
          RELOJERÍA DE AUTOR — EDICIÓN LIMITADA
        </span>

        <h1 className="hero-title">
          Mide el tiempo <em>con serenidad</em>.
        </h1>

        <p className="hero-subtitle">
          Relojes de vocación atemporal diseñados en Barcelona. Calibres mecánicos
          regulados a mano, acero quirúrgico cepillado y proporciones que susurran
          en lugar de gritar.
        </p>

        <div className="hero-actions">
          <a href="#collection" className="button button-primary" data-testid="link-explore-collection">
            <span>Explorar colección</span>
            <ArrowUpRight size={15} />
          </a>
          <a href="#atelier" className="button button-ghost" data-testid="link-atelier-hero">
            <span>Conocer el Atelier</span>
          </a>
        </div>

        <div className="hero-features">
          <div className="feature-item">
            <strong>5 años</strong>
            <span>Garantía en Atelier</span>
          </div>
          <div className="feature-item">
            <strong>Zafiro</strong>
            <span>Doble antirreflejo</span>
          </div>
          <div className="feature-item">
            <strong>5 ATM / 20 ATM</strong>
            <span>Hermetismo certificado</span>
          </div>
        </div>
      </div>

      <div className="hero-media">
        <div className="hero-card" data-tone="bone">
          <div className="hero-card-tag">PIEZA DESTACADA</div>
          <img
            src="https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="The Meridian — Calibre Automático"
            className="hero-watch-image"
          />
          <div className="hero-card-meta">
            <h3>The Meridian</h3>
            <span>No. 01 / Calibre Automático</span>
          </div>
        </div>
      </div>
    </section>
  );
}
