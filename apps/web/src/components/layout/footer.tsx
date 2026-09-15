export function Footer({ onNotice }: { onNotice?: (msg: string) => void }) {
  return (
    <footer>
      <a href="#top" className="wordmark">
        <span>A</span> AMAL
      </a>
      <p>Objetos pensados para perdurar y medir el tiempo con serenidad.</p>
      <div className="footer-links">
        <a href="#collection">Coleccion</a>
        <a href="#atelier">Atelier</a>
        <button
          type="button"
          onClick={() => onNotice?.("Atencion al cliente: atelier@amalwatches.com")}
        >
          Contacto
        </button>
      </div>
      <small>© 2026 AMAL Watches. Todos los derechos reservados.</small>
    </footer>
  );
}
