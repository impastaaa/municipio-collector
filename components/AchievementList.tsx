'use client';

interface AchievementItem {
  id: number;
  slug: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  categoria: 'COLECCIONISTA' | 'RAREZA' | 'PROVINCIA';
  unlocked: boolean;
  unlockedAt: string | null;
}

interface Props {
  items: AchievementItem[];
}

const CATEGORIA_LABELS: Record<AchievementItem['categoria'], string> = {
  COLECCIONISTA: '🗂️ Coleccionista',
  RAREZA: '⭐ Rareza',
  PROVINCIA: '📍 Provincias',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AchievementList({ items }: Props) {
  const grouped = {
    COLECCIONISTA: items.filter((i) => i.categoria === 'COLECCIONISTA'),
    RAREZA: items.filter((i) => i.categoria === 'RAREZA'),
    PROVINCIA: items.filter((i) => i.categoria === 'PROVINCIA'),
  };

  return (
    <>
      <style>{`
        .al-section { margin-bottom: 32px; }
        .al-section-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6060a0;
          margin-bottom: 14px;
          padding: 0 16px;
        }
        .al-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 0 16px;
        }
        /* Province achievements in compact grid */
        .al-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 0 16px;
        }
        @media (min-width: 480px) {
          .al-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .al-card {
          background: #0d0d1a;
          border: 1.5px solid #1e1e3a;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: border-color 0.2s ease;
        }
        .al-card.unlocked {
          border-color: #2a2a5a;
          background: linear-gradient(135deg, #0d0d1a 0%, #12122a 100%);
        }
        .al-card.locked {
          opacity: 0.55;
          filter: grayscale(0.6);
        }
        .al-icon {
          font-size: 28px;
          flex-shrink: 0;
          line-height: 1;
        }
        .al-icon.locked-icon { filter: grayscale(1); opacity: 0.4; }
        .al-body { flex: 1; min-width: 0; }
        .al-name {
          font-size: 14px;
          font-weight: 700;
          color: #e8e8ff;
          margin-bottom: 2px;
        }
        .al-desc {
          font-size: 12px;
          color: #6060a0;
          line-height: 1.4;
        }
        .al-date {
          font-size: 10px;
          color: #4a4a80;
          margin-top: 4px;
        }
        .al-unlocked-badge {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #e94560;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }

        /* Compact province card */
        .al-prov-card {
          background: #0d0d1a;
          border: 1.5px solid #1e1e3a;
          border-radius: 10px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-align: center;
        }
        .al-prov-card.unlocked { border-color: #2a2a5a; }
        .al-prov-card.locked { opacity: 0.45; filter: grayscale(0.7); }
        .al-prov-icon { font-size: 20px; }
        .al-prov-name { font-size: 11px; color: #8080b0; font-weight: 600; line-height: 1.2; }
      `}</style>

      {(['COLECCIONISTA', 'RAREZA', 'PROVINCIA'] as const).map((cat) => (
        <div key={cat} className="al-section">
          <div className="al-section-title">
            {CATEGORIA_LABELS[cat]}
            <span style={{ marginLeft: 8, color: '#3a3a6a', fontSize: 11 }}>
              {grouped[cat].filter((a) => a.unlocked).length}/{grouped[cat].length}
            </span>
          </div>

          {cat === 'PROVINCIA' ? (
            <div className="al-grid">
              {grouped[cat].map((ach) => (
                <div
                  key={ach.id}
                  className={`al-prov-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <span className="al-prov-icon">{ach.icono ?? '📍'}</span>
                  <span className="al-prov-name">{ach.nombre}</span>
                  {ach.unlocked && ach.unlockedAt && (
                    <span style={{ fontSize: 9, color: '#3a3a6a' }}>
                      {formatDate(ach.unlockedAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="al-list">
              {grouped[cat].map((ach) => (
                <div
                  key={ach.id}
                  className={`al-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <span className={`al-icon ${ach.unlocked ? '' : 'locked-icon'}`}>
                    {ach.icono ?? '🏆'}
                  </span>
                  <div className="al-body">
                    <div className="al-name">{ach.nombre}</div>
                    <div className="al-desc">
                      {ach.unlocked
                        ? ach.descripcion
                        : '???  Sigue coleccionando para descubrirlo'}
                    </div>
                    {ach.unlocked && ach.unlockedAt && (
                      <div className="al-date">Desbloqueado el {formatDate(ach.unlockedAt)}</div>
                    )}
                  </div>
                  {ach.unlocked && <div className="al-unlocked-badge">✓</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
