export default function CreditosPage() {
  return (
    <>
      <style suppressHydrationWarning>{`
        body { background: #07070f; color: #e8e8ff; font-family: Georgia, serif; min-height: 100dvh; }
        .cr-header {
          padding: 24px 16px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #1e1e3a;
          margin-bottom: 24px;
        }
        .cr-back { font-size: 20px; text-decoration: none; color: #6060a0; }
        .cr-title { font-size: 18px; font-weight: 700; }
        .cr-body { padding: 0 16px 40px; max-width: 600px; display: flex; flex-direction: column; gap: 20px; }
        .cr-section-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6060a0;
          margin-bottom: 8px;
        }
        .cr-text { font-size: 14px; color: #8080b0; line-height: 1.7; }
        .cr-text a { color: #4a6fa5; text-decoration: none; }
        .cr-text a:hover { text-decoration: underline; }
        .cr-card {
          background: #0d0d1a;
          border: 1.5px solid #1e1e3a;
          border-radius: 12px;
          padding: 16px;
        }
      `}</style>

      <div className="cr-header">
        <a href="/" className="cr-back">←</a>
        <h1 className="cr-title">Créditos</h1>
      </div>

      <div className="cr-body">
        <div className="cr-card">
          <div className="cr-section-title">Imágenes de escudos</div>
          <p className="cr-text">
            Los escudos y banderas de los municipios proceden de{' '}
            <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">
              Wikimedia Commons
            </a>{' '}
            y están disponibles bajo sus respectivas licencias Creative Commons o de dominio público.
            Cada imagen puede estar sujeta a condiciones específicas — consulta la página de cada
            archivo en Wikimedia Commons para más detalles.
          </p>
        </div>

        <div className="cr-card">
          <div className="cr-section-title">Datos de municipios</div>
          <p className="cr-text">
            Datos oficiales del{' '}
            <a href="https://www.ine.es" target="_blank" rel="noopener noreferrer">
              Instituto Nacional de Estadística (INE)
            </a>{' '}
            y del{' '}
            <a href="https://www.ign.es" target="_blank" rel="noopener noreferrer">
              Instituto Geográfico Nacional (IGN)
            </a>.
            Información de Wikipedia a través de{' '}
            <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer">
              Wikidata
            </a>.
          </p>
        </div>

        <div className="cr-card">
          <div className="cr-section-title">Proyecto</div>
          <p className="cr-text">
            Creado con ❤️ para descubrir todos los rincones de España.
            Si encuentras algún error o quieres colaborar, contactame a través de bizum 😁.
          </p>
        </div>
      </div>
    </>
  );
}
