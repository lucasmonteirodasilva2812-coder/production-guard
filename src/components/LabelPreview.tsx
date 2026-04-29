

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
  // Layout fiel à referência Excel, 100x50mm (420x210px)
  return (
    <div style={{ width: 420, height: 210, border: '1.5px solid #111', background: '#fff', color: '#111', fontFamily: 'Arial, Arial Black, sans-serif', boxSizing: 'border-box', padding: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Faixa superior */}
      <div style={{ height: 28, borderBottom: '1.5px solid #111', display: 'flex', alignItems: 'center', position: 'relative', background: '#fff' }}>
        <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>ETIQUETA DE IDENTIFICAÇÃO</span>
        <span style={{ position: 'absolute', right: 12, fontWeight: 400, fontSize: 17, color: '#222', fontFamily: 'Arial, sans-serif', letterSpacing: 0.5 }}>grupo<span style={{ fontWeight: 700, fontFamily: 'Arial Black, Arial, sans-serif' }}>Multilaser</span></span>
      </div>
      {/* Corpo principal */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
        {/* Coluna esquerda QR + info */}
        <div style={{ width: 90, borderRight: '1.5px solid #111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 8px 0' }}>
          <QRImg value={label.partNumber} size={80} />
          <div style={{ width: '100%', textAlign: 'center', fontSize: 10, marginTop: 6 }}>
            <div style={{ fontWeight: 700, borderBottom: '1px solid #111', marginBottom: 2, paddingBottom: 1 }}>Data Venc</div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{label.expiryDate || '-'}</div>
            <div style={{ fontWeight: 700 }}>MSL {label.msl || '-'}</div>
          </div>
        </div>
        {/* Coluna central */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 8px 0', background: '#f7f7f7' }}>
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>Part Number:</div>
            <div style={{ fontWeight: 900, fontSize: 26, fontFamily: 'Arial Black, Arial, sans-serif', letterSpacing: 1, marginBottom: 2 }}>{label.partNumber}</div>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2, whiteSpace: 'pre-line', wordBreak: 'break-word', lineHeight: 1.1 }}>{label.description}</div>
            <div style={{ borderTop: '1.5px solid #111', borderBottom: '1.5px solid #111', margin: '8px 0 6px 0', padding: '2px 0', fontWeight: 700, fontSize: 17, background: '#eaeaea' }}>Quantidade:</div>
            <div style={{ fontWeight: 900, fontSize: 36, fontFamily: 'Arial Black, Arial, sans-serif', marginBottom: 2 }}>{label.quantity}</div>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 11, marginTop: 2 }}>
            <div style={{ fontWeight: 700, color: '#222', marginBottom: 1 }}>ID: <span style={{ fontWeight: 900 }}>{label.labelSeqId}</span></div>
            <div style={{ fontWeight: 400, color: '#222', marginBottom: 1 }}>{label.printedBy} - {label.printedAt}</div>
          </div>
        </div>
        {/* Coluna direita QRs + processo */}
        <div style={{ width: 90, borderLeft: '1.5px solid #111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 8px 0' }}>
          <QRImg value={label.partNumber} size={70} />
          <QRImg value={String(label.quantity)} size={70} />
          <div style={{ width: '100%', textAlign: 'center', fontSize: 10, marginTop: 4 }}>
            <div style={{ fontWeight: 700, borderBottom: '1px solid #111', marginBottom: 2, paddingBottom: 1 }}>Processo:</div>
            <div style={{ fontWeight: 900, fontSize: 13 }}>{label.compositeId || '-'}</div>
          </div>
        </div>
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
