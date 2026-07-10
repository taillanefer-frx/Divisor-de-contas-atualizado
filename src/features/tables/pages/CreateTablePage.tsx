import { type FormEvent, useMemo, useRef, useState } from 'react';
import { ArrowRight, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AppServiceError } from '@/lib/supabase/errors';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legal/legalVersions';
import { tableService } from '@/services/tableService';

const maxTableNameLength = 120;

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

function validateTableName(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return 'Informe o nome da mesa.';
  }

  if (trimmedValue.length > maxTableNameLength) {
    return 'O nome da mesa deve ter no maximo 120 caracteres.';
  }

  return null;
}

function getUserAgent() {
  if (typeof navigator === 'undefined') return null;
  return navigator.userAgent || null;
}

export function CreateTablePage() {
  const navigate = useNavigate();
  const [tableName, setTableName] = useState('');
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasRedirectedRef = useRef(false);

  const trimmedTableName = tableName.trim();
  const tableNameError = useMemo(() => validateTableName(tableName), [tableName]);
  const remainingCharacters = maxTableNameLength - tableName.length;
  const isSubmitting = status === 'loading';
  const isSuccess = status === 'success';
  const canSubmit = !tableNameError && hasAcceptedLegal && !isSubmitting && !isSuccess;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || hasRedirectedRef.current) return;

    setStatus('loading');
    setSubmitError(null);

    try {
      const createdTable = await tableService.createWithConsent({
        name: trimmedTableName,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
        user_agent: getUserAgent(),
      });

      setStatus('success');
      hasRedirectedRef.current = true;
      navigate(`/mesa/${encodeURIComponent(createdTable.share_token)}`, { replace: true });
    } catch (error) {
      setStatus('error');

      if (error instanceof AppServiceError) {
        setSubmitError(error.appError.userMessage);
        return;
      }

      setSubmitError('Nao foi possivel criar a mesa agora. Tente novamente.');
    }
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-lg bg-surface-panel p-5 shadow-soft lg:grid-cols-[1fr_25rem] lg:items-start">
        <div className="grid gap-4">
          <Badge tone="green">Mesa compartilhada</Badge>
          <div>
            <h1 className="text-3xl font-bold tracking-normal text-ink-strong sm:text-4xl">Crie uma mesa segura.</h1>
            <p className="mt-2 max-w-xl text-base leading-7 text-ink-muted">
              Abra uma mesa para dividir a conta com tranquilidade. Nesta etapa coletamos apenas o nome da mesa e o aceite legal.
            </p>
          </div>
          <Card className="grid gap-3 bg-surface-canvas shadow-none">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-ink-strong" aria-hidden="true" size={22} />
              <div className="min-w-0">
                <h2 className="text-base font-bold text-ink-strong">LGPD desde o comeco</h2>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  Nao pedimos CPF, telefone, endereco, e-mail ou dados sensiveis para criar a mesa.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <form className="grid gap-4 rounded-lg border border-surface-border bg-surface-canvas p-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-2">
            <Input
              id="table-name"
              name="table-name"
              label="Nome da mesa"
              placeholder="Bar de sexta"
              value={tableName}
              maxLength={maxTableNameLength + 20}
              disabled={isSubmitting || isSuccess}
              aria-invalid={Boolean(tableNameError)}
              aria-describedby="table-name-counter"
              error={tableNameError ?? undefined}
              onChange={(event) => setTableName(event.target.value)}
            />
            <p
              id="table-name-counter"
              className={`text-xs ${remainingCharacters < 0 ? 'text-red-700 dark:text-red-200' : 'text-ink-muted'}`}
              aria-live="polite"
            >
              {trimmedTableName.length} de {maxTableNameLength} caracteres.
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border border-surface-border bg-surface-panel p-3">
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <Link className="inline-flex items-center gap-1 text-ink-strong underline-offset-4 hover:underline" to="/legal/termos" target="_blank" rel="noreferrer">
                Termos de Uso <ExternalLink aria-hidden="true" size={15} />
              </Link>
              <span className="text-ink-muted">e</span>
              <Link className="inline-flex items-center gap-1 text-ink-strong underline-offset-4 hover:underline" to="/legal/privacidade" target="_blank" rel="noreferrer">
                Politica de Privacidade <ExternalLink aria-hidden="true" size={15} />
              </Link>
            </div>
            <label className="flex items-start gap-3 text-sm leading-6 text-ink-body">
              <input
                className="mt-1 h-5 w-5 shrink-0 rounded border-surface-border accent-brand-green"
                type="checkbox"
                checked={hasAcceptedLegal}
                disabled={isSubmitting || isSuccess}
                onChange={(event) => setHasAcceptedLegal(event.target.checked)}
              />
              <span>
                Li e aceito os Termos de Uso v{TERMS_VERSION} e a Politica de Privacidade v{PRIVACY_VERSION}.
              </span>
            </label>
            {!hasAcceptedLegal ? <p className="text-xs text-ink-muted">O aceite e obrigatorio para criar a mesa.</p> : null}
          </div>

          {submitError ? (
            <div className="rounded-lg border border-brand-red bg-brand-red/25 p-3 text-sm font-medium text-ink-strong" role="alert">
              {submitError}
            </div>
          ) : null}

          {isSuccess ? (
            <div className="rounded-lg border border-brand-green bg-brand-green/35 p-3 text-sm font-medium text-ink-strong" role="status">
              Mesa criada. Redirecionando...
            </div>
          ) : null}

          <Button className="w-full" disabled={!canSubmit} size="lg" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" size={18} />
                Criando mesa
              </>
            ) : (
              <>
                Criar mesa <ArrowRight aria-hidden="true" size={18} />
              </>
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}
