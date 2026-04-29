

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
  // Layout industrial 100x50mm, grid 3 colunas, tudo dentro da área
  return (
    <div
      style={{
        width: '100mm',
        height: '50mm',
        border: '1.2px solid #111',
        background: '#fff',
        color: '#111',
        fontFamily: 'Arial, Arial Black, sans-serif',
        boxSizing: 'border-box',
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '8mm',
          minHeight: 24,
          maxHeight: 32,
          borderBottom: '1px solid #111',
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 1fr',
          alignItems: 'center',
          background: '#fff',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, paddingLeft: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, letterSpacing: 1, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          ETIQUETA DE IDENTIFICAÇÃO
        </div>
        <div style={{ textAlign: 'right', paddingRight: 8, fontWeight: 400, fontSize: 13, color: '#222', fontFamily: 'Arial, sans-serif', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          grupo<span style={{ fontWeight: 700, fontFamily: 'Arial Black, Arial, sans-serif' }}>Multilaser</span>
        </div>
      </div>

      {/* Corpo principal - Grid 3 colunas */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '18% 64% 18%',
          height: 'calc(50mm - 8mm)',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Coluna esquerda QR + info */}
        <div
          style={{
            borderRight: '1px solid #111',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4mm 0 3mm 0',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <QRImg value={label.partNumber} size={54} />
          <div style={{ width: '100%', textAlign: 'center', fontSize: 8.5, marginTop: 2, wordBreak: 'break-word', lineHeight: 1.1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, borderBottom: '1px solid #111', marginBottom: 1, paddingBottom: 1 }}>Data Venc</div>
            <div style={{ fontWeight: 700, marginBottom: 1 }}>{label.expiryDate || '-'}</div>
            <div style={{ fontWeight: 700 }}>MSL {label.msl || '-'}</div>
          </div>
        </div>

        {/* Coluna central */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '3mm 0 2mm 0',
            background: '#f7f7f7',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: '100%', textAlign: 'center', overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 1, lineHeight: 1 }}>Part Number:</div>
            <div style={{ fontWeight: 900, fontSize: 18, fontFamily: 'Arial Black, Arial, sans-serif', letterSpacing: 1, marginBottom: 1, lineHeight: 1.1, wordBreak: 'break-word', overflow: 'hidden' }}>{label.partNumber}</div>
            <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 1, whiteSpace: 'pre-line', wordBreak: 'break-word', lineHeight: 1.1, maxHeight: 28, overflow: 'hidden' }}>{label.description}</div>
            <div style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', margin: '4px 0 3px 0', padding: '1.5px 0', fontWeight: 700, fontSize: 11, background: '#eaeaea', lineHeight: 1 }}>Quantidade:</div>
            <div style={{ fontWeight: 900, fontSize: 22, fontFamily: 'Arial Black, Arial, sans-serif', marginBottom: 1, lineHeight: 1 }}>{label.quantity}</div>
          </div>
          {/* Rodapé central */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 8, marginTop: 1, wordBreak: 'break-word', lineHeight: 1.1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, color: '#222', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ID: <span style={{ fontWeight: 900 }}>{label.labelSeqId}</span>
            </div>
            <div style={{ fontWeight: 400, color: '#222', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {label.printedBy} - {label.printedAt}
            </div>
          </div>
        </div>

        {/* Coluna direita QRs + processo */}
        <div
          style={{
            borderLeft: '1px solid #111',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4mm 0 3mm 0',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <QRImg value={label.partNumber} size={44} />
          <QRImg value={String(label.quantity)} size={44} />
          <div style={{ width: '100%', textAlign: 'center', fontSize: 8.5, marginTop: 2, wordBreak: 'break-word', lineHeight: 1.1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, borderBottom: '1px solid #111', marginBottom: 1, paddingBottom: 1 }}>Processo:</div>
            <div style={{ fontWeight: 900, fontSize: 10 }}>{label.compositeId || '-'}</div>
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
