export function Manifesto() {
  return (
    <section className="manifesto" id="manifesto">
      <div className="manifesto-inner">
        <span className="section-eyebrow">EL MANIFIESTO</span>

        <blockquote className="manifesto-quote">
          “El verdadero lujo no compite por llamar la atención; descansa en la
          certeza de los materiales nobles y la maestría artesanal.”
        </blockquote>

        <div className="manifesto-grid">
          <div className="manifesto-item">
            <span className="manifesto-num">01</span>
            <h4>Proporción consciente</h4>
            <p>
              Cajas de 34 a 40 mm perfiladas al milímetro para fundirse con la
              muñeca. Ergonomía pura sin estridencias.
            </p>
          </div>

          <div className="manifesto-item">
            <span className="manifesto-num">02</span>
            <h4>Mecánica honesta</h4>
            <p>
              Calibres regulados a mano en cinco posiciones. Componentes
              reparables diseñados para sobrevivir generaciones.
            </p>
          </div>

          <div className="manifesto-item">
            <span className="manifesto-num">03</span>
            <h4>Transparencia total</h4>
            <p>
              Desde nuestro taller directamente a su muñeca. Sin costes de
              marketing inflados ni intermediarios prescindibles.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
