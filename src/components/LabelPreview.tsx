import React from 'react';

export interface LabelData {
  labelSeqId?: string;
  compositeId?: string;
  partNumber: string;
  description: string;
  quantity: number;
  printedBy: string;
  printedAt: string;
  qrValidated?: boolean;
  msl?: string | null;
  expiryDate?: string | null;
  labelType?: 'normal' | 'caixa';
}

// Deterministic QR-like block pattern
function QRBlock({ value, size = 52 }: { value: string; size?: number }) {
  const N = 11;
  const cell = Math.floor(size / N);
  let seed = value.split('').reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 0);
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 0xffffffff; };

  const cells = Array.from({ length: N * N }, (_, i) => {
    const r = Math.floor(i / N); const c = i % N;
    if ((r < 3 && c < 3) || (r < 3 && c >= N - 3) || (r >= N - 3 && c < 3)) return true;
    if (r === 3 || c === 3) return false;
    return next() > 0.42;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, ${cell}px)`, gap: 0, border: '1px solid #000', padding: 2, background: '#fff' }}>
      {cells.map((dark, i) => (
        <div key={i} style={{ width: cell, height: cell, background: dark ? '#111' : '#fff' }} />
      ))}
    </div>
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtQty(n: number) {
  return n.toLocaleString('pt-BR');
}

// ─── Etiqueta de Produto ──────────────────────────────────────────────────────
export function LabelPreview({ label }: { label: LabelData }) {
  const qrVal = label.labelSeqId || label.compositeId || label.partNumber;
  const expiryFmt = label.expiryDate
    ? (() => { const d = new Date(label.expiryDate!); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })()
    : '';

  return (
    <div style={{ width: 420, fontFamily: 'Arial, sans-serif', background: '#fff', color: '#000', border: '2px solid #222', userSelect: 'none', fontSize: 11 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #222', padding: '4px 8px', background: '#f5f5f5' }}>
        <span style={{ fontWeight: 700, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          ETIQUETA DE IDENTIFICAÇÃO DE PRODUTO
        </span>
        <span style={{ fontSize: 11, fontWeight: 900 }}>grupo<span style={{ fontStyle: 'italic' }}>Multilaser</span></span>
      </div>

      {/* Main row: QR | PN + Description | QR */}
      <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 64px', gap: 6, padding: '8px 6px 6px', borderBottom: '1px solid #ccc' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <QRBlock value={qrVal} size={60} />
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#666', marginBottom: 1 }}>Part Number:</div>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.5, lineHeight: 1.1, wordBreak: 'break-all' }}>{label.partNumber}</div>
          <div style={{ fontSize: 8, color: '#333', marginTop: 3, lineHeight: 1.4 }}>{label.description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <QRBlock value={qrVal + '_2'} size={60} />
        </div>
      </div>

      {/* Bottom row: DATA VENC / MSL | Quantidade + ID | QR + Processo */}
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px', borderBottom: '1px solid #ccc' }}>
        {/* Left: expiry + msl */}
        <div style={{ borderRight: '1px solid #ccc', padding: '6px 6px' }}>
          {label.expiryDate && (
            <>
              <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase' }}>Data Venc:</div>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{expiryFmt}</div>
            </>
          )}
          {label.msl && (
            <div style={{ fontSize: 11, fontWeight: 900, marginTop: label.expiryDate ? 4 : 8 }}>{label.msl}</div>
          )}
        </div>
        {/* Center: Quantity + ID */}
        <div style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #ccc' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quantidade:</div>
          <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{fmtQty(label.quantity)}</div>
          {label.labelSeqId && (
            <div style={{ fontSize: 8, color: '#444', marginTop: 2 }}>ID: {label.labelSeqId}</div>
          )}
        </div>
        {/* Right: small QR + Processo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
          <QRBlock value={qrVal + '_3'} size={48} />
          <div style={{ fontSize: 7, color: '#666', marginTop: 4 }}>Processo:</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '3px 8px', fontSize: 8, color: '#333' }}>
        {label.printedBy} - {fmtDate(label.printedAt)}
      </div>

      {/* Warning strip */}
      <div style={{ background: '#FFE033', borderTop: '1px solid #e6c800', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 600 }}>
        <span>⚠</span>
        <span>Etiqueta de identificação exclusiva de produtos com ID.</span>
      </div>
    </div>
  );
}

// ─── Etiqueta de Caixa ────────────────────────────────────────────────────────
export function BoxLabelPreview({ label }: { label: LabelData }) {
  const qrVal = label.partNumber;

  return (
    <div style={{ width: 420, fontFamily: 'Arial, sans-serif', background: '#fff', color: '#000', border: '2px solid #222', userSelect: 'none', fontSize: 11 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #222', padding: '4px 8px', background: '#f5f5f5' }}>
        <span style={{ fontWeight: 700, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          ETIQUETA DE IDENTIFICAÇÃO | CAIXA
        </span>
        <span style={{ fontSize: 11, fontWeight: 900 }}>grupo<span style={{ fontStyle: 'italic' }}>Multilaser</span></span>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', borderBottom: '1px solid #ccc' }}>
        <div style={{ borderRight: '1px solid #ccc', padding: '4px 6px', fontSize: 8, fontWeight: 700 }}>PRODUTO:</div>
        <div style={{ borderRight: '1px solid #ccc', padding: '4px 6px', fontSize: 8 }}>Part Number:</div>
        <div style={{ padding: '4px 6px', fontSize: 8, fontWeight: 700 }}>QTD:</div>
      </div>

      {/* Main content row */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', borderBottom: '1px solid #ccc' }}>
        {/* Left: QR */}
        <div style={{ borderRight: '1px solid #ccc', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QRBlock value={qrVal} size={64} />
        </div>
        {/* Center: PN + Description */}
        <div style={{ borderRight: '1px solid #ccc', padding: '6px 8px' }}>
          <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: 0.5, wordBreak: 'break-all' }}>{label.partNumber}</div>
          <div style={{ fontSize: 8, color: '#333', marginTop: 2, lineHeight: 1.4 }}>{label.description}</div>
        </div>
        {/* Right: QR */}
        <div style={{ padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QRBlock value={qrVal + '_caixa'} size={48} />
        </div>
      </div>

      {/* Quantity */}
      <div style={{ textAlign: 'center', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>Quantidade:</div>
        <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{fmtQty(label.quantity)}</div>
      </div>

      {/* MSL + PROCESSO row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #ccc' }}>
        <div style={{ borderRight: '1px solid #ccc', padding: '4px 8px', fontSize: 11, fontWeight: 900 }}>
          {label.msl || ''}
        </div>
        <div style={{ padding: '4px 8px', fontSize: 8, color: '#666', textAlign: 'right' }}>PROCESSO:</div>
      </div>

      {/* Footer */}
      <div style={{ padding: '3px 8px', fontSize: 8, color: '#333' }}>
        {label.printedBy} - {fmtDate(label.printedAt)}
      </div>

      {/* Warning strip */}
      <div style={{ background: '#FFE033', borderTop: '1px solid #e6c800', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 600 }}>
        <span>⚠</span>
        <span>Etiqueta de identificação para caixa dos produtos embalados.</span>
      </div>
    </div>
  );
}
