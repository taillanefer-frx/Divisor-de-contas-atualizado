import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function ConsentPage() {
  return (
    <Card className="grid gap-4">
      <CheckCircle2 aria-hidden="true" className="text-ink-strong" size={28} />
      <div>
        <h1 className="text-2xl font-bold text-ink-strong">Aceite dos termos</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">Tela preparada para registrar aceite de Termos de Uso e Politica de Privacidade antes de entrar na mesa.</p>
      </div>
      <Button>Continuar</Button>
    </Card>
  );
}
