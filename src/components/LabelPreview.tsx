

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

function QRImg({ value, size = 72, onLoad }: { value: string; size?: number; onLoad?: () => void }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt="QR Code"
      style={{ display: 'block', background: '#fff', border: '1px solid #000' }}
      onLoad={onLoad}
    />
  );
}

function IndustrialLabelModelo1({ label }: { label: LabelData }) {
  // Layout 100x50mm (420x210px), máxima fidelidade macro Excel
  return (
    <div style={{ width: 420, height: 210, border: '2.5px solid #111', background: '#fff', color: '#111', fontFamily: 'Arial, Arial Black, sans-serif', boxSizing: 'border-box', padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Main Row */}
      <div style={{ display: 'flex', flex: 1, alignItems: 'stretch', padding: '0 0 0 0' }}>
        {/* QR principal esquerdo (80x80) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 100, height: '100%' }}>
          <QRImg value={label.partNumber} size={80} />
        </div>
        {/* Centro: dados do produto */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 0 12px 8px', gap: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: 1, lineHeight: 1.1, fontFamily: 'Arial Black, Arial, sans-serif', marginBottom: 2 }}>{label.partNumber}</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#222', marginBottom: 6 }}>{label.description}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>QTD:</span>
            <span style={{ fontWeight: 900, fontSize: 26, color: '#111', letterSpacing: 1 }}>{label.quantity}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#444', marginBottom: 2 }}>ID: {label.labelSeqId}</div>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#444', marginBottom: 2 }}>MSL: {label.msl || '-'}</div>
        </div>
        {/* QR codes à direita (superior produto, inferior quantidade, ambos 70x70) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', width: 90, padding: '12px 8px 12px 0', gap: 8 }}>
          <QRImg value={label.partNumber} size={70} />
          <QRImg value={String(label.quantity)} size={70} />
        </div>
      </div>
      {/* Rodapé: operador + data */}
      <div style={{ borderTop: '1.5px solid #e6e6e6', padding: '4px 12px', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: '#222', justifyContent: 'space-between', background: '#fafafa' }}>
        <span>Operador: {label.printedBy}</span>
        <span>{label.printedAt}</span>
      </div>
    </div>
  );
}

function IndustrialLabelModelo2({ label }: { label: LabelData }) {
  // Layout 100x50mm (420x210px), máxima fidelidade macro Excel (caixa)
  return (
    <div style={{ width: 420, height: 210, border: '2.5px solid #111', background: '#fff', color: '#111', fontFamily: 'Arial, Arial Black, sans-serif', boxSizing: 'border-box', padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flex: 1, alignItems: 'stretch', padding: '0 0 0 0' }}>
        {/* QR produto (85x85) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 110, height: '100%' }}>
          <QRImg value={label.partNumber} size={85} />
        </div>
        {/* Centro: dados da caixa */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 0 12px 8px', gap: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: 1, lineHeight: 1.1, fontFamily: 'Arial Black, Arial, sans-serif', marginBottom: 2 }}>{label.partNumber}</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#222', marginBottom: 6 }}>{label.description}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>QTD:</span>
            <span style={{ fontWeight: 900, fontSize: 24, color: '#111', letterSpacing: 1 }}>{label.quantity}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#444', marginBottom: 2 }}>ID: {label.labelSeqId}</div>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#444', marginBottom: 2 }}>MSL: {label.msl || '-'}</div>
        </div>
        {/* QR quantidade (85x85) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 110, height: '100%' }}>
          <QRImg value={String(label.quantity)} size={85} />
        </div>
      </div>
      {/* Rodapé: operador + data */}
      <div style={{ borderTop: '1.5px solid #e6e6e6', padding: '4px 12px', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: '#222', justifyContent: 'space-between', background: '#fafafa' }}>
        <span>Operador: {label.printedBy}</span>
        <span>{label.printedAt}</span>
      </div>
    </div>
  );
}

interface LabelPreviewProps {
  label: LabelData;
}

const LabelPreview: React.FC<LabelPreviewProps> = ({ label }) => {
  if (label.labelType === 'caixa') {
    return <IndustrialLabelModelo2 label={label} />;
  }
  return <IndustrialLabelModelo1 label={label} />;
};

export default LabelPreview;
