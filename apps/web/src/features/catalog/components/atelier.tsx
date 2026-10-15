import { Watch, ShieldCheck, Wrench } from "lucide-react";

export function Atelier() {
  return (
    <section className="atelier-section" id="atelier">
      <div className="atelier-grid">
        <div className="atelier-media">
          <img
            src="https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Mesa de relojero en el Atelier AMAL"
            className="atelier-image"
          />
        </div>

        <div className="atelier-content">
          <span className="section-eyebrow">EL ATELIER DE BARCELONA</span>
          <h2 className="section-title">
            El arte pausado de la relojería independiente.
          </h2>

          <p>
            Cada reloj AMAL se ensambla en pequeñas series numeradas. Cada espiral,
            puente y rueda de escape pasa por las manos de nuestros maestros
            relojeros antes de iniciar el periodo de prueba de 240 horas.
          </p>

          <div className="atelier-badges">
            <div className="atelier-badge-item">
              <Watch size={20} />
              <div>
                <strong>Ajuste en 5 posiciones</strong>
                <p>Precisión cronométrica garantizada (-4/+6 seg/día).</p>
              </div>
            </div>

            <div className="atelier-badge-item">
              <ShieldCheck size={20} />
              <div>
                <strong>Garantía de 5 años</strong>
                <p>Cobertura integral en cualquier parte del mundo.</p>
              </div>
            </div>

            <div className="atelier-badge-item">
              <Wrench size={20} />
              <div>
                <strong>Servicio técnico de por vida</strong>
                <p>Mantenimiento y piezas originales garantizadas siempre.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
