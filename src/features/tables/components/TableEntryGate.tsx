import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, ScanLine } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getCurrentDatetimeLocalValue, fromDatetimeLocalValue } from '@/lib/date/dateTime';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legal/legalVersions';
import { listSavedBarMenus } from '@/domain/menu/menuStorage';
import type { ParticipantFormSubmitValues } from '@/features/participants/components/ParticipantForm';

type MenuChoiceMode = 'saved' | 'new' | 'scan' | 'none';

export type TableEntryMenuChoice = {
  mode: MenuChoiceMode;
  savedBarId?: string;
  newMenuName?: string;
};

type TableEntryGateProps = {
  shareToken: string;
  tableName: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: ParticipantFormSubmitValues, menuChoice: TableEntryMenuChoice) => Promise<void>;
  onSkipEntry: () => void;
  onOpenScan?: () => void;
};

export function TableEntryGate({ tableName, isSubmitting, errorMessage, onSubmit, onSkipEntry, onOpenScan }: TableEntryGateProps) {
  const savedBars = useMemo(() => listSavedBarMenus(), []);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [arrivalAt, setArrivalAt] = useState(getCurrentDatetimeLocalValue());
  const [choiceMode, setChoiceMode] = useState<MenuChoiceMode>('none');
  const [savedBarId, setSavedBarId] = useState(savedBars[0]?.id ?? '');
  const [newBarName, setNewBarName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (!acceptedLegal) {
      setLocalError('Aceite os termos para entrar na mesa.');
      return;
    }

    if (!displayName.trim()) {
      setLocalError('Informe seu nome na mesa.');
      return;
    }

    if (choiceMode === 'saved') {
      if (!savedBarId) {
        setLocalError('Escolha um cardapio salvo ou continue sem cardapio.');
        return;
      }
    }

    if (choiceMode === 'new') {
      if (!newBarName.trim()) {
        setLocalError('Informe o nome do novo cardapio.');
        return;
      }
    }

    try {
      await onSubmit(
        { display_name: displayName.trim(), arrival_at: fromDatetimeLocalValue(arrivalAt), departure_at: null },
        { mode: choiceMode, savedBarId: savedBarId || undefined, newMenuName: newBarName.trim() || undefined },
      );
    } catch {
      return;
    }

    if (choiceMode === 'scan') onOpenScan?.();
  }

  return (
    <section className="mx-auto grid w-full max-w-2xl gap-4">
      <div>
        <Badge tone="green">Entrada na mesa</Badge>
        <h1 className="mt-2 text-2xl font-bold text-ink-strong">Entrar em {tableName}</h1>
      </div>

      <Card>
        <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
          <label className="flex items-start gap-3 rounded-lg border border-surface-border bg-surface-muted p-3 text-sm leading-6 text-ink-body">
            <input className="mt-1 h-5 w-5 shrink-0 accent-brand-green" type="checkbox" checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} />
            <span>Li e aceito os Termos de Uso v{TERMS_VERSION} e a Politica de Privacidade v{PRIVACY_VERSION}.</span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Seu nome" value={displayName} maxLength={80} placeholder="Ex.: Ana" disabled={isSubmitting} onChange={(event) => setDisplayName(event.target.value)} />
            <Input label="Hora de chegada" type="datetime-local" value={arrivalAt} disabled={isSubmitting} onChange={(event) => setArrivalAt(event.target.value)} />
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-semibold text-ink-strong">Cardapio</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['saved', 'Usar cardapio de bar salvo'],
                ['new', 'Criar cardapio novo'],
                ['scan', 'Escanear cardapio'],
                ['none', 'Continuar sem cardapio'],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-panel p-3 text-sm font-medium text-ink-body">
                  <input type="radio" name="menu-choice" value={value} checked={choiceMode === value} onChange={() => setChoiceMode(value as MenuChoiceMode)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {choiceMode === 'saved' ? (
            <label className="grid gap-2 text-sm font-medium text-ink-body">
              Bar salvo
              <select className="h-12 rounded-lg border border-surface-border bg-surface-panel px-3 text-base text-ink-strong" value={savedBarId} onChange={(event) => setSavedBarId(event.target.value)}>
                <option value="">Selecione</option>
                {savedBars.map((bar) => <option key={bar.id} value={bar.id}>{bar.name} - {bar.items.length} itens</option>)}
              </select>
            </label>
          ) : null}

          {choiceMode === 'new' ? <Input label="Nome do novo cardapio" value={newBarName} maxLength={80} placeholder="Ex.: Cardapio do Bar Central" onChange={(event) => setNewBarName(event.target.value)} /> : null}
          {choiceMode === 'scan' ? <p className="rounded-lg bg-surface-muted p-3 text-sm text-ink-muted"><ScanLine aria-hidden="true" className="mr-2 inline" size={16} />Depois de entrar, abra a leitura para revisar tudo antes de salvar.</p> : null}

          {localError || errorMessage ? <p className="rounded-lg bg-brand-red/20 p-3 text-sm text-ink-body">{localError ?? errorMessage}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            Entrar na mesa
            <ArrowRight aria-hidden="true" size={18} />
          </Button>
          {errorMessage ? (
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onSkipEntry}>
              Continuar para a mesa
            </Button>
          ) : null}
        </form>
      </Card>
    </section>
  );
}
