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
  const BLACK = '#000';
  const LIGHT_BG = '#f5f5f5';

  return (
    <div style={{
      width: '100mm', height: '50mm',
      border: '2px solid #000',
      background: '#fff', color: '#111',
      fontFamily: 'Arial, Arial Black, sans-serif',
      boxSizing: 'border-box', padding: 0,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      userSelect: 'none',
    }}>

      {/* ── HEADER ── */}
      <div style={{
        height: '10mm', flexShrink: 0,
        borderBottom: '2px solid #000',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 8px 0 6px', background: '#fff',
      }}>
        {/* Multilaser M logo */}
        <svg width="26" height="26" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
          <rect width="100" height="100" rx="18" fill="#1565c0"/>
          <path
            d="M 12 80 L 12 38 Q 12 12 31 12 Q 50 12 50 38 Q 50 12 69 12 Q 88 12 88 38 L 88 80"
            fill="none"
            stroke="#000"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Title */}
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 900, fontSize: 11, color: BLACK, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          ETIQUETA DE IDENTIFICAÇÃO
        </div>
        {/* Brand */}
        <div style={{ fontSize: 9, flexShrink: 0 }}>
          <span style={{ fontWeight: 400, color: '#333' }}>grupo</span>
          <span style={{ fontWeight: 900, color: '#111', fontFamily: 'Arial Black, Arial, sans-serif' }}>Multilaser</span>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '22% 52% 26%', minHeight: 0, overflow: 'hidden' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ borderRight: '1.5px solid #000', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', padding: '2px 1px' }}>
          {/* QR box com label no topo */}
          <div style={{ border: '1.5px solid #000', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', width: '100%', marginBottom: 2 }}>
            <div style={{ background: BLACK, color: '#fff', fontSize: 5, fontWeight: 700, textAlign: 'center', padding: '2px 1px', letterSpacing: 0.2, width: '100%', boxSizing: 'border-box' }}>
              ID;PARTNUMBER;QTD
            </div>
            <div style={{ padding: '2px 0' }}>
              <QRImg value={`${label.compositeId || label.labelSeqId};${label.partNumber};${label.quantity}`} size={60} />
            </div>
          </div>
          {/* Info boxes — centralizados */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 1.5, width: '100%' }}>
            {/* PROCESSO */}
            <div style={{ border: '1px solid #000', borderRadius: 2, padding: '2px 1px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
              <ClipboardList size={9} color={BLACK} />
              <div style={{ fontSize: 4.5, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.2, lineHeight: 1, textAlign: 'center' }}>Processo</div>
              <div style={{ fontSize: 6, fontWeight: 900, color: BLACK, lineHeight: 1.1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', paddingLeft: 2, paddingRight: 2, boxSizing: 'border-box' }}>{label.shipmentName || '-'}</div>
            </div>
            {/* DATA VENC */}
            <div style={{ border: '1px solid #000', borderRadius: 2, padding: '2px 1px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
              <Calendar size={9} color={BLACK} />
              <div style={{ fontSize: 4.5, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.2, lineHeight: 1, textAlign: 'center' }}>Data Venc.</div>
              <div style={{ fontSize: 6, fontWeight: 700, color: '#333', lineHeight: 1.1, textAlign: 'center' }}>{label.expiryDate ? formatDate(label.expiryDate) : '-'}</div>
            </div>
            {/* MSL */}
            <div style={{ border: '1px solid #000', borderRadius: 2, padding: '2px 1px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
              <Package size={9} color={BLACK} />
              <div style={{ fontSize: 4.5, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.2, lineHeight: 1, textAlign: 'center' }}>MSL</div>
              <div style={{ fontSize: 7, fontWeight: 900, color: '#333', lineHeight: 1.1, textAlign: 'center' }}>{label.msl || '-'}</div>
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3px 6px 2px 6px', overflow: 'hidden' }}>
          {/* Part Number */}
          <div style={{ textAlign: 'center', width: '100%', marginBottom: 4 }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: BLACK, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1 }}>Part Number:</div>
            <div style={{ fontWeight: 900, fontSize: label.partNumber.length > 16 ? 13 : label.partNumber.length > 12 ? 15 : 18, fontFamily: 'Arial Black, Arial, sans-serif', color: '#111', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {label.partNumber}
            </div>
            <div style={{ borderTop: '1px solid #ccc', marginTop: 1, paddingTop: 1, fontSize: 7, color: '#555', fontWeight: 500, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {label.description}
            </div>
          </div>
          {/* Divisor */}
          <div style={{ width: '85%', borderTop: '1.5px solid #000', marginBottom: 4 }} />
          {/* Quantidade */}
          <div style={{ background: LIGHT_BG, border: '1px solid #000', borderRadius: 3, padding: '1px 4px', textAlign: 'center', marginBottom: 2, width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: BLACK, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1 }}>Quantidade:</div>
            <div style={{ fontWeight: 900, fontSize: 17, fontFamily: 'Arial Black, Arial, sans-serif', color: '#111', lineHeight: 1.1 }}>
              {label.quantity.toLocaleString('pt-BR')}
            </div>
          </div>
          {/* ID row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 'auto', borderTop: '1px solid #ccc', paddingTop: 1.5, width: '100%' }}>
            <FileText size={9} color={BLACK} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 8, fontWeight: 900, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ID: {label.compositeId || label.labelSeqId}
            </span>
          </div>
          {/* User + Date row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: 1.5, marginTop: 1, width: '100%' }}>
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
        <div style={{ borderLeft: '1.5px solid #000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* PART NUMBER QR */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px 2px 1px 2px' }}>
            <div style={{ border: '1.5px solid #000', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', width: '100%' }}>
              <div style={{ background: BLACK, color: '#fff', fontSize: 6, fontWeight: 700, textAlign: 'center', padding: '2px', width: '100%', boxSizing: 'border-box', letterSpacing: 0.3 }}>
                PART NUMBER
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                <QRImg value={label.partNumber} size={50} />
              </div>
            </div>
          </div>
          {/* QUANTIDADE QR */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1px 2px 2px 2px', borderTop: '1.5px solid #000' }}>
            <div style={{ border: '1.5px solid #000', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', width: '100%' }}>
              <div style={{ background: BLACK, color: '#fff', fontSize: 6, fontWeight: 700, textAlign: 'center', padding: '2px', width: '100%', boxSizing: 'border-box', letterSpacing: 0.3 }}>
                QUANTIDADE
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                <QRImg value={String(label.quantity)} size={50} />
              </div>
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
