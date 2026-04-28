import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import QRCode from 'qrcode.react';

export default function PrintLabel() {
  const { id } = useParams();
  const labelRef = useRef<HTMLDivElement>(null);

  const { data: label, isLoading, error } = useQuery({
    queryKey: ['label', id],
    queryFn: () => api.getLabelById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (label) {
      window.print();
    }
    window.onafterprint = () => window.close();
  }, [label]);

  if (isLoading) return <div>Carregando...</div>;
  if (error || !label) return <div>Etiqueta não encontrada.</div>;

  return (
    <div
      ref={labelRef}
      style={{
        width: 420,
        height: 150 * 3.78, // 150mm em px (aprox)
        background: '#fff',
        border: '1px solid #000',
        margin: '0 auto',
        padding: 24,
        boxSizing: 'border-box',
        fontFamily: 'monospace',
      }}
      className="label-print-root"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <QRCode value={label.labelSeqId || label.id} size={80} />
        <div style={{ textAlign: 'right', flex: 1, marginLeft: 16 }}>
          <div style={{ fontWeight: 'bold', fontSize: 22 }}>{label.partNumber}</div>
          <div style={{ fontSize: 14 }}>{label.description}</div>
          <div style={{ fontSize: 16, marginTop: 8 }}>Lote: {label.quantity}</div>
          <div style={{ fontSize: 14 }}>ID: {label.labelSeqId}</div>
        </div>
      </div>
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <div>Data: {label.printedAt ? new Date(label.printedAt).toLocaleDateString('pt-BR') : '-'}</div>
        <div>Operador: {label.printedBy}</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <svg height="40" width="100%">
          <rect x="0" y="0" width="100%" height="40" fill="#000" />
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="20">{label.labelSeqId}</text>
        </svg>
      </div>
    </div>
  );
}
