'use client';

import { useRef, useState } from 'react';
import { MunicipioCard, MunicipioCardData } from '@/components/MunicipioCard';

interface Props {
  municipio: MunicipioCardData;
}

export function CardExportWrapper({ municipio }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
      });
      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), 'image/png'),
      );
      const file = new File([blob], `${municipio.nombre}.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: municipio.nombre,
          text: `Mi carta de ${municipio.nombre} en MunicipioCollector`,
          url: window.location.href,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${municipio.nombre}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <style suppressHydrationWarning>{`
        body { background: #07070f; color: #e8e8ff; font-family: Georgia, serif; min-height: 100dvh; }
        .carta-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 16px 48px;
          gap: 24px;
        }
        .carta-back {
          align-self: flex-start;
          color: #6060a0;
          font-size: 13px;
          text-decoration: none;
        }
        .carta-back:hover { color: #e8e8ff; }
        .carta-subtitle {
          font-size: 12px;
          color: #3a3a6a;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-align: center;
        }
        /*
         * This wrapper is the single source of truth for card size on this page.
         * The card itself is fluid (width:100%) and fills this exactly.
         */
        .carta-card-wrap {
          width: 280px;
        }
        .carta-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 320px;
        }
        .carta-export-btn {
          width: 100%;
          padding: 14px 24px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #e94560 0%, #c4152e 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.2s;
        }
        .carta-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .carta-wiki-link {
          font-size: 13px;
          color: #4a6fa5;
          text-decoration: none;
        }
        .carta-wiki-link:hover { color: #7ab4e8; text-decoration: underline; }
      `}</style>

      <div className="carta-page">
        <a href="/" className="carta-back">← Inicio</a>
        <p className="carta-subtitle">Carta de municipio</p>

        {/* Wrapper controls size; card fills it via width:100% */}
        <div className="carta-card-wrap">
          <MunicipioCard
            ref={cardRef}
            municipio={municipio}
            staticMode={true}
          />
        </div>

        <div className="carta-actions">
          <button
            className="carta-export-btn"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Preparando imagen…' : '📤 Compartir / Guardar carta'}
          </button>

          {municipio.wikipediaUrl && (
            <a
              href={municipio.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="carta-wiki-link"
            >
              🔗 Ver en Wikipedia
            </a>
          )}
        </div>
      </div>
    </>
  );
}
