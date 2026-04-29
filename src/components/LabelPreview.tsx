

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
      {/* Header refinado centralizado, sem sobreposição */}
      <div
        style={{
          height: '8mm',
          minHeight: 24,
          maxHeight: 32,
          borderBottom: '1px solid #111',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          overflow: 'hidden',
          boxSizing: 'border-box',
          padding: '0 8px 0 10px',
          gap: 0,
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, display: 'flex', alignItems: 'center', height: '100%' }} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 11, letterSpacing: 0.5, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
          <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>ETIQUETA DE IDENTIFICAÇÃO</span>
        </div>
        <div style={{ position: 'absolute', right: 8, top: 0, bottom: 0, display: 'flex', alignItems: 'center', height: '100%' }}>
          <span style={{ fontWeight: 400, fontSize: 9, color: '#222', fontFamily: 'Arial, sans-serif', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', maxWidth: 90 }}>
            grupo<span style={{ fontWeight: 700, fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 9 }}>Multilaser</span>
          </span>
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
          <div style={{ marginTop: 2, marginBottom: 0 }}>
            <QRImg value={label.partNumber} size={70} />
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, justifyContent: 'flex-end', flex: 1 }}>
            <div style={{ border: '1px solid #111', borderRadius: 2, padding: '1.5px 3px', width: '80%', margin: '0 auto', background: '#f9f9f9', marginBottom: 2, marginTop: 'auto', fontSize: 7.5, lineHeight: 1.1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 700 }}>Data Venc</span>
              <span style={{ fontWeight: 700 }}>{label.expiryDate || '-'}</span>
            </div>
            <div style={{ border: '1px solid #111', borderRadius: 2, padding: '1.5px 3px', width: '80%', margin: '0 auto', background: '#f9f9f9', fontWeight: 700, textAlign: 'center', display: 'block', marginBottom: 2, fontSize: 7.5, lineHeight: 1.1 }}>MSL {label.msl || '-'}</div>
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
          {/* Bloco superior: Part Number, código, descrição em célula Excel mais compacta */}
          <div style={{ width: '100%', textAlign: 'center', overflow: 'hidden', border: '1px solid #111', borderRadius: 3, background: '#fff', marginBottom: 2, padding: '2.5px 2px 1.5px 2px', boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, fontSize: 8, marginBottom: 1, lineHeight: 1 }}>Part Number:</div>
            <div
              style={{
                fontWeight: 900,
                fontSize: label.partNumber.length > 16 ? 12 : label.partNumber.length > 12 ? 13 : 15,
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
            <div style={{ fontWeight: 700, fontSize: label.description.length > 32 ? 7 : 8, marginBottom: 1, whiteSpace: 'pre-line', wordBreak: 'break-word', lineHeight: 1.1, maxHeight: 18, overflow: 'hidden', textAlign: 'center' }}>{label.description}</div>
          </div>
          {/* Bloco meio: Quantidade em célula Excel mais compacta */}
          <div style={{ width: '100%', border: '1px solid #111', borderRadius: 3, background: '#eaeaea', marginBottom: 2, padding: '1.5px 0', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 8, lineHeight: 1 }}>Quantidade:</div>
            <div style={{ fontWeight: 900, fontSize: 15, fontFamily: 'Arial Black, Arial, sans-serif', lineHeight: 1 }}>{label.quantity}</div>
          </div>
          {/* ID igual usuário/data/hora */}
          <div style={{ width: '100%', fontSize: 8, marginTop: 2, wordBreak: 'break-word', lineHeight: 1.1, overflow: 'hidden', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #eee', padding: '2px 4px 0 4px', background: 'transparent' }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center', width: '100%' }}>ID: <span style={{ fontWeight: 900 }}>{label.labelSeqId}</span></span>
          </div>
          {/* Usuário/data/hora na última linha, largura total, sem letras extras */}
          <div style={{ width: '100%', fontSize: 8, marginTop: 0, wordBreak: 'break-word', lineHeight: 1.1, overflow: 'hidden', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #eee', padding: '2px 4px 0 4px', background: 'transparent' }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center', width: '100%' }}>{label.printedBy} - {label.printedAt}</span>
          </div>
        </div>

        {/* Coluna direita QRs e Processo em células Excel */}
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
            gap: 8,
          }}
        >
          <div style={{ border: '1px solid #111', borderRadius: 3, background: '#fff', padding: 2, marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60 }}>
            <QRImg value={label.partNumber} size={60} />
          </div>
          <div style={{ border: '1px solid #111', borderRadius: 3, background: '#fff', padding: 2, marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60 }}>
            <QRImg value={String(label.quantity)} size={60} />
          </div>
          {/* Processo em célula Excel no canto inferior direito */}
          <div style={{ position: 'absolute', bottom: 6, right: 4, width: 60, border: '1px solid #111', borderRadius: 3, background: '#f9f9f9', padding: '2px 0 8px 0', fontSize: 8.5, fontWeight: 700, color: '#222', textAlign: 'center', letterSpacing: 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
