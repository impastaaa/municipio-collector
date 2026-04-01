'use client';

import React from 'react';

export type Rareza =
  | 'GRAN_CIUDAD'
  | 'CIUDAD'
  | 'GRAN_PUEBLO'
  | 'PUEBLO'
  | 'ESPANA_VACIA';

export interface MunicipioCardData {
  codigoIne: string;
  nombre: string;
  provincia: string;
  comunidadAutonoma: string;
  poblacion?: number | null;
  poblacionYear?: number | null;
  superficieKm2?: number | null;
  altitudM?: number | null;
  rareza: Rareza;
  wikipediaUrl?: string | null;
  escudoUrl: string;
}

interface Props {
  municipio: MunicipioCardData;
  /** When true, card is rendered statically (no hover effects) for html2canvas */
  staticMode?: boolean;
  onClick?: () => void;
}

const RAREZA_META: Record<
  Rareza,
  { label: string; stars: number; className: string }
> = {
  GRAN_CIUDAD: { label: 'Gran Ciudad', stars: 5, className: 'card-gran-ciudad' },
  CIUDAD: { label: 'Ciudad', stars: 4, className: 'card-ciudad' },
  GRAN_PUEBLO: { label: 'Gran Pueblo', stars: 3, className: 'card-gran-pueblo' },
  PUEBLO: { label: 'Pueblo', stars: 2, className: 'card-pueblo' },
  ESPANA_VACIA: { label: 'España Vacía', stars: 1, className: 'card-espana-vacia' },
};

function formatPoblacion(n: number): string {
  return n.toLocaleString('es-ES');
}

export const MunicipioCard = React.forwardRef<HTMLDivElement, Props>(
  ({ municipio, staticMode = false, onClick }, ref) => {
    const meta = RAREZA_META[municipio.rareza];

    return (
      <>
        <style>{`
          .mc-card {
            /*
             * Width is NOT set here — the parent wrapper controls it.
             * min-height: 210px enforces consistent card height everywhere.
             * display:flex + flex-direction:column lets mc-body grow to fill space.
             */
            width: 100%;
            min-height: 210px;
            display: flex;
            flex-direction: column;
            border-radius: 16px;
            overflow: hidden;
            position: relative;
            cursor: ${onClick ? 'pointer' : 'default'};
            font-family: 'Georgia', serif;
            user-select: none;
            box-sizing: border-box;
          }
          .mc-card:not(.static-mode):hover {
            transform: translateY(-4px) scale(1.02);
          }
          .mc-card, .mc-card * { box-sizing: border-box; }

          /* ── GRAN CIUDAD ── holographic gold foil */
          .card-gran-ciudad {
            background: linear-gradient(135deg, #1a0a00 0%, #3d1f00 40%, #1a0a00 100%);
            border: 2px solid #c9910a;
            box-shadow: 0 0 24px rgba(201,145,10,0.6), 0 8px 32px rgba(0,0,0,0.7);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .card-gran-ciudad:hover {
            box-shadow: 0 0 40px rgba(201,145,10,0.9), 0 12px 40px rgba(0,0,0,0.8);
          }
          .card-gran-ciudad .mc-header { background: linear-gradient(180deg, #c9910a 0%, #7c5500 100%); }
          .card-gran-ciudad .mc-rareza-badge { background: #c9910a; color: #1a0a00; font-weight: 800; }
          .card-gran-ciudad .mc-stat-label { color: #c9910a; }
          .card-gran-ciudad .mc-stat-value { color: #ffe4a0; }
          .card-gran-ciudad .mc-nombre { color: #ffe4a0; }
          .card-gran-ciudad .mc-provincia { color: #c9910a; }
          .card-gran-ciudad .mc-foil-overlay {
            background: linear-gradient(
              115deg,
              transparent 0%, rgba(255,220,80,0.08) 30%,
              rgba(255,255,255,0.12) 50%, rgba(255,220,80,0.08) 70%,
              transparent 100%
            );
          }

          /* ── CIUDAD ── silver chrome */
          .card-ciudad {
            background: linear-gradient(135deg, #0d1117 0%, #1c2533 50%, #0d1117 100%);
            border: 2px solid #7ba7c7;
            box-shadow: 0 0 16px rgba(123,167,199,0.4), 0 8px 24px rgba(0,0,0,0.7);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .card-ciudad:hover {
            box-shadow: 0 0 28px rgba(123,167,199,0.7), 0 12px 36px rgba(0,0,0,0.8);
          }
          .card-ciudad .mc-header { background: linear-gradient(180deg, #4a7fa0 0%, #1c3a52 100%); }
          .card-ciudad .mc-rareza-badge { background: #7ba7c7; color: #0d1117; }
          .card-ciudad .mc-stat-label { color: #7ba7c7; }
          .card-ciudad .mc-stat-value { color: #d0eaff; }
          .card-ciudad .mc-nombre { color: #d0eaff; }
          .card-ciudad .mc-provincia { color: #7ba7c7; }
          .card-ciudad .mc-foil-overlay {
            background: linear-gradient(
              115deg,
              transparent 0%, rgba(180,220,255,0.06) 40%,
              rgba(255,255,255,0.1) 50%, rgba(180,220,255,0.06) 60%,
              transparent 100%
            );
          }

          /* ── GRAN PUEBLO ── forest green */
          .card-gran-pueblo {
            background: linear-gradient(135deg, #071209 0%, #122418 50%, #071209 100%);
            border: 2px solid #5a9e6f;
            box-shadow: 0 0 12px rgba(90,158,111,0.35), 0 6px 20px rgba(0,0,0,0.6);
            transition: transform 0.2s ease;
          }
          .card-gran-pueblo .mc-header { background: linear-gradient(180deg, #2d6e40 0%, #0f2b18 100%); }
          .card-gran-pueblo .mc-rareza-badge { background: #5a9e6f; color: #071209; }
          .card-gran-pueblo .mc-stat-label { color: #5a9e6f; }
          .card-gran-pueblo .mc-stat-value { color: #b8e4c4; }
          .card-gran-pueblo .mc-nombre { color: #b8e4c4; }
          .card-gran-pueblo .mc-provincia { color: #5a9e6f; }
          .card-gran-pueblo .mc-foil-overlay { display: none; }

          /* ── PUEBLO ── terracotta warm */
          .card-pueblo {
            background: linear-gradient(135deg, #130800 0%, #291500 50%, #130800 100%);
            border: 2px solid #b06030;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            transition: transform 0.2s ease;
          }
          .card-pueblo .mc-header { background: linear-gradient(180deg, #8a4020 0%, #331800 100%); }
          .card-pueblo .mc-rareza-badge { background: #b06030; color: #fff8f4; }
          .card-pueblo .mc-stat-label { color: #c07040; }
          .card-pueblo .mc-stat-value { color: #f5d4b8; }
          .card-pueblo .mc-nombre { color: #f5d4b8; }
          .card-pueblo .mc-provincia { color: #c07040; }
          .card-pueblo .mc-foil-overlay { display: none; }

          /* ── ESPAÑA VACÍA ── sepia/grain aged parchment */
          .card-espana-vacia {
            background: #1c1610;
            border: 2px solid #6b5a3e;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            filter: saturate(0.4);
            transition: transform 0.2s ease;
          }
          .card-espana-vacia .mc-header { background: linear-gradient(180deg, #3d2f1a 0%, #1c1610 100%); }
          .card-espana-vacia .mc-rareza-badge { background: #6b5a3e; color: #e8d9bc; letter-spacing: 0.03em; }
          .card-espana-vacia .mc-stat-label { color: #8a7050; }
          .card-espana-vacia .mc-stat-value { color: #c8b48a; }
          .card-espana-vacia .mc-nombre { color: #c8b48a; }
          .card-espana-vacia .mc-provincia { color: #8a7050; }
          .card-espana-vacia .mc-grain-overlay { display: block !important; }
          .card-espana-vacia .mc-foil-overlay { display: none; }

          /* ── shared layout ── */
          .mc-header {
            padding: 12px 14px 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          /* Top row: badge on the left, stars on the right */
          .mc-top-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .mc-rareza-badge {
            font-size: 10px; font-weight: 700;
            padding: 3px 8px; border-radius: 20px;
            text-transform: uppercase; letter-spacing: 0.06em;
            white-space: nowrap;
          }
          .mc-stars {
            font-size: 11px; letter-spacing: -1px;
          }
          /* Bottom row: escudo + name/province side by side */
          .mc-bottom-row {
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }
          .mc-escudo-wrap {
            width: 56px; height: 56px;
            border-radius: 8px;
            background: rgba(0,0,0,0.35);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            overflow: hidden;
          }
          .mc-escudo-wrap img {
            max-width: 48px; max-height: 48px;
            object-fit: contain;
          }
          .mc-title-block {
            flex: 1;
            min-width: 0;
          }
          .mc-nombre {
            font-size: 17px;
            font-weight: 700;
            line-height: 1.25;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            word-break: break-word;
          }
          .mc-provincia {
            font-size: 11px; font-weight: 400;
            margin-top: 2px; opacity: 0.85;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .mc-body {
            flex: 1; /* grow to fill remaining height above 210px */
            padding: 10px 14px 14px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            align-content: start; /* stats stay at top, empty space goes to bottom */
          }
          .mc-stat { display: flex; flex-direction: column; }
          .mc-stat-label {
            font-size: 9px; text-transform: uppercase;
            letter-spacing: 0.08em; font-weight: 600;
            margin-bottom: 2px;
          }
          .mc-stat-value { font-size: 13px; font-weight: 600; }
          .mc-ine {
            grid-column: 1 / -1;
            font-size: 9px; opacity: 0.4;
            text-align: right;
            margin-top: 4px;
          }
          .mc-foil-overlay {
            position: absolute; inset: 0; pointer-events: none;
            border-radius: inherit;
          }
          .mc-grain-overlay {
            display: none;
            position: absolute; inset: 0; pointer-events: none;
            border-radius: inherit;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
            background-size: 200px 200px;
            mix-blend-mode: overlay;
            opacity: 0.5;
          }
        `}</style>

        <div
          ref={ref}
          className={`mc-card ${meta.className} ${staticMode ? 'static-mode' : ''}`}
          onClick={onClick}
          style={{ transition: staticMode ? 'none' : undefined }}
        >
          <div className="mc-foil-overlay" />
          <div className="mc-grain-overlay" />

          <div className="mc-header">
            {/* Row 1: rareza badge + stars */}
            <div className="mc-top-row">
              <div className="mc-rareza-badge">{meta.label}</div>
              <div className="mc-stars">
                {'★'.repeat(meta.stars)}{'☆'.repeat(5 - meta.stars)}
              </div>
            </div>
            {/* Row 2: escudo + name/province */}
            <div className="mc-bottom-row">
              <div className="mc-escudo-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={municipio.escudoUrl}
                  alt={`Escudo de ${municipio.nombre}`}
                  crossOrigin="anonymous"
                />
              </div>
              <div className="mc-title-block">
                <div className="mc-nombre">{municipio.nombre}</div>
                <div className="mc-provincia">{municipio.provincia}</div>
              </div>
            </div>
          </div>

          <div className="mc-body">
            {municipio.poblacion != null && (
              <div className="mc-stat">
                <span className="mc-stat-label">Población</span>
                <span className="mc-stat-value">
                  {formatPoblacion(municipio.poblacion)}
                  {municipio.poblacionYear ? ` (${municipio.poblacionYear})` : ''}
                </span>
              </div>
            )}
            {municipio.superficieKm2 != null && (
              <div className="mc-stat">
                <span className="mc-stat-label">Superficie</span>
                <span className="mc-stat-value">
                  {municipio.superficieKm2.toLocaleString('es-ES')} km²
                </span>
              </div>
            )}
            {municipio.altitudM != null && (
              <div className="mc-stat">
                <span className="mc-stat-label">Altitud</span>
                <span className="mc-stat-value">{municipio.altitudM} m</span>
              </div>
            )}
            <div className="mc-stat">
              <span className="mc-stat-label">C. Autónoma</span>
              <span className="mc-stat-value" style={{ fontSize: 11 }}>
                {municipio.comunidadAutonoma}
              </span>
            </div>
            <div className="mc-ine">INE {municipio.codigoIne}</div>
          </div>
        </div>
      </>
    );
  },
);

MunicipioCard.displayName = 'MunicipioCard';
