'use client';

import { useEffect, useState } from 'react';
import { AchievementList } from '@/components/AchievementList';

const STORAGE_KEY = 'municipio_uid';

export default function LogrosPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem(STORAGE_KEY);
    if (!uid) { setLoading(false); return; }

    fetch(`/api/users/${uid}/achievements`, {
      headers: { Authorization: `Bearer ${uid}` },
    })
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const unlockedCount = items.filter((i) => i.unlocked).length;

  return (
    <>
      <style suppressHydrationWarning>{`
        body { background: #07070f; color: #e8e8ff; font-family: Georgia, serif; min-height: 100dvh; }
        .logros-header {
          padding: 24px 16px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #1e1e3a;
          margin-bottom: 20px;
        }
        .logros-back {
          font-size: 20px;
          text-decoration: none;
          color: #6060a0;
          padding: 4px 8px;
          border-radius: 8px;
        }
        .logros-back:hover { color: #e8e8ff; }
        .logros-title { font-size: 18px; font-weight: 700; color: #e8e8ff; }
        .logros-count { margin-left: auto; font-size: 12px; color: #4a4a7a; }
        .logros-loading {
          display: flex; align-items: center; justify-content: center;
          height: 40vh; color: #4040600; font-size: 14px;
        }
      `}</style>

      <div className="logros-header">
        <a href="/" className="logros-back">←</a>
        <h1 className="logros-title">Logros</h1>
        {!loading && (
          <span className="logros-count">
            {unlockedCount}/{items.length} desbloqueados
          </span>
        )}
      </div>

      {loading ? (
        <div className="logros-loading">Cargando logros…</div>
      ) : (
        <AchievementList items={items} />
      )}
    </>
  );
}
