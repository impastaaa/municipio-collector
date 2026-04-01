'use client';

import { useEffect, useState } from 'react';
import { CollectionGrid } from '@/components/CollectionGrid';

const STORAGE_KEY = 'municipio_uid';

export default function ColeccionPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem(STORAGE_KEY);
    if (!uid) { setLoading(false); return; }

    fetch(`/api/users/${uid}/collection`, {
      headers: { Authorization: `Bearer ${uid}` },
    })
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style suppressHydrationWarning>{`
        body { background: #07070f; color: #e8e8ff; font-family: Georgia, serif; min-height: 100dvh; }
        .col-header {
          padding: 24px 16px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #1e1e3a;
        }
        .col-back {
          font-size: 20px;
          text-decoration: none;
          color: #6060a0;
          padding: 4px 8px;
          border-radius: 8px;
          transition: color 0.15s;
        }
        .col-back:hover { color: #e8e8ff; }
        .col-title {
          font-size: 18px;
          font-weight: 700;
          color: #e8e8ff;
        }
        .col-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 40vh;
          color: #4040600;
          font-size: 14px;
        }
        .col-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          gap: 12px;
          padding: 24px;
          text-align: center;
        }
        .col-empty-icon { font-size: 48px; }
        .col-empty-text { color: #4a4a7a; font-size: 15px; line-height: 1.5; }
        .col-empty-cta {
          margin-top: 8px;
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, #e94560 0%, #c4152e 100%);
          color: #fff;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
        }
      `}</style>

      <div className="col-header">
        <a href="/" className="col-back">←</a>
        <h1 className="col-title">Mi Colección</h1>
      </div>

      {loading ? (
        <div className="col-loading">Cargando colección…</div>
      ) : items.length === 0 ? (
        <div className="col-empty">
          <div className="col-empty-icon">🗺️</div>
          <p className="col-empty-text">
            Aún no tienes ningún municipio.<br />
            ¡Consigue tu primera tirada!
          </p>
          <a href="/" className="col-empty-cta">¡Conseguir municipios!</a>
        </div>
      ) : (
        <CollectionGrid items={items} totalMunicipios={8132} />
      )}
    </>
  );
}
