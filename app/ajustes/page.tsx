'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'municipio_uid';

export default function AjustesPage() {
  const [uid, setUid] = useState('');
  const [restoreInput, setRestoreInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [restoreError, setRestoreError] = useState('');

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY) ?? '';
    setUid(id);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(uid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRestore = async () => {
    const trimmed = restoreInput.trim();
    if (!trimmed) return;
    setRestoreError('');

    // Validate UUID exists
    const res = await fetch(`/api/users/${trimmed}/state`, {
      headers: { Authorization: `Bearer ${trimmed}` },
    });
    if (!res.ok) {
      setRestoreError('Código no válido o no encontrado. Revisa que lo hayas copiado correctamente.');
      return;
    }

    localStorage.setItem(STORAGE_KEY, trimmed);
    window.location.href = '/';
  };

  return (
    <>
      <style suppressHydrationWarning>{`
        body { background: #07070f; color: #e8e8ff; font-family: Georgia, serif; min-height: 100dvh; }
        .aj-header {
          padding: 24px 16px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #1e1e3a;
          margin-bottom: 28px;
        }
        .aj-back {
          font-size: 20px;
          text-decoration: none;
          color: #6060a0;
          padding: 4px 8px;
          border-radius: 8px;
        }
        .aj-back:hover { color: #e8e8ff; }
        .aj-title { font-size: 18px; font-weight: 700; }
        .aj-body { padding: 0 16px; display: flex; flex-direction: column; gap: 28px; max-width: 480px; }
        .aj-section-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6060a0;
          margin-bottom: 10px;
        }
        .aj-uid-box {
          background: #0d0d1a;
          border: 1.5px solid #1e1e3a;
          border-radius: 10px;
          padding: 14px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #8080c0;
          word-break: break-all;
          line-height: 1.5;
        }
        .aj-copy-btn {
          margin-top: 10px;
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: 1.5px solid #2a2a5a;
          background: transparent;
          color: #8080c0;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .aj-copy-btn:hover { background: #1a1a2e; color: #c0c0f0; }
        .aj-copy-btn.copied { border-color: #5a9e6f; color: #5a9e6f; }
        .aj-restore-input {
          width: 100%;
          background: #0d0d1a;
          border: 1.5px solid #2a2a4a;
          border-radius: 10px;
          padding: 12px 14px;
          color: #e8e8ff;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          outline: none;
        }
        .aj-restore-input:focus { border-color: #4a4a8a; }
        .aj-restore-input::placeholder { color: #2a2a4a; }
        .aj-warning {
          margin-top: 10px;
          font-size: 12px;
          color: #7a5030;
          line-height: 1.5;
          padding: 10px 12px;
          background: #1a0e00;
          border-radius: 8px;
          border: 1px solid #3a2010;
        }
        .aj-restore-btn {
          margin-top: 12px;
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #4a6fa5 0%, #2a4a80 100%);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .aj-restore-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .aj-error { margin-top: 8px; font-size: 12px; color: #e94560; }
      `}</style>

      <div className="aj-header">
        <a href="/" className="aj-back">←</a>
        <h1 className="aj-title">Ajustes</h1>
      </div>

      <div className="aj-body">
        {/* UUID display */}
        <section>
          <div className="aj-section-label">Tu código de coleccionista</div>
          <div className="aj-uid-box">{uid || '—'}</div>
          <button
            className={`aj-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copiado' : 'Copiar código'}
          </button>
        </section>

        {/* Restore */}
        <section>
          <div className="aj-section-label">Restaurar colección</div>
          <input
            className="aj-restore-input"
            type="text"
            placeholder="Pega tu código aquí..."
            value={restoreInput}
            onChange={(e) => { setRestoreInput(e.target.value); setRestoreError(''); }}
          />
          <div className="aj-warning">
            ⚠️ Si introduces un código diferente, perderás acceso a tu colección actual en este dispositivo.
          </div>
          {restoreError && <div className="aj-error">{restoreError}</div>}
          <button
            className="aj-restore-btn"
            onClick={handleRestore}
            disabled={!restoreInput.trim()}
          >
            Restaurar colección
          </button>
        </section>
      </div>
    </>
  );
}
