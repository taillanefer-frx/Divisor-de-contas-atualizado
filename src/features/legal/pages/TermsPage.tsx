import { Card } from '@/components/ui/Card';

export function TermsPage() {
  return (
    <Card className="grid gap-3">
      <h1 className="text-2xl font-bold text-ink-strong">Termos de Uso</h1>
      <p className="text-sm leading-6 text-ink-muted">O Divisor de Contas ajuda grupos a organizar itens, participantes, pagamentos e divisao de valores de uma mesa compartilhada.</p>
      <p className="text-sm leading-6 text-ink-muted">As pessoas da mesa sao responsaveis por revisar os dados inseridos, especialmente valores reconhecidos por OCR, antes de confirmar itens e pagamentos.</p>
      <p className="text-sm leading-6 text-ink-muted">O app calcula a divisao com base nas informacoes registradas, mas nao substitui conferencia da nota, acordos do grupo ou comprovantes de pagamento.</p>
      <p className="text-sm leading-6 text-ink-muted">Nao use o app para armazenar dados sensiveis ou documentos pessoais.</p>
    </Card>
  );
}
