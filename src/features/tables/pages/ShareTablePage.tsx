import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { InvalidTableNotice, TableStatusNotice } from '@/features/tables/components/TableStatusNotice';
import { TableSharePanel } from '@/features/tables/components/TableSharePanel';
import { validateShareToken } from '@/lib/sharing';
import { AppServiceError } from '@/lib/supabase/errors';
import type { TablesRow } from '@/lib/supabase/types';
import { tableService } from '@/services/tableService';

type PageState = 'loading' | 'ready' | 'invalid_token' | 'not_found' | 'connection_failed' | 'error';

function getErrorMessage(error: unknown) {
  if (error instanceof AppServiceError) return error.appError.userMessage;
  if (error instanceof Error) return error.message;
  return 'Algo deu errado. Tente novamente.';
}

function getPageStateFromError(error: unknown): PageState {
  if (error instanceof AppServiceError) {
    if (error.appError.code === 'not_found') return 'not_found';
    if (error.appError.code === 'connection_failed') return 'connection_failed';
  }

  return 'error';
}

export function ShareTablePage() {
  const navigate = useNavigate();
  const { shareToken } = useParams<{ shareToken: string }>();
  const normalizedShareToken = useMemo(() => (shareToken ?? '').trim(), [shareToken]);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [table, setTable] = useState<TablesRow | null>(null);
  const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(true);

  const loadTable = useCallback(async () => {
    const tokenValidation = validateShareToken(normalizedShareToken);
    if (!tokenValidation.ok) {
      setPageState('invalid_token');
      setPageErrorMessage(tokenValidation.error === 'Token da mesa vazio.' ? 'O link da mesa esta vazio. Abra novamente pelo link compartilhado.' : 'Este link de mesa nao parece valido. Confira se ele foi copiado por completo.');
      return;
    }

    setPageState('loading');
    setPageErrorMessage(null);

    try {
      const foundTable = await tableService.getByShareToken(tokenValidation.token);
      setTable(foundTable);
      setPageState('ready');
    } catch (error) {
      setTable(null);
      setPageState(getPageStateFromError(error));
      setPageErrorMessage(getErrorMessage(error));
    }
  }, [normalizedShareToken]);

  useEffect(() => {
    void loadTable();
  }, [loadTable]);

  if (pageState === 'loading') {
    return <LoadingState label="Carregando compartilhamento..." />;
  }

  if (pageState !== 'ready' || !table) {
    const fallback = pageState === 'not_found' ? 'Nao encontramos uma mesa com esse link.' : pageState === 'connection_failed' ? 'Nao foi possivel conectar ao Supabase agora.' : pageState === 'invalid_token' ? 'O link informado nao pode ser usado para acessar uma mesa.' : 'Nao foi possivel abrir o compartilhamento desta mesa.';

    return (
      <div className="grid gap-4">
        <InvalidTableNotice title="Compartilhamento indisponivel" description={pageErrorMessage ?? fallback} />
        <Button variant="secondary" onClick={() => void loadTable()} disabled={pageState === 'invalid_token'}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (table.status === 'archived') {
    return (
      <div className="grid gap-4">
        <InvalidTableNotice title="Link indisponivel" description="Esta mesa foi arquivada e nao deve ser acessada normalmente por link ou QR Code." />
        <Button variant="secondary" onClick={() => navigate('/mesa/' + encodeURIComponent(table.share_token))}>
          Ver mesa em modo consulta
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-2">
        <h1 className="break-words text-2xl font-bold text-ink-strong sm:text-3xl">Compartilhar {table.name}</h1>
        <p className="text-sm leading-6 text-ink-muted">Use o painel para copiar o link, abrir o compartilhamento do celular ou mostrar o QR Code.</p>
      </section>
      <TableStatusNotice status={table.status} />
      <Button onClick={() => setIsSharePanelOpen(true)}>Abrir compartilhamento</Button>
      <TableSharePanel
        isOpen={isSharePanelOpen}
        onClose={() => setIsSharePanelOpen(false)}
        tableName={table.name}
        shareToken={table.share_token}
      />
    </div>
  );
}
