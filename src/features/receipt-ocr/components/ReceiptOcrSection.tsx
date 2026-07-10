import { useMemo, useRef, useState } from 'react';
import { FileImage, RefreshCw, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ParticipantsRow, ReceiptScanItemsRow, ReceiptScansRow } from '@/lib/supabase/types';
import { receiptOcrWorkflowService } from '@/services/receiptOcrWorkflowService';
import { ReceiptImageInput } from '@/features/receipt-ocr/components/ReceiptImageInput';
import { ReceiptReviewPanel } from '@/features/receipt-ocr/components/ReceiptReviewPanel';
import { ReceiptScanStatusBadge } from '@/features/receipt-ocr/components/ReceiptScanStatusBadge';

type ReceiptOcrSectionProps = {
  tableId: string;
  isReadOnly: boolean;
  participants: ParticipantsRow[];
  scans: ReceiptScansRow[];
  scanItems: ReceiptScanItemsRow[];
  appCalculatedTotalCents: number;
  onRefresh: () => Promise<void> | void;
};

function selectActiveScan(scans: ReceiptScansRow[]) {
  return scans.find((scan) => scan.status !== 'canceled') ?? null;
}

export function ReceiptOcrSection({ tableId, isReadOnly, participants, scans, scanItems, appCalculatedTotalCents, onRefresh }: ReceiptOcrSectionProps) {
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const activeScan = useMemo(() => scans.find((scan) => scan.id === activeScanId) ?? selectActiveScan(scans), [activeScanId, scans]);
  const activeLines = useMemo(() => (activeScan ? scanItems.filter((line) => line.receipt_scan_id === activeScan.id) : []), [activeScan, scanItems]);


  async function handleUpload(file: File) {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsBusy(true);
    setProgressMessage('Preparando OCR local...');
    setStatusMessage(null);

    try {
      const { scan, warnings } = await receiptOcrWorkflowService.processLocalImage({
        table_id: tableId,
        file,
        options: {
          signal: controller.signal,
          onProgress: (progress) => setProgressMessage(progress.message + ' ' + Math.round(progress.progress * 100) + '%'),
        },
      });
      setActiveScanId(scan.id);
      await onRefresh();
      setStatusMessage(warnings.length > 0 ? warnings.join(' ') : 'Leitura local concluida. Revise as linhas antes de criar itens.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Nao foi possivel ler a nota no navegador.');
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      setProgressMessage(null);
      setIsBusy(false);
    }
  }

  function handleCancelOcr() {
    abortControllerRef.current?.abort();
    setStatusMessage('Leitura da nota cancelada. Voce pode tentar outra foto ou cadastrar manualmente.');
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="purple">OCR da nota</Badge>
          <h2 className="mt-2 text-xl font-bold text-ink-strong">Foto, revisao e importacao</h2>
          <p className="mt-1 text-sm leading-6 text-ink-muted">A nota pode ajudar a preencher itens, mas voce sempre revisa antes de criar qualquer consumo real.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void onRefresh()} disabled={isBusy}>
          <RefreshCw aria-hidden="true" size={16} />
          Atualizar OCR
        </Button>
      </div>

      {!isReadOnly ? (
        <ReceiptImageInput
          disabled={isBusy}
          title={scans.length > 0 ? 'Escanear mais uma pagina' : 'Foto da nota'}
          submitLabel={scans.length > 0 ? 'Escanear mais uma pagina' : 'Ler nota no aparelho'}
          onUpload={handleUpload}
        />
      ) : null}

      {isBusy ? (
        <div className="flex flex-col gap-2 rounded-lg bg-surface-muted p-3 text-sm text-ink-body sm:flex-row sm:items-center sm:justify-between" role="status">
          <span>{progressMessage ?? 'Lendo a nota localmente...'}</span>
          <Button variant="ghost" size="sm" onClick={handleCancelOcr}>
            <X aria-hidden="true" size={16} />
            Cancelar
          </Button>
        </div>
      ) : null}

      {statusMessage ? <p className="rounded-lg bg-surface-muted p-3 text-sm text-ink-body" role="status">{statusMessage}</p> : null}

      {scans.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-ink-strong">Notas revisadas localmente</p>
          <div className="grid gap-2">
            {scans.map((scan) => (
              <button
                key={scan.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface-panel p-3 text-left focus:outline-none focus:ring-2 focus:ring-brand-blue"
                onClick={() => setActiveScanId(scan.id)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileImage aria-hidden="true" size={18} />
                  <span className="min-w-0 truncate text-sm font-medium text-ink-strong">{scan.original_file_name ?? 'Nota enviada'}</span>
                </span>
                <ReceiptScanStatusBadge status={scan.status} />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activeScan ? (
        <div className="grid gap-4">
          {activeScan.error_message ? <Card className="border-brand-red/70 bg-brand-red/20 text-sm text-ink-body">{activeScan.error_message}</Card> : null}
          <ReceiptReviewPanel
            scan={activeScan}
            lines={activeLines}
            participants={participants}
            appCalculatedTotalCents={appCalculatedTotalCents}
            disabled={isReadOnly || activeScan.status === 'confirmed'}
            onChanged={onRefresh}
            onConfirmed={onRefresh}
          />
        </div>
      ) : (
        <Card className="text-sm leading-6 text-ink-muted">Nenhuma nota lida ainda. A foto fica no aparelho; somente os dados revisados da nota sao salvos.</Card>
      )}
    </section>
  );
}
