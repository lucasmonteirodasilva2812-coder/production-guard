
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
export function QRImg({ value, size = 72, onLoad }: { value: string; size?: number; onLoad?: () => void }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  return <img src={url} width={size} height={size} alt="QR Code" style={{ display: 'block', background: '#fff', border: '1px solid #000' }} onLoad={onLoad} />;
}

// MODELO 1 — Etiqueta de Produto
export function IndustrialLabelModelo1({ label, onQrLoad }: { label: LabelData, onQrLoad?: () => void }) {
  // Exemplo simples, ajuste conforme layout real
  return (
    <div style={{ width: 420, height: 210, border: '2px solid #222', background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box', padding: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>ETIQUETA DE IDENTIFICAÇÃO DE PRODUTO</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <QRImg value={label.partNumber} size={64} />
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{label.partNumber}</div>
          <div style={{ fontSize: 12 }}>{label.description}</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>QTD: <b>{label.quantity}</b></div>
          <div style={{ fontSize: 10, marginTop: 2 }}>ID: {label.labelSeqId}</div>
        </div>
        <QRImg value={label.partNumber} size={64} />
      </div>
      <div style={{ fontSize: 10, marginTop: 8 }}>MSL: {label.msl || '-'}</div>
      <div style={{ fontSize: 10 }}>Vencimento: {label.expiryDate || '-'}</div>
    </div>
  );
}

// MODELO 2 — Etiqueta de Caixa
export function IndustrialLabelModelo2({ label, onQrLoad }: { label: LabelData, onQrLoad?: () => void }) {
  return (
    <div style={{ width: 420, height: 210, border: '2px solid #222', background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box', padding: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>ETIQUETA DE IDENTIFICAÇÃO DE CAIXA</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <QRImg value={label.partNumber} size={64} />
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{label.partNumber}</div>
          <div style={{ fontSize: 12 }}>{label.description}</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>QTD: <b>{label.quantity}</b></div>
          <div style={{ fontSize: 10, marginTop: 2 }}>ID: {label.labelSeqId}</div>
        </div>
        <QRImg value={label.partNumber} size={64} />
      </div>
      <div style={{ fontSize: 10, marginTop: 8 }}>MSL: {label.msl || '-'}</div>
      <div style={{ fontSize: 10 }}>Processo: -</div>
    </div>
  );
}

// Seleção automática do modelo
export function LabelPreview({ label, onQrLoad }: { label: LabelData, onQrLoad?: () => void }) {
  if (label.labelType === 'caixa') {
    return <IndustrialLabelModelo2 label={label} onQrLoad={onQrLoad} />;
  }
  return <IndustrialLabelModelo1 label={label} onQrLoad={onQrLoad} />;
}
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
