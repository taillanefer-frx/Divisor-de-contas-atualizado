import { Plus } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatMoney } from '@/lib/money/money';
import { addItemToBarMenu, consumptionTypes, listSavedBarMenus, saveBarMenu, type ConsumptionType, type SavedBarMenu } from '@/domain/menu/menuStorage';

type SavedBarMenusPanelProps = {
  onChanged?: () => void;
};

export function SavedBarMenusPanel({ onChanged }: SavedBarMenusPanelProps) {
  const [bars, setBars] = useState<SavedBarMenu[]>(() => listSavedBarMenus());
  const [barName, setBarName] = useState('');
  const [selectedBarId, setSelectedBarId] = useState(() => bars[0]?.id ?? '');
  const [itemType, setItemType] = useState<ConsumptionType>('Bebida');
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const selectedBar = useMemo(() => bars.find((bar) => bar.id === selectedBarId) ?? bars[0] ?? null, [bars, selectedBarId]);

  function refresh(nextBarId?: string) {
    const nextBars = listSavedBarMenus();
    setBars(nextBars);
    setSelectedBarId(nextBarId ?? selectedBarId ?? nextBars[0]?.id ?? '');
    onChanged?.();
  }

  function handleCreateBar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = barName.trim();
    if (!name) return;
    const bar = saveBarMenu({ name });
    setBarName('');
    setMessage('Bar salvo.');
    refresh(bar.id);
  }

  function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBar || !itemName.trim() || !itemAmount.trim()) return;

    try {
      const nextBar = addItemToBarMenu(selectedBar.id, { type: itemType, name: itemName, amount: itemAmount });
      setItemName('');
      setItemAmount('');
      setMessage('Item adicionado ao cardapio de ' + nextBar.name + '.');
      refresh(nextBar.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel adicionar o item.');
    }
  }

  return (
    <section className="grid gap-3">
      <div>
        <Badge tone="blue">Cardapios salvos</Badge>
        <h2 className="mt-2 text-xl font-bold text-ink-strong">Adicionar bar</h2>
      </div>

      <Card className="grid gap-4">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleCreateBar}>
          <Input label="Nome do bar" value={barName} maxLength={80} placeholder="Ex.: Bar da esquina" onChange={(event) => setBarName(event.target.value)} />
          <Button className="self-end" type="submit" disabled={!barName.trim()}>
            <Plus aria-hidden="true" size={18} />
            Salvar bar
          </Button>
        </form>

        {bars.length > 0 ? (
          <div className="grid gap-3">
            <label className="grid gap-2 text-sm font-medium text-ink-body">
              Bar
              <select className="h-12 rounded-lg border border-surface-border bg-surface-panel px-3 text-base text-ink-strong" value={selectedBar?.id ?? ''} onChange={(event) => setSelectedBarId(event.target.value)}>
                {bars.map((bar) => (
                  <option key={bar.id} value={bar.id}>
                    {bar.name} - {bar.items.length} itens
                  </option>
                ))}
              </select>
            </label>

            <form className="grid gap-3" onSubmit={handleAddItem}>
              <label className="grid gap-2 text-sm font-medium text-ink-body">
                Tipo de consumo
                <select className="h-12 rounded-lg border border-surface-border bg-surface-panel px-3 text-base text-ink-strong" value={itemType} onChange={(event) => setItemType(event.target.value as ConsumptionType)}>
                  {consumptionTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
                <Input label="Nome do item" value={itemName} placeholder="Ex.: Chopp claro" onChange={(event) => setItemName(event.target.value)} />
                <Input label="Valor" value={itemAmount} inputMode="decimal" placeholder="12,90" onChange={(event) => setItemAmount(event.target.value)} />
                <Button className="self-end" type="submit" disabled={!itemName.trim() || !itemAmount.trim()}>
                  <Plus aria-hidden="true" size={18} />
                  Adicionar
                </Button>
              </div>
            </form>

            {selectedBar ? (
              <div className="grid gap-2 rounded-lg bg-surface-muted p-3">
                <p className="text-sm font-semibold text-ink-strong">{selectedBar.items.length} itens no cardapio</p>
                {selectedBar.items.length === 0 ? <p className="text-sm text-ink-muted">Nenhum item salvo ainda.</p> : null}
                {selectedBar.items.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm text-ink-body">
                    <span className="min-w-0 truncate">{item.type} - {item.name}</span>
                    <span className="font-semibold">{formatMoney(item.amount_cents)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm leading-6 text-ink-muted">Crie um bar para salvar itens no cardapio dele.</p>
        )}

        {message ? <p className="text-sm text-ink-muted" role="status">{message}</p> : null}
      </Card>
    </section>
  );
}

