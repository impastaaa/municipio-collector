'use client';

import { useState, useMemo } from 'react';
import { MunicipioCard, MunicipioCardData, Rareza } from './MunicipioCard';
import { useRouter } from 'next/navigation';

interface CollectionItem {
  claimedAt: string;
  municipio: MunicipioCardData;
}

interface Props {
  items: CollectionItem[];
  totalMunicipios: number;
}

type SortOption = 'az' | 'za' | 'recent';

const RAREZA_ORDER: Rareza[] = [
  'GRAN_CIUDAD',
  'CIUDAD',
  'GRAN_PUEBLO',
  'PUEBLO',
  'ESPANA_VACIA',
];

const RAREZA_LABELS: Record<Rareza, string> = {
  GRAN_CIUDAD: 'Gran Ciudad',
  CIUDAD: 'Ciudad',
  GRAN_PUEBLO: 'Gran Pueblo',
  PUEBLO: 'Pueblo',
  ESPANA_VACIA: 'España Vacía',
};

const RAREZA_TOTALS: Record<Rareza, number> = {
  GRAN_CIUDAD: 67,
  CIUDAD: 716,
  GRAN_PUEBLO: 2369,
  PUEBLO: 3574,
  ESPANA_VACIA: 1406,
};

const RAREZA_COLORS: Record<Rareza, string> = {
  GRAN_CIUDAD: '#c9910a',
  CIUDAD: '#7ba7c7',
  GRAN_PUEBLO: '#5a9e6f',
  PUEBLO: '#b06030',
  ESPANA_VACIA: '#6b5a3e',
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: '#1a1a2e', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  );
}

export function CollectionGrid({ items, totalMunicipios }: Props) {
  const router = useRouter();
  const [selectedRareza, setSelectedRareza] = useState<Rareza | null>(null);
  const [selectedProvincia, setSelectedProvincia] = useState<string>('');
  const [sort, setSort] = useState<SortOption>('recent');

  const provinces = useMemo(() => {
    const set = new Set(items.map((i) => i.municipio.provincia));
    return Array.from(set).sort();
  }, [items]);

  const byRareza = useMemo(() => {
    const counts: Record<Rareza, number> = {
      GRAN_CIUDAD: 0, CIUDAD: 0, GRAN_PUEBLO: 0, PUEBLO: 0, ESPANA_VACIA: 0,
    };
    items.forEach((i) => { counts[i.municipio.rareza]++; });
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    let out = [...items];
    if (selectedRareza) out = out.filter((i) => i.municipio.rareza === selectedRareza);
    if (selectedProvincia) out = out.filter((i) => i.municipio.provincia === selectedProvincia);
    if (sort === 'az') out.sort((a, b) => a.municipio.nombre.localeCompare(b.municipio.nombre, 'es'));
    else if (sort === 'za') out.sort((a, b) => b.municipio.nombre.localeCompare(a.municipio.nombre, 'es'));
    else out.sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
    return out;
  }, [items, selectedRareza, selectedProvincia, sort]);

  return (
    <>
      <style>{`
        .cg-progress-section {
          padding: 16px;
          background: #0d0d1a;
          border-bottom: 1px solid #1e1e3a;
        }
        .cg-progress-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6060a0;
          margin-bottom: 12px;
        }
        .cg-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .cg-total-label { font-size: 15px; font-weight: 700; color: #e8e8ff; }
        .cg-total-pct { font-size: 12px; color: #6060a0; }
        .cg-rareza-rows { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
        .cg-rareza-row { display: grid; grid-template-columns: 90px 1fr 60px; align-items: center; gap: 8px; }
        .cg-rareza-name { font-size: 11px; color: #8080b0; }
        .cg-rareza-count { font-size: 11px; color: #6060a0; text-align: right; }

        .cg-filters {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #0d0d1a;
          border-bottom: 1px solid #1e1e3a;
          padding: 10px 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .cg-chip {
          padding: 5px 12px;
          border-radius: 20px;
          border: 1.5px solid #2a2a4a;
          background: transparent;
          color: #8080b0;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .cg-chip:hover { border-color: #4a4a8a; color: #c0c0f0; }
        .cg-chip.active { background: #e94560; border-color: #e94560; color: #fff; }
        .cg-select {
          padding: 5px 10px;
          border-radius: 20px;
          border: 1.5px solid #2a2a4a;
          background: #0d0d1a;
          color: #8080b0;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
          outline: none;
        }
        .cg-sort-group {
          margin-left: auto;
          display: flex;
          gap: 4px;
        }
        .cg-sort-btn {
          padding: 4px 10px;
          border-radius: 20px;
          border: 1.5px solid #2a2a4a;
          background: transparent;
          color: #6060a0;
          font-size: 11px;
          cursor: pointer;
          font-family: inherit;
        }
        .cg-sort-btn.active { border-color: #4a4a8a; color: #c0c0f0; }

        /*
         * Grid: auto-fill columns where each card is exactly 160px wide.
         * The card itself is fluid (width:100%), so it fills its 160px slot perfectly.
         * To change card size in the grid, just change the 160px value here.
         */
        .cg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 280px));
          justify-content: center;
          gap: 16px;
          padding: 16px 12px;
        }

        /* Each slot is exactly 280px — matches reveal/detail view */
        .cg-grid-item {
          width: 280px;
        }

        .cg-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 48px 16px;
        }
        .cg-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .cg-empty-text { color: #4a4a7a; font-size: 14px; }
      `}</style>

      {/* Progress section */}
      <div className="cg-progress-section">
        <div className="cg-progress-title">Progreso</div>
        <div className="cg-total-row">
          <span className="cg-total-label">
            {items.length.toLocaleString('es-ES')} / {totalMunicipios.toLocaleString('es-ES')} municipios
          </span>
          <span className="cg-total-pct">
            {((items.length / totalMunicipios) * 100).toFixed(1)}%
          </span>
        </div>
        <ProgressBar value={items.length} max={totalMunicipios} color="#e94560" />

        <div className="cg-rareza-rows">
          {RAREZA_ORDER.map((r) => (
            <div key={r} className="cg-rareza-row">
              <span className="cg-rareza-name">{RAREZA_LABELS[r]}</span>
              <ProgressBar value={byRareza[r]} max={RAREZA_TOTALS[r]} color={RAREZA_COLORS[r]} />
              <span className="cg-rareza-count">{byRareza[r]}/{RAREZA_TOTALS[r]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="cg-filters">
        <button
          className={`cg-chip ${selectedRareza === null ? 'active' : ''}`}
          onClick={() => setSelectedRareza(null)}
        >
          Todas
        </button>
        {RAREZA_ORDER.map((r) => (
          <button
            key={r}
            className={`cg-chip ${selectedRareza === r ? 'active' : ''}`}
            onClick={() => setSelectedRareza(selectedRareza === r ? null : r)}
          >
            {RAREZA_LABELS[r]}
          </button>
        ))}

        <select
          className="cg-select"
          value={selectedProvincia}
          onChange={(e) => setSelectedProvincia(e.target.value)}
        >
          <option value="">Todas las provincias</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <div className="cg-sort-group">
          {(['recent', 'az', 'za'] as SortOption[]).map((s) => (
            <button
              key={s}
              className={`cg-sort-btn ${sort === s ? 'active' : ''}`}
              onClick={() => setSort(s)}
            >
              {s === 'recent' ? 'Reciente' : s === 'az' ? 'A–Z' : 'Z–A'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="cg-grid">
        {filtered.length === 0 ? (
          <div className="cg-empty">
            <div className="cg-empty-icon">🗺️</div>
            <div className="cg-empty-text">No hay cartas con estos filtros</div>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.municipio.codigoIne} className="cg-grid-item">
              <MunicipioCard
                municipio={item.municipio}
                onClick={() => router.push(`/carta/${item.municipio.codigoIne}`)}
              />
            </div>
          ))
        )}
      </div>
    </>
  );
}
