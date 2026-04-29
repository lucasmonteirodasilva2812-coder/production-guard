

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
  // Layout 100x50mm (420x210px), QR grande à esquerda, dois QRs à direita, textos fortes, alinhamento industrial
  return (
    <div style={{ width: 420, height: 210, border: '2.5px solid #111', background: '#fff', color: '#111', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box', padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1.5px solid #222', height: 38, padding: '0 16px', background: '#f7f7f7' }}>
        <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', flex: 1 }}>ETIQUETA DE IDENTIFICAÇÃO DE PRODUTO</span>
        <span style={{ fontWeight: 900, fontSize: 15, fontStyle: 'italic', color: '#222', letterSpacing: 1 }}>grupoMultilaser</span>
      </div>
      {/* Main Row */}
      <div style={{ display: 'flex', flex: 1, alignItems: 'stretch', padding: '0 0 0 8px' }}>
        {/* QR grande à esquerda */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 90, height: '100%' }}>
          <QRImg value={label.partNumber} size={90} />
        </div>
        {/* Centro: dados do produto */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 0 8px 12px', gap: 2 }}>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: 1, lineHeight: 1.1 }}>{label.partNumber}</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#222', marginBottom: 2 }}>{label.description}</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>QTD:</span>
            <span style={{ fontWeight: 900, fontSize: 28, color: '#111', letterSpacing: 1 }}>{label.quantity}</span>
            <span style={{ fontWeight: 700, fontSize: 11, color: '#444', marginLeft: 10 }}>ID: {label.labelSeqId}</span>
          </div>
        </div>
        {/* QR codes à direita */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', width: 70, padding: '8px 8px 8px 0' }}>
          {/* QR superior: produto */}
          <QRImg value={label.partNumber} size={48} />
          {/* QR inferior: quantidade */}
          <QRImg value={String(label.quantity)} size={48} />
        </div>
      </div>
      {/* Faixa de aviso */}
      <div style={{ background: '#FFE033', borderTop: '1.5px solid #e6c800', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#222' }}>
        <span style={{ fontSize: 16 }}>⚠</span>
        <span>Etiqueta 100x50mm. QR code contém: código e quantidade.</span>
      </div>
    </div>
  );
}

function IndustrialLabelModelo2({ label }: { label: LabelData }) {
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
