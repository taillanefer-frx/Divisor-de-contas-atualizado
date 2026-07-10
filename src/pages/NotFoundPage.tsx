import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface-canvas p-4 text-ink-body">
      <EmptyState title="Pagina nao encontrada" description="O link pode ter expirado ou a rota ainda nao foi criada." action={<Button><Link to="/mesas/nova">Voltar</Link></Button>} />
    </main>
  );
}
