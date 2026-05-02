// Função para formatar data e hora dd/mm/aaaa hh:mm
function formatDateTime(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();

  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}



import React from 'react';
import { ClipboardList, Calendar, Package, FileText, User } from 'lucide-react';


// Função para formatar data dd/mm/aaaa (corrigida, topo do arquivo)
function formatDate(dateStr?: string) {
  if (!dateStr) return '';

  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

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
  shipmentName?: string;
}

function QRImg({ value, size = 72, onLoad }: { value: string; size?: number; onLoad?: () => void }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt="QR Code"
      style={{ display: 'block', background: '#fff' }}
      onLoad={onLoad}
    />
  );
}

function IndustrialLabelModelo1({ label }: { label: LabelData }) {
  const DARK_BLUE = '#1a3560';
  const LIGHT_BLUE_BG = '#eef4ff';
  const BORDER = '#c8d8ee';

  return (
    <div style={{
      width: '100mm', height: '50mm',
      border: `1.5px solid ${DARK_BLUE}`,
      background: '#fff', color: '#111',
      fontFamily: 'Arial, Arial Black, sans-serif',
      boxSizing: 'border-box', padding: 0,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      userSelect: 'none',
    }}>

      {/* ── HEADER ── */}
      <div style={{
        height: '10mm', flexShrink: 0,
        borderBottom: `1.5px solid ${DARK_BLUE}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 8px 0 6px', background: '#fff',
      }}>
        {/* Shield logo */}
        <div style={{
          width: 26, height: 26, flexShrink: 0,
          background: DARK_BLUE,
          clipPath: 'polygon(50% 0%, 100% 18%, 100% 58%, 50% 100%, 0% 58%, 0% 18%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>✦</span>
        </div>
        {/* Title */}
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 900, fontSize: 11, color: DARK_BLUE, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          ETIQUETA DE IDENTIFICAÇÃO
        </div>
        {/* Brand */}
        <div style={{ fontSize: 9, flexShrink: 0 }}>
          <span style={{ fontWeight: 400, color: '#333' }}>grupo</span>
          <span style={{ fontWeight: 900, color: '#111', fontFamily: 'Arial Black, Arial, sans-serif' }}>Multilaser</span>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '21% 54% 25%', minHeight: 0, overflow: 'hidden' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* QR label */}
          <div style={{ background: DARK_BLUE, color: '#fff', fontSize: 5.5, fontWeight: 700, textAlign: 'center', padding: '2px 1px', letterSpacing: 0.2, flexShrink: 0 }}>
            ID; PARTNUMBER; QTD
          </div>
          {/* QR code */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0', flexShrink: 0 }}>
            <QRImg value={`${label.compositeId || label.labelSeqId};${label.partNumber};${label.quantity}`} size={60} />
          </div>
          {/* Info boxes */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 2px 2px 2px', gap: 1.5 }}>
            {/* PROCESSO */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: '1.5px 2px', display: 'flex', alignItems: 'center', gap: 2, background: '#fafbff' }}>
              <ClipboardList size={10} color={DARK_BLUE} />
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontSize: 5, color: '#777', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1 }}>Processo</div>
                <div style={{ fontSize: 7, fontWeight: 900, color: DARK_BLUE, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label.shipmentName || '-'}</div>
              </div>
            </div>
            {/* DATA VENC */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: '1.5px 2px', display: 'flex', alignItems: 'center', gap: 2, background: '#fafbff' }}>
              <Calendar size={10} color={DARK_BLUE} />
              <div>
                <div style={{ fontSize: 5, color: '#777', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1 }}>Data Venc.</div>
                <div style={{ fontSize: 7, fontWeight: 700, color: '#333', lineHeight: 1.1 }}>{label.expiryDate ? formatDate(label.expiryDate) : '-'}</div>
              </div>
            </div>
            {/* MSL */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: '1.5px 2px', display: 'flex', alignItems: 'center', gap: 2, background: '#fafbff' }}>
              <Package size={10} color={DARK_BLUE} />
              <div>
                <div style={{ fontSize: 5, color: '#777', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1 }}>MSL</div>
                <div style={{ fontSize: 8, fontWeight: 900, color: '#333', lineHeight: 1.1 }}>{label.msl || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '3px 6px 2px 6px', overflow: 'hidden' }}>
          {/* Part Number */}
          <div style={{ textAlign: 'center', marginBottom: 2 }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: DARK_BLUE, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1 }}>Part Number:</div>
            <div style={{ fontWeight: 900, fontSize: label.partNumber.length > 16 ? 13 : label.partNumber.length > 12 ? 15 : 18, fontFamily: 'Arial Black, Arial, sans-serif', color: '#111', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {label.partNumber}
            </div>
            <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 1, paddingTop: 1, fontSize: 7, color: '#555', fontWeight: 500, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {label.description}
            </div>
          </div>
          {/* Quantidade */}
          <div style={{ background: LIGHT_BLUE_BG, border: `1px solid ${BORDER}`, borderRadius: 3, padding: '1px 4px', textAlign: 'center', marginBottom: 2 }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: DARK_BLUE, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1 }}>Quantidade:</div>
            <div style={{ fontWeight: 900, fontSize: 17, fontFamily: 'Arial Black, Arial, sans-serif', color: '#111', lineHeight: 1.1 }}>
              {label.quantity.toLocaleString('pt-BR')}
            </div>
          </div>
          {/* ID row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 'auto', borderTop: `1px solid ${BORDER}`, paddingTop: 1.5 }}>
            <FileText size={9} color={DARK_BLUE} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 8, fontWeight: 900, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ID: {label.compositeId || label.labelSeqId}
            </span>
          </div>
          {/* User + Date row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${BORDER}`, paddingTop: 1.5, marginTop: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
              <User size={9} color='#555' style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 7, fontWeight: 700, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label.printedBy}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, marginLeft: 4 }}>
              <Calendar size={9} color='#555' style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 7, fontWeight: 700, color: '#333', whiteSpace: 'nowrap' }}>{formatDateTime(label.printedAt)}</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ borderLeft: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* PART NUMBER QR */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: DARK_BLUE, color: '#fff', fontSize: 6, fontWeight: 700, textAlign: 'center', padding: '2px 2px', letterSpacing: 0.3, flexShrink: 0 }}>
              PART NUMBER
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              <QRImg value={label.partNumber} size={65} />
            </div>
          </div>
          {/* QUANTIDADE QR */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ background: DARK_BLUE, color: '#fff', fontSize: 6, fontWeight: 700, textAlign: 'center', padding: '2px 2px', letterSpacing: 0.3, flexShrink: 0 }}>
              QUANTIDADE
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              <QRImg value={String(label.quantity)} size={65} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
function IndustrialLabelModelo2({ label }: { label: LabelData }) {
  // Layout 100x50mm (420x210px), máxima fidelidade macro Excel (caixa)
  // Layout caixa: coluna esquerda com QRs, centro com dados, Processo abaixo, estilo igual Modelo1
  return (
    <div style={{ width: 420, height: 210, border: '2.5px solid #111', background: '#fff', color: '#111', fontFamily: 'Arial, Arial Black, sans-serif', boxSizing: 'border-box', padding: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '18% 64% 18%', height: 'calc(100% - 38px)', minHeight: 0, flex: 1 }}>
        {/* Coluna esquerda: QRs empilhados */}
        <div style={{ borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '12px 0 0 0', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ border: '1px solid #111', borderRadius: 3, background: '#fff', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54, marginBottom: 10 }}>
            <QRImg value={label.partNumber} size={54} />
          </div>
          <div style={{ border: '1px solid #111', borderRadius: 3, background: '#fff', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54 }}>
            <QRImg value={String(label.quantity)} size={54} />
          </div>
        </div>
        {/* Coluna central: dados principais */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 0', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ width: '90%', margin: '0 auto', textAlign: 'center', overflow: 'hidden', border: '1px solid #111', borderRadius: 3, background: '#fff', marginBottom: 4, padding: '2px 2px 1px 2px', boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 1, lineHeight: 1 }}>Part Number:</div>
            <div style={{ fontWeight: 900, fontSize: label.partNumber.length > 16 ? 13 : label.partNumber.length > 12 ? 14 : 16, fontFamily: 'Arial Black, Arial, sans-serif', letterSpacing: 0.5, marginBottom: 1, lineHeight: 1.1, wordBreak: 'break-all', overflow: 'hidden', textAlign: 'center', maxWidth: '100%', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginLeft: 'auto', marginRight: 'auto' }} title={label.partNumber}>{label.partNumber}</div>
            <div style={{ fontWeight: 700, fontSize: label.description.length > 32 ? 8 : 9, marginBottom: 1, whiteSpace: 'pre-line', wordBreak: 'break-word', lineHeight: 1.1, maxHeight: 18, overflow: 'hidden', textAlign: 'center' }}>{label.description}</div>
          </div>
          <div style={{ width: '90%', margin: '0 auto', border: '1px solid #111', borderRadius: 3, background: '#eaeaea', marginBottom: 4, padding: '1px 0', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 10, lineHeight: 1 }}>Quantidade:</div>
            <div style={{ fontWeight: 900, fontSize: 16, fontFamily: 'Arial Black, Arial, sans-serif', lineHeight: 1 }}>{label.quantity}</div>
          </div>
          <div style={{ width: '90%', margin: '0 auto', border: '1px solid #111', borderRadius: 3, background: '#f9f9f9', marginBottom: 4, padding: '1px 0', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 10, lineHeight: 1 }}>MSL:</div>
            <div style={{ fontWeight: 900, fontSize: 12, fontFamily: 'Arial Black, Arial, sans-serif', lineHeight: 1 }}>{label.msl || '-'}</div>
          </div>
        </div>
        {/* Coluna direita: Processo, alinhado embaixo */}
        <div style={{ borderLeft: '1px solid #111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: 54, border: '1px solid #111', borderRadius: 3, background: '#f9f9f9', padding: '2px 0 8px 0', fontSize: 8.5, fontWeight: 700, color: '#222', textAlign: 'center', letterSpacing: 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 10, marginTop: 0, alignSelf: 'flex-end' }}>
            Processo:
          </div>
        </div>
      </div>
      {/* Rodapé: operador + data/hora, igual Modelo1 */}
      <div style={{ borderTop: '1.5px solid #e6e6e6', padding: '4px 12px', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: '#222', justifyContent: 'space-between', background: '#fafafa', height: 38 }}>
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
