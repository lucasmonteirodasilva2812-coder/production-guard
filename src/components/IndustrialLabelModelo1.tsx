import React from 'react';

interface Props {
  label: {
    labelSeqId: string;
    partNumber: string;
    description: string;
    quantity: number;
    msl?: string;
    expiryDate?: string;
    printedBy: string;
    printedAt: string;
    processo?: string;
  };
  onQrLoad?: () => void;
}

// Utiliza API QR para ID e quantidade
function QRImg({ value, size = 80, onLoad }: { value: string; size?: number; onLoad?: () => void }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  return <img src={url} width={size} height={size} alt="QR Code" style={{ display: 'block', background: '#fff', border: '1px solid #000' }} onLoad={onLoad} />;
}

export function IndustrialLabelModelo1({ label, onQrLoad }: Props) {
  // Controle de carregamento dos QRs
  const [qrLoaded, setQrLoaded] = React.useState(0);
  React.useEffect(() => { if (qrLoaded >= 2 && onQrLoad) onQrLoad(); }, [qrLoaded, onQrLoad]);

  return (
    <div style={{ width: 420, height: 210, background: '#fff', color: '#000', border: '2px solid #222', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box', overflow: 'hidden', position: 'relative', pageBreakInside: 'avoid' }}>
      {/* Título e logo */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #222', height: 32 }}>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>ETIQUETA DE IDENTIFICAÇÃO</div>
        <div style={{ width: 120, textAlign: 'right', paddingRight: 10 }}>
          <span style={{ fontWeight: 900, fontSize: 16 }}>grupo<span style={{ fontStyle: 'italic' }}>Multilaser</span></span>
        </div>
      </div>
      <div style={{ display: 'flex', height: 130 }}>
        {/* Esquerda: QR ID */}
        <div style={{ width: 90, borderRight: '2px solid #222', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <QRImg value={label.labelSeqId} size={80} onLoad={() => setQrLoaded(q => q + 1)} />
        </div>
        {/* Centro: PN, descrição */}
        <div style={{ flex: 1, padding: '6px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '2px solid #222' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 2 }}>Part Number:</div>
          <div style={{ fontSize: 24, fontWeight: 900, textAlign: 'center', letterSpacing: 1 }}>{label.partNumber}</div>
          <div style={{ fontSize: 11, textAlign: 'center', marginTop: 2, fontWeight: 500 }}>{label.description}</div>
        </div>
        {/* Direita: Quantidade + QR quantidade */}
        <div style={{ width: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2 }}>QUANTIDADE:</div>
          <QRImg value={String(label.quantity)} size={60} onLoad={() => setQrLoaded(q => q + 1)} />
        </div>
      </div>
      {/* Centro inferior: Quantidade grande */}
      <div style={{ borderTop: '2px solid #222', borderBottom: '2px solid #222', background: '#e5e5e5', textAlign: 'center', fontWeight: 700, fontSize: 13, letterSpacing: 1, padding: '2px 0' }}>Quantidade:</div>
      <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 36, margin: '0 0 0 0', letterSpacing: 2, background: '#e5e5e5', borderBottom: '2px solid #222' }}>{label.quantity.toLocaleString('pt-BR')}</div>
      {/* Rodapé */}
      <div style={{ display: 'flex', fontSize: 11, height: 32 }}>
        <div style={{ width: 90, borderRight: '2px solid #222', padding: '2px 4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>MSL {label.msl || '-'}</div>
        </div>
        <div style={{ flex: 1, borderRight: '2px solid #222', textAlign: 'center', padding: '2px 0' }}>ID: {label.labelSeqId}</div>
        <div style={{ width: 110, padding: '2px 4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'right', fontWeight: 700 }}>PROCESSO:</div>
          <div style={{ textAlign: 'right', fontWeight: 900 }}>{label.processo || '-'}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, textAlign: 'center', marginTop: 1 }}>{label.printedBy} - {label.printedAt}</div>
    </div>
  );
}
