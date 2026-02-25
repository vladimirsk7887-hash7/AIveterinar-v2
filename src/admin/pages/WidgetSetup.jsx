import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function WidgetSetup() {
  const [clinic, setClinic] = useState(null);
  const [widgetCode, setWidgetCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([api.getClinic(), api.getWidgetCode()])
      .then(([c, w]) => { setClinic(c); setWidgetCode(w.code || w.html || ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(widgetCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;

  return (
    <div>
      <div className="page-title"><span className="icon">🔌</span> Установка виджета</div>

      {/* Status */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(124,77,255,0.08), rgba(68,138,255,0.05))', border: '1px solid rgba(124,77,255,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 36 }}>🐾</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Виджет для {clinic?.name || 'вашей клиники'}</div>
            <div style={{ fontSize: 12, color: '#90CAF9', marginTop: 4 }}>
              Вставьте код на ваш сайт — AI-ассистент появится в правом нижнем углу
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code */}
      <div className="card">
        <div className="card-title">Код для встраивания</div>
        <div style={{ position: 'relative' }}>
          <pre style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 20,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#90CAF9',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {widgetCode || `<script src="https://aiveterinar.ru/widget.js" data-slug="${clinic?.slug || 'your-slug'}"></script>`}
          </pre>
          <button
            className="btn btn-primary"
            onClick={copyCode}
            style={{ position: 'absolute', top: 12, right: 12, padding: '6px 14px', fontSize: 11 }}
          >
            {copied ? 'Скопировано!' : 'Копировать'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="card">
        <div className="card-title">Инструкция</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Step n={1} title="Скопируйте код" desc="Нажмите кнопку «Копировать» выше" />
          <Step n={2} title="Вставьте на сайт" desc="Добавьте код перед закрывающим тегом </body> на каждой странице вашего сайта" />
          <Step n={3} title="Проверьте" desc="Откройте сайт — в правом нижнем углу появится кнопка чата" />
        </div>
      </div>

      {/* Preview link */}
      {clinic?.slug && (
        <div className="card">
          <div className="card-title">Превью</div>
          <div style={{ fontSize: 13, marginBottom: 12 }}>
            Вы можете протестировать виджет по прямой ссылке:
          </div>
          <a
            href={`/widget/${clinic.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#7C4DFF', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}
          >
            /widget/{clinic.slug} →
          </a>
        </div>
      )}
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'linear-gradient(135deg, #7C4DFF, #448AFF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {n}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#546E7A', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}
