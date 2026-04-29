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


// QR Code real via API externa (sem dependência)
function QRImg({ value, size = 72, onLoad }: { value: string; size?: number; onLoad?: () => void }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  return <img src={url} width={size} height={size} alt="QR Code" style={{ display: 'block', background: '#fff', border: '1px solid #000' }} onLoad={onLoad} />;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtQty(n: number) {
  return n.toLocaleString('pt-BR');
}

// ─── Etiqueta de Produto ──────────────────────────────────────────────────────

export function LabelPreview({ label, onQrLoad }: { label: LabelData, onQrLoad?: () => void }) {
  // Tamanho 100x50mm = 420x210px (300dpi ~ 12px/mm)
  const qrVal = `${label.partNumber}|${label.quantity}`;
  const expiryFmt = label.expiryDate
    ? (() => { const d = new Date(label.expiryDate!); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })()
    : '';

  // onQrLoad será chamado quando ambos os QR Codes carregarem
  const [qrLoaded, setQrLoaded] = React.useState(0);
  React.useEffect(() => { if (qrLoaded >= 2 && onQrLoad) onQrLoad(); }, [qrLoaded, onQrLoad]);

  return (
    <div className="label-preview-print" style={{ width: 420, height: 210, fontFamily: 'Arial, sans-serif', background: '#fff', color: '#000', border: '2px solid #222', userSelect: 'none', fontSize: 11, boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #222', padding: '4px 8px', background: '#f5f5f5' }}>
        <span style={{ fontWeight: 700, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          ETIQUETA DE IDENTIFICAÇÃO DE PRODUTO
        </span>
        <span style={{ fontSize: 11, fontWeight: 900 }}>grupo<span style={{ fontStyle: 'italic' }}>Multilaser</span></span>
      </div>

      {/* Main row: QR | PN + Description | QR */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px', gap: 6, padding: '8px 6px 6px', borderBottom: '1px solid #ccc' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <QRImg value={qrVal} size={72} onLoad={() => setQrLoaded(qrLoaded => qrLoaded + 1)} />
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#666', marginBottom: 1 }}>Part Number:</div>
          <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.5, lineHeight: 1.1, wordBreak: 'break-all' }}>{label.partNumber}</div>
          <div style={{ fontSize: 9, color: '#333', marginTop: 3, lineHeight: 1.4 }}>{label.description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <QRImg value={qrVal} size={72} onLoad={() => setQrLoaded(qrLoaded => qrLoaded + 1)} />
        </div>
      </div>

      {/* Bottom row: DATA VENC / MSL | Quantidade + ID | QR + Processo */}
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', borderBottom: '1px solid #ccc' }}>
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
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quantidade:</div>
          <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.1 }}>{fmtQty(label.quantity)}</div>
          {label.labelSeqId && (
            <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>ID: {label.labelSeqId}</div>
          )}
        </div>
        {/* Right: small QR + Processo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
          <QRImg value={qrVal} size={48} onLoad={() => setQrLoaded(qrLoaded => qrLoaded + 1)} />
          <div style={{ fontSize: 8, color: '#666', marginTop: 4 }}>Processo:</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '3px 8px', fontSize: 9, color: '#333' }}>
        {label.printedBy} - {fmtDate(label.printedAt)}
      </div>

      {/* Warning strip */}
      <div style={{ background: '#FFE033', borderTop: '1px solid #e6c800', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 600 }}>
        <span>⚠</span>
        <span>Etiqueta 100x50mm. QR code contém: código e quantidade.</span>
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
          <QRImg value={qrVal} size={64} />
        </div>
        {/* Center: PN + Description */}
        <div style={{ borderRight: '1px solid #ccc', padding: '6px 8px' }}>
          <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: 0.5, wordBreak: 'break-all' }}>{label.partNumber}</div>
          <div style={{ fontSize: 8, color: '#333', marginTop: 2, lineHeight: 1.4 }}>{label.description}</div>
        </div>
        {/* Right: QR */}
        <div style={{ padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QRImg value={qrVal + '_caixa'} size={48} />
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
