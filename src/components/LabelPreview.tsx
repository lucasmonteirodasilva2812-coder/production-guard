

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
      {/* Header refinado */}
      <div
        style={{
          height: '8mm',
          minHeight: 24,
          maxHeight: 32,
          borderBottom: '1px solid #111',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          overflow: 'hidden',
          boxSizing: 'border-box',
          padding: '0 8px 0 10px',
          gap: 8,
        }}
      >
        <div style={{ flex: 1 }} />
        <div style={{ flex: 6, textAlign: 'left', fontWeight: 700, fontSize: 11.5, letterSpacing: 0.5, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', height: '100%' }}>
          <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>ETIQUETA DE IDENTIFICAÇÃO</span>
        </div>
        <div style={{ flex: 3, textAlign: 'right', fontWeight: 400, fontSize: 10, color: '#222', fontFamily: 'Arial, sans-serif', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
          <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>grupo<span style={{ fontWeight: 700, fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 10 }}>Multilaser</span></span>
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
          <QRImg value={label.partNumber} size={60} />
          {/* Data Venc + MSL refinados */}
          <div style={{ width: '100%', textAlign: 'center', fontSize: 8, marginTop: 2, wordBreak: 'break-word', lineHeight: 1.1, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ border: '1px solid #111', borderRadius: 3, padding: '2px 2px', width: '90%', margin: '0 auto', background: '#f9f9f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 700 }}>Data Venc</span>
              <span style={{ fontWeight: 700 }}>{label.expiryDate || '-'}</span>
            </div>
            <div style={{ fontWeight: 700, marginTop: 4, marginBottom: 0, width: '90%', textAlign: 'center', display: 'block', position: 'relative', top: 2 }}>MSL {label.msl || '-'}</div>
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
            <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 1, lineHeight: 1 }}>Part Number:</div>
            <div
              style={{
                fontWeight: 900,
                fontSize: label.partNumber.length > 16 ? 13 : label.partNumber.length > 12 ? 15 : 17,
                fontFamily: 'Arial Black, Arial, sans-serif',
                letterSpacing: 0.5,
                marginBottom: 1,
                lineHeight: 1.1,
                wordBreak: 'break-all',
                overflow: 'hidden',
                textAlign: 'center',
                maxWidth: '100%',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
              title={label.partNumber}
            >
              {label.partNumber}
            </div>
            <div style={{ fontWeight: 700, fontSize: label.description.length > 32 ? 8 : 9, marginBottom: 1, whiteSpace: 'pre-line', wordBreak: 'break-word', lineHeight: 1.1, maxHeight: 24, overflow: 'hidden', textAlign: 'center' }}>{label.description}</div>
            <div style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', margin: '4px 0 3px 0', padding: '1.5px 0', fontWeight: 700, fontSize: 10, background: '#eaeaea', lineHeight: 1 }}>Quantidade:</div>
            <div style={{ fontWeight: 900, fontSize: 18, fontFamily: 'Arial Black, Arial, sans-serif', marginBottom: 1, lineHeight: 1 }}>{label.quantity}</div>
          </div>
          {/* Rodapé central refinado: ID e usuário/data/hora em células */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', fontSize: 8, marginTop: 1, wordBreak: 'break-word', lineHeight: 1.1, overflow: 'hidden', gap: 2, justifyContent: 'center' }}>
            <div style={{ border: '1px solid #111', borderRadius: 3, padding: '2px 4px', background: '#f9f9f9', fontWeight: 700, minWidth: 38, textAlign: 'center', marginRight: 2 }}>
              ID: <span style={{ fontWeight: 900 }}>{label.labelSeqId}</span>
            </div>
            <div style={{ border: '1px solid #111', borderRadius: 3, padding: '2px 4px', background: '#f9f9f9', fontWeight: 400, minWidth: 70, textAlign: 'left', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 60 }}>{label.printedBy} - {label.printedAt?.split(' ')[0]}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{label.printedAt?.split(' ')[1]}</span>
            </div>
          </div>
        </div>

        {/* Coluna direita QRs */}
        <div
          style={{
            borderLeft: '1px solid #111',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '4mm 0 3mm 0',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ marginTop: 0, marginBottom: 6 }}>
            <QRImg value={label.partNumber} size={66} />
          </div>
          <div style={{ marginTop: 0, marginBottom: 0 }}>
            <QRImg value={String(label.quantity)} size={62} />
          </div>
          {/* Processo no canto inferior direito */}
          <div style={{ position: 'absolute', bottom: 6, right: 0, width: '100%', textAlign: 'right', fontSize: 8.5, fontWeight: 700, color: '#222', paddingRight: 4, background: 'transparent', letterSpacing: 0.2 }}>
            Processo:
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
