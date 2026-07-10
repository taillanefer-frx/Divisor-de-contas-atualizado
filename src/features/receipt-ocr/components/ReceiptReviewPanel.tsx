import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Save, Trash2, UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { centsToCurrencyInput, parseCurrencyToCents } from '@/lib/money/money';
import { fromDatetimeLocalValue, getCurrentDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/date/dateTime';
import { calculateImportedItemsTotal, findPossibleDuplicateLineIds, getConfidenceLevel, toReviewDraft, validateReviewLineForConfirmation, type ReceiptReviewLineDraft } from '@/domain/receipt-ocr';
import type { ParticipantsRow, ReceiptScanItemsRow, ReceiptScansRow } from '@/lib/supabase/types';
import { receiptScanItemService } from '@/services/receiptScanItemService';
import { receiptOcrWorkflowService } from '@/services/receiptOcrWorkflowService';
import { ReceiptTotalsComparison } from '@/features/receipt-ocr/components/ReceiptTotalsComparison';

type ReceiptReviewPanelProps = {
  scan: ReceiptScansRow;
  lines: ReceiptScanItemsRow[];
  participants: ParticipantsRow[];
  appCalculatedTotalCents: number;
  disabled?: boolean;
  onChanged: () => Promise<void> | void;
  onConfirmed: () => Promise<void> | void;
};

function confidenceLabel(confidence: number | null) {
  const level = getConfidenceLevel(confidence);
  if (level === 'high') return 'Alta confianca';
  if (level === 'review') return 'Revisar';
  if (level === 'low') return 'Baixa confianca';
  return 'Confianca nao informada';
}

function nextLineIndex(lines: ReceiptScanItemsRow[]) {
  return lines.reduce((max, line) => Math.max(max, line.line_index), -1) + 1;
}

export function ReceiptReviewPanel({ scan, lines, participants, appCalculatedTotalCents, disabled = false, onChanged, onConfirmed }: ReceiptReviewPanelProps) {
  const [drafts, setDrafts] = useState<ReceiptReviewLineDraft[]>([]);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [panelMessage, setPanelMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const defaultConsumedAt = useMemo(() => toDatetimeLocalValue(scan.created_at) || getCurrentDatetimeLocalValue(), [scan.created_at]);

  useEffect(() => {
    setDrafts(lines.map((line) => toReviewDraft(line, fromDatetimeLocalValue(defaultConsumedAt))));
    setLineErrors({});
  }, [defaultConsumedAt, lines]);

  const duplicateIds = useMemo(() => findPossibleDuplicateLineIds(drafts), [drafts]);
  const importedItemsTotal = useMemo(() => calculateImportedItemsTotal(drafts), [drafts]);

  function updateDraft(id: string, patch: Partial<ReceiptReviewLineDraft>) {
    setDrafts((current) => current.map((line) => (line.receipt_scan_item_id === id ? { ...line, ...patch } : line)));
  }

  async function persistDraft(line: ReceiptReviewLineDraft) {
    const parsedAmount = line.amount_cents;
    await receiptScanItemService.updateReview(line.receipt_scan_item_id, {
      recognized_name: line.name.trim() || null,
      recognized_amount_cents: parsedAmount,
      review_status: line.review_status,
    });
  }

  async function handleSaveLine(line: ReceiptReviewLineDraft) {
    setIsSaving(true);
    setPanelMessage(null);
    try {
      await persistDraft(line);
      await onChanged();
      setPanelMessage('Linha salva para revisao.');
    } catch (error) {
      setPanelMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar a linha.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddManualLine() {
    setIsSaving(true);
    setPanelMessage(null);
    try {
      await receiptScanItemService.create({
        receipt_scan_id: scan.id,
        table_id: scan.table_id,
        line_index: nextLineIndex(lines),
        raw_text: 'Linha adicionada manualmente na revisao',
        recognized_name: 'Item da nota',
        recognized_amount_cents: 0,
        confidence: null,
        review_status: 'edited',
      });
      await onChanged();
    } catch (error) {
      setPanelMessage(error instanceof Error ? error.message : 'Nao foi possivel adicionar a linha.');
    } finally {
      setIsSaving(false);
    }
  }

  function toggleParticipant(lineId: string, participantId: string) {
    setDrafts((current) => current.map((line) => {
      if (line.receipt_scan_item_id !== lineId) return line;
      const exists = line.participant_ids.includes(participantId);
      return { ...line, participant_ids: exists ? line.participant_ids.filter((id) => id !== participantId) : [...line.participant_ids, participantId] };
    }));
  }

  async function handleConfirm() {
    const nextErrors: Record<string, string> = {};
    for (const line of drafts) {
      const errors = validateReviewLineForConfirmation(line);
      if (errors.length > 0) nextErrors[line.receipt_scan_item_id] = errors.join(' ');
    }

    setLineErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setPanelMessage('Revise as linhas marcadas antes de confirmar.');
      return;
    }

    setIsSaving(true);
    setPanelMessage(null);
    try {
      await Promise.all(drafts.map((line) => persistDraft(line)));
      await receiptOcrWorkflowService.confirmReviewedLines(scan.table_id, scan.id, drafts);
      await onConfirmed();
      setPanelMessage('Itens criados apos revisao humana.');
    } catch (error) {
      setPanelMessage(error instanceof Error ? error.message : 'Nao foi possivel confirmar a revisao.');
    } finally {
      setIsSaving(false);
    }
  }

  if (lines.length === 0) {
    return (
      <Card className="grid gap-3">
        <h3 className="font-bold text-ink-strong">Revisao da nota</h3>
        <p className="text-sm leading-6 text-ink-muted">Nenhuma linha foi reconhecida ainda. Voce pode tentar outra foto ou seguir usando o cadastro manual de itens.</p>
        <Button variant="secondary" onClick={handleAddManualLine} disabled={disabled || isSaving}>
          <Plus aria-hidden="true" size={18} />
          Adicionar linha para revisao
        </Button>
        {panelMessage ? <p className="text-sm text-ink-muted" role="status">{panelMessage}</p> : null}
      </Card>
    );
  }

  return (
    <Card className="grid gap-4">
      <div className="grid gap-2">
        <h3 className="text-lg font-bold text-ink-strong">Revisao humana obrigatoria</h3>
        <p className="text-sm leading-6 text-ink-muted">Corrija nomes e valores, ignore linhas que nao sao consumo e escolha participantes. Nada vira item real antes da confirmacao final.</p>
      </div>

      <ReceiptTotalsComparison receiptTotalCents={scan.receipt_total_cents} importedItemsTotalCents={importedItemsTotal} appCalculatedTotalCents={appCalculatedTotalCents} />

      <div className="grid gap-3">
        {drafts.map((line) => {
          const amountValue = line.amount_cents === null ? '' : centsToCurrencyInput(line.amount_cents);
          const isIgnored = line.review_status === 'ignored';
          const hasDuplicateWarning = duplicateIds.has(line.receipt_scan_item_id);

          return (
            <article key={line.receipt_scan_item_id} className="grid gap-3 rounded-lg border border-surface-border bg-surface-canvas p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={isIgnored ? 'neutral' : 'blue'}>{isIgnored ? 'Ignorada' : 'Selecionada'}</Badge>
                <Badge tone={line.confidence !== null && line.confidence < 0.6 ? 'red' : 'neutral'}>{confidenceLabel(line.confidence)}</Badge>
                {hasDuplicateWarning ? <Badge tone="red">Possivel duplicidade</Badge> : null}
                {lineErrors[line.receipt_scan_item_id] ? <Badge tone="red">Revisar</Badge> : null}
              </div>

              <p className="break-words rounded-lg bg-surface-muted p-2 text-xs text-ink-muted">OCR: {line.raw_text}</p>

              <div className="grid gap-3 sm:grid-cols-[1fr_8rem_7rem]">
                <Input label="Nome revisado" value={line.name} disabled={disabled || isSaving || isIgnored} onChange={(event) => updateDraft(line.receipt_scan_item_id, { name: event.target.value, review_status: 'edited' })} />
                <Input label="Valor" inputMode="decimal" value={amountValue} disabled={disabled || isSaving || isIgnored} onChange={(event) => {
                  const parsed = parseCurrencyToCents(event.target.value);
                  updateDraft(line.receipt_scan_item_id, { amount_cents: parsed.ok ? parsed.cents : null, review_status: 'edited' });
                }} />
                <Input label="Qtd." type="number" min={0.001} step={0.001} value={String(line.quantity)} disabled={disabled || isSaving || isIgnored} onChange={(event) => updateDraft(line.receipt_scan_item_id, { quantity: Number(event.target.value), review_status: 'edited' })} />
              </div>

              <Input label="Horario sugerido" type="datetime-local" value={toDatetimeLocalValue(line.consumed_at)} disabled={disabled || isSaving || isIgnored} onChange={(event) => updateDraft(line.receipt_scan_item_id, { consumed_at: fromDatetimeLocalValue(event.target.value), review_status: 'edited' })} />

              <fieldset className="grid gap-2">
                <legend className="flex items-center gap-2 text-sm font-semibold text-ink-strong"><UsersRound aria-hidden="true" size={16} /> Participantes</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {participants.map((participant) => {
                    const checked = line.participant_ids.includes(participant.id);
                    return (
                      <label key={participant.id} className="flex min-h-11 items-center gap-2 rounded-lg border border-surface-border bg-surface-panel px-3 py-2 text-sm text-ink-body">
                        <input type="checkbox" checked={checked} disabled={disabled || isSaving || isIgnored} onChange={() => toggleParticipant(line.receipt_scan_item_id, participant.id)} />
                        <span className="min-w-0 truncate">{participant.display_name}</span>
                      </label>
                    );
                  })}
                </div>
                {participants.length === 0 ? <p className="text-sm text-ink-muted">Adicione participantes antes de confirmar itens da nota.</p> : null}
              </fieldset>

              {lineErrors[line.receipt_scan_item_id] ? <p className="text-sm text-red-700 dark:text-red-200">{lineErrors[line.receipt_scan_item_id]}</p> : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={() => updateDraft(line.receipt_scan_item_id, { review_status: isIgnored ? 'edited' : 'ignored' })} disabled={disabled || isSaving}>
                  <Trash2 aria-hidden="true" size={18} />
                  {isIgnored ? 'Reativar linha' : 'Ignorar linha'}
                </Button>
                <Button variant="secondary" onClick={() => void handleSaveLine(line)} disabled={disabled || isSaving}>
                  <Save aria-hidden="true" size={18} />
                  Salvar linha
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={handleAddManualLine} disabled={disabled || isSaving}>
          <Plus aria-hidden="true" size={18} />
          Adicionar linha
        </Button>
        <Button onClick={handleConfirm} disabled={disabled || isSaving || scan.status === 'confirmed'}>
          <Check aria-hidden="true" size={18} />
          Confirmar e criar itens
        </Button>
      </div>

      {panelMessage ? <p className="rounded-lg bg-surface-muted p-3 text-sm text-ink-body" role="status">{panelMessage}</p> : null}
    </Card>
  );
}
