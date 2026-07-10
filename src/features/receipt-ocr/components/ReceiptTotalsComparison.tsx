import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { compareReceiptTotals } from '@/domain/receipt-ocr';
import { formatMoney } from '@/lib/money/money';

type ReceiptTotalsComparisonProps = {
  receiptTotalCents: number | null;
  importedItemsTotalCents: number;
  appCalculatedTotalCents: number;
};

export function ReceiptTotalsComparison({ receiptTotalCents, importedItemsTotalCents, appCalculatedTotalCents }: ReceiptTotalsComparisonProps) {
  const comparison = compareReceiptTotals(receiptTotalCents, importedItemsTotalCents, appCalculatedTotalCents);

  return (
    <Card className="grid gap-3 border-brand-blue/60 bg-brand-blue/10">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-ink-strong">Conferencia dos totais</h3>
        <Badge tone={comparison.status === 'matches' ? 'green' : comparison.status === 'no_receipt_total' ? 'neutral' : 'red'}>
          {comparison.status === 'matches' ? 'Totais coincidem' : comparison.status === 'no_receipt_total' ? 'Sem total da nota' : 'Revisar diferenca'}
        </Badge>
      </div>
      <div className="grid gap-2 text-sm text-ink-body">
        <p>Total reconhecido da nota: <strong>{receiptTotalCents === null ? 'Nao informado' : formatMoney(receiptTotalCents)}</strong></p>
        <p>Total das linhas selecionadas: <strong>{formatMoney(importedItemsTotalCents)}</strong></p>
        <p>Total calculado pelo app: <strong>{formatMoney(appCalculatedTotalCents)}</strong></p>
        <p>Diferenca: <strong>{comparison.differenceCents === null ? 'Nao calculada' : formatMoney(comparison.differenceCents)}</strong></p>
      </div>
      <p className="text-xs leading-5 text-ink-muted">Quando os valores fecham, isso confirma apenas a matematica. Ainda revise se cada item representa o consumo correto.</p>
    </Card>
  );
}
