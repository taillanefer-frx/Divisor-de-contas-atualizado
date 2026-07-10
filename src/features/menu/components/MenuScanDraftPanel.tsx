import { Plus, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { consumptionTypes, type ConsumptionType } from '@/domain/menu/menuStorage';
import { parseCurrencyToCents } from '@/lib/money/money';

export type MenuScanDraftItem = {
  id: string;
  page: number;
  type: ConsumptionType;
  name: string;
  amount: string;
};

type MenuScanDraftPanelProps = {
  isSaving?: boolean;
  onSave: (items: Array<{ type: ConsumptionType; name: string; amount_cents: number }>) => Promise<void> | void;
};

function createDraftId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function MenuScanDraftPanel({ isSaving = false, onSave }: MenuScanDraftPanelProps) {
  const [pageCount, setPageCount] = useState(1);
  const [drafts, setDrafts] = useState<MenuScanDraftItem[]>([]);
  const [type, setType] = useState<ConsumptionType>('Bebida');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function addDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !amount.trim()) return;

    setDrafts((current) => [...current, { id: createDraftId(), page: pageCount, type, name: name.trim(), amount }]);
    setName('');
    setAmount('');
    setMessage(null);
  }

  function updateDraft(id: string, patch: Partial<MenuScanDraftItem>) {
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  }

  async function handleSave() {
    const parsed = drafts.map((draft) => ({ draft, amount: parseCurrencyToCents(draft.amount) }));
    const invalid = parsed.find((entry) => !entry.amount.ok || !entry.draft.name.trim());
    if (invalid) {
      setMessage('Revise nome e valor antes de salvar o cardapio.');
      return;
    }

    await onSave(parsed.map((entry) => ({
      type: entry.draft.type,
      name: entry.draft.name.trim(),
      amount_cents: entry.amount.ok ? entry.amount.cents : 0,
    })));
    setDrafts([]);
    setMessage('Itens salvos no cardapio da mesa.');
  }

  return (
    <Card className="grid gap-4">
      <div className="grid gap-1">
        <h3 className="text-lg font-bold text-ink-strong">Escanear cardapio</h3>
        <p className="text-sm leading-6 text-ink-muted">Nesta etapa, os itens ficam como rascunho de cardapio. Revise nome, valor e tipo antes de salvar para a mesa.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setPageCount((current) => current + 1)}>
          <Plus aria-hidden="true" size={18} />
          Escanear mais uma pagina
        </Button>
        <span className="self-center text-sm text-ink-muted">{pageCount} pagina(s) em revisao</span>
      </div>

      <form className="grid gap-3" onSubmit={addDraft}>
        <label className="grid gap-2 text-sm font-medium text-ink-body">
          Tipo de consumo
          <select className="h-12 rounded-lg border border-surface-border bg-surface-panel px-3 text-base text-ink-strong" value={type} onChange={(event) => setType(event.target.value as ConsumptionType)}>
            {consumptionTypes.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
          <Input label="Nome revisado" value={name} placeholder="Ex.: Refrigerante lata" onChange={(event) => setName(event.target.value)} />
          <Input label="Valor" value={amount} inputMode="decimal" placeholder="8,90" onChange={(event) => setAmount(event.target.value)} />
          <Button className="self-end" type="submit">
            <Plus aria-hidden="true" size={18} />
            Adicionar
          </Button>
        </div>
      </form>

      {drafts.length > 0 ? (
        <div className="grid gap-2">
          {drafts.map((draft) => (
            <div key={draft.id} className="grid gap-2 rounded-lg border border-surface-border bg-surface-muted p-3">
              <div className="text-xs font-semibold text-ink-muted">Pagina {draft.page}</div>
              <div className="grid gap-2 sm:grid-cols-[9rem_1fr_8rem]">
                <select className="h-11 rounded-lg border border-surface-border bg-surface-panel px-3 text-sm text-ink-strong" value={draft.type} onChange={(event) => updateDraft(draft.id, { type: event.target.value as ConsumptionType })}>
                  {consumptionTypes.map((option) => <option key={option}>{option}</option>)}
                </select>
                <Input value={draft.name} onChange={(event) => updateDraft(draft.id, { name: event.target.value })} />
                <Input value={draft.amount} inputMode="decimal" onChange={(event) => updateDraft(draft.id, { amount: event.target.value })} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {message ? <p className="text-sm text-ink-muted" role="status">{message}</p> : null}
      <Button disabled={isSaving || drafts.length === 0} onClick={() => void handleSave()}>
        <Save aria-hidden="true" size={18} />
        Salvar no cardapio da mesa
      </Button>
    </Card>
  );
}

