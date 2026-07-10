import { Copy, Download, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { BillingResult, TablePaymentSummary } from '@/domain/billing';
import { buildBillingCsvFileName, buildBillingSummaryCsv, buildBillingSummaryText } from '@/domain/export/billingExport';

type BillingExportActionsProps = { tableName: string; billing: BillingResult; payments: TablePaymentSummary | null };

export function BillingExportActions({ tableName, billing, payments }: BillingExportActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const input = useMemo(() => ({ tableName, generatedAt: new Date().toISOString(), billing, payments }), [billing, payments, tableName]);

  async function copySummary() {
    await navigator.clipboard.writeText(buildBillingSummaryText(input));
    setMessage('Resumo copiado.');
  }

  async function shareSummary() {
    const text = buildBillingSummaryText(input);
    if (navigator.share) {
      await navigator.share({ title: 'Resumo da mesa ' + tableName, text });
      setMessage('Resumo compartilhado.');
      return;
    }
    await navigator.clipboard.writeText(text);
    setMessage('Resumo copiado para compartilhar.');
  }

  function downloadCsv() {
    const blob = new Blob([buildBillingSummaryCsv(input)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildBillingCsvFileName(tableName);
    link.click();
    URL.revokeObjectURL(url);
    setMessage('CSV baixado.');
  }

  return (
    <>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>Exportar resumo</Button>
      </div>
      <Modal title="Exportar resumo" isOpen={isOpen} onClose={() => setIsOpen(false)} description="Compartilhe apenas nomes, totais e saldos. Link da mesa e identificadores internos ficam fora do arquivo.">
        <div className="grid gap-3">
          <Button variant="secondary" onClick={() => void copySummary()}><Copy aria-hidden="true" size={16} />Copiar resumo</Button>
          <Button variant="secondary" onClick={() => void shareSummary()}><Share2 aria-hidden="true" size={16} />Compartilhar</Button>
          <Button onClick={downloadCsv}><Download aria-hidden="true" size={16} />Exportar CSV</Button>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Fechar</Button>
          {message ? <p className="text-sm text-ink-muted" role="status">{message}</p> : null}
        </div>
      </Modal>
    </>
  );
}
