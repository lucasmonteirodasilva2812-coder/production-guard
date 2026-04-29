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

// ─── Seleção automática do modelo ─────────────────────────────────────────────
export function LabelPreview({ label, onQrLoad }: { label: LabelData, onQrLoad?: () => void }) {
  if (label.labelType === 'caixa') {
    return <IndustrialLabelModelo2 label={label as any} onQrLoad={onQrLoad} />;
  }
  // Modelo 1 padrão
  return <IndustrialLabelModelo1 label={label as any} onQrLoad={onQrLoad} />;
}
// Removido texto solto e spans fora do JSX. Toda a renderização agora é feita apenas pelos componentes IndustrialLabelModelo1/2.
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

// ─── Seleção automática do modelo ─────────────────────────────────────────────
export function LabelPreview({ label, onQrLoad }: { label: LabelData, onQrLoad?: () => void }) {
  if (label.labelType === 'caixa') {
    return <IndustrialLabelModelo2 label={label as any} onQrLoad={onQrLoad} />;
  }
  // Modelo 1 padrão
  return <IndustrialLabelModelo1 label={label as any} onQrLoad={onQrLoad} />;
}
