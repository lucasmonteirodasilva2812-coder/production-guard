

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
