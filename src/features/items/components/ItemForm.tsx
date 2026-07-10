import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Save, ShoppingBasket, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { fromDatetimeLocalValue, getCurrentDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/date/dateTime';
import { centsToCurrencyInput, parseCurrencyToCents } from '@/lib/money/money';
import { getEligibleParticipantIds } from '@/domain/time/participantPresence';
import type { SavedMenuItem } from '@/domain/menu/menuStorage';
import type { ItemParticipantAssignmentType, ParticipantsRow } from '@/lib/supabase/types';
import type { ItemWithParticipants } from '@/services/itemService';
import { ItemParticipantPicker, type SelectedParticipant } from '@/features/items/components/ItemParticipantPicker';
import { hasItemFormErrors, validateItemForm, type ItemFormErrors } from '@/features/items/validation/itemValidation';

type ItemFormSubmitValues = {
  name: string;
  amount_cents: number;
  quantity: number;
  consumed_at: string;
  notes: string | null;
  participants: SelectedParticipant[];
};

type ItemFormProps = {
  participants: ParticipantsRow[];
  menuItems?: SavedMenuItem[];
  item?: ItemWithParticipants;
  isSubmitting?: boolean;
  onSubmit: (values: ItemFormSubmitValues) => Promise<unknown> | unknown;
  onCancel?: () => void;
};

function toSelectedParticipant(participant_id: string, assignment_type: ItemParticipantAssignmentType): SelectedParticipant {
  return {
    participant_id,
    assignment_type: assignment_type === 'suggested' ? 'suggested' : 'manual',
  };
}

function toIsoOrEmpty(localValue: string) {
  if (!localValue) return '';

  try {
    return fromDatetimeLocalValue(localValue);
  } catch {
    return '';
  }
}

export function ItemForm({ participants, menuItems = [], item, isSubmitting = false, onSubmit, onCancel }: ItemFormProps) {
  const initialConsumedAt = item ? toDatetimeLocalValue(item.consumed_at) : getCurrentDatetimeLocalValue();
  const initialEligibleIds = useMemo(() => getEligibleParticipantIds(participants, item?.consumed_at ?? toIsoOrEmpty(initialConsumedAt)), [participants, item, initialConsumedAt]);
  const existingAssignmentTypes = useMemo(() => new Map(item?.participants.map((participant) => [participant.participant_id, participant.assignment_type]) ?? []), [item]);

  const [values, setValues] = useState({
    menu_item_id: '',
    name: item?.name ?? '',
    amount: item ? centsToCurrencyInput(item.amount_cents) : '',
    quantity: item ? String(item.quantity) : '1',
    consumed_at: initialConsumedAt,
    notes: item?.notes ?? '',
  });
  const [errors, setErrors] = useState<ItemFormErrors>({});
  const [hasTouchedParticipants, setHasTouchedParticipants] = useState(Boolean(item));
  const [manualOverrideIds, setManualOverrideIds] = useState<Set<string>>(new Set());
  const [pendingManualRemoval, setPendingManualRemoval] = useState<ParticipantsRow | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<SelectedParticipant[]>(() => {
    if (item) {
      return item.participants.map((assignment) => toSelectedParticipant(assignment.participant_id, assignment.assignment_type));
    }

    return participants.filter((participant) => initialEligibleIds.has(participant.id)).map((participant) => ({ participant_id: participant.id, assignment_type: 'suggested' }));
  });

  const consumedAtIso = toIsoOrEmpty(values.consumed_at);
  const eligibleParticipantIds = useMemo(() => (consumedAtIso ? getEligibleParticipantIds(participants, consumedAtIso) : new Set<string>()), [participants, consumedAtIso]);

  useEffect(() => {
    if (item || hasTouchedParticipants || !consumedAtIso) return;
    setSelectedParticipants(participants.filter((participant) => eligibleParticipantIds.has(participant.id)).map((participant) => ({ participant_id: participant.id, assignment_type: 'suggested' })));
  }, [consumedAtIso, eligibleParticipantIds, hasTouchedParticipants, item, participants]);

  function toggleParticipant(participant: ParticipantsRow) {
    const isSelected = selectedParticipants.some((selected) => selected.participant_id === participant.id);
    const existingType = existingAssignmentTypes.get(participant.id);

    if (isSelected && existingType === 'manual') {
      setPendingManualRemoval(participant);
      return;
    }

    setHasTouchedParticipants(true);
    setManualOverrideIds((current) => new Set(current).add(participant.id));

    if (isSelected) {
      setSelectedParticipants((current) => current.filter((selected) => selected.participant_id !== participant.id));
      return;
    }

    setSelectedParticipants((current) => [...current, { participant_id: participant.id, assignment_type: 'manual' }]);
  }

  function setAllParticipants(assignment_type: ItemParticipantAssignmentType = 'manual') {
    setHasTouchedParticipants(true);
    setManualOverrideIds(new Set(participants.map((participant) => participant.id)));
    setSelectedParticipants(participants.map((participant) => ({ participant_id: participant.id, assignment_type: assignment_type === 'suggested' ? 'suggested' : 'manual' })));
  }

  function setEligibleParticipantsForExceptionMode() {
    setHasTouchedParticipants(true);
    setManualOverrideIds(new Set(participants.map((participant) => participant.id)));
    setSelectedParticipants(participants.map((participant) => ({ participant_id: participant.id, assignment_type: eligibleParticipantIds.has(participant.id) ? 'suggested' : 'manual' })));
  }

  function clearParticipants() {
    setHasTouchedParticipants(true);
    setManualOverrideIds(new Set());
    setSelectedParticipants([]);
  }

  function handleMenuItemChange(menuItemId: string) {
    const menuItem = menuItems.find((candidate) => candidate.id === menuItemId);
    setValues((current) => ({
      ...current,
      menu_item_id: menuItemId,
      name: menuItem ? menuItem.name : current.name,
      amount: menuItem ? centsToCurrencyInput(menuItem.amount_cents) : current.amount,
    }));
  }

  function confirmManualRemoval() {
    if (!pendingManualRemoval) return;

    setHasTouchedParticipants(true);
    setManualOverrideIds((current) => new Set(current).add(pendingManualRemoval.id));
    setSelectedParticipants((current) => current.filter((selected) => selected.participant_id !== pendingManualRemoval.id));
    setPendingManualRemoval(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateItemForm(values);
    setErrors(nextErrors);
    if (hasItemFormErrors(nextErrors)) return;

    const amount = parseCurrencyToCents(values.amount);
    if (!amount.ok) {
      setErrors((current) => ({ ...current, amount: amount.error }));
      return;
    }

    const finalParticipants = selectedParticipants.map((participant) => {
      const wasInitialSuggestion = initialEligibleIds.has(participant.participant_id);
      const wasManuallyChanged = manualOverrideIds.has(participant.participant_id);
      return {
        participant_id: participant.participant_id,
        assignment_type: wasInitialSuggestion && !wasManuallyChanged ? 'suggested' : 'manual',
      } satisfies SelectedParticipant;
    });

    await onSubmit({
      name: values.name.trim(),
      amount_cents: amount.cents,
      quantity: Number(values.quantity.trim()),
      consumed_at: fromDatetimeLocalValue(values.consumed_at),
      notes: values.notes.trim() ? values.notes.trim() : null,
      participants: finalParticipants,
    });

    if (!item) {
      setValues({ menu_item_id: '', name: '', amount: '', quantity: '1', consumed_at: getCurrentDatetimeLocalValue(), notes: '' });
      setErrors({});
      setHasTouchedParticipants(false);
      setManualOverrideIds(new Set());
    }
  }

  const selectedOutsideTime = selectedParticipants.filter((participant) => !eligibleParticipantIds.has(participant.participant_id));

  return (
    <Card className="grid gap-4">
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        {menuItems.length > 0 && !item ? (
          <label className="grid gap-2 text-sm font-medium text-ink-body">
            Escolher do cardapio
            <select className="h-12 rounded-lg border border-surface-border bg-surface-panel px-3 text-base text-ink-strong" value={values.menu_item_id} disabled={isSubmitting} onChange={(event) => handleMenuItemChange(event.target.value)}>
              <option value="">Cadastrar item novo</option>
              {menuItems.map((menuItem) => (
                <option key={menuItem.id} value={menuItem.id}>
                  {menuItem.type} - {menuItem.name} - {centsToCurrencyInput(menuItem.amount_cents)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <Input name="name" label="Item" placeholder="Ex.: Batata frita" value={values.name} maxLength={140} error={errors.name} disabled={isSubmitting} onChange={(event) => setValues((current) => ({ ...current, menu_item_id: '', name: event.target.value }))} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="amount" label="Valor unitario" placeholder="12,50" inputMode="decimal" value={values.amount} error={errors.amount} disabled={isSubmitting} onChange={(event) => setValues((current) => ({ ...current, menu_item_id: '', amount: event.target.value }))} />
          <Input name="quantity" label="Quantidade" type="number" inputMode="numeric" min={1} max={9999} step={1} value={values.quantity} error={errors.quantity} disabled={isSubmitting} onChange={(event) => setValues((current) => ({ ...current, quantity: event.target.value }))} />
        </div>
        <Input name="consumed_at" label="Horario de consumo" type="datetime-local" value={values.consumed_at} error={errors.consumed_at} disabled={isSubmitting} onChange={(event) => setValues((current) => ({ ...current, consumed_at: event.target.value }))} />
        <label className="grid gap-2 text-sm font-medium text-ink-body">
          Observacao opcional
          <textarea
            className="min-h-24 w-full rounded-lg border border-surface-border bg-surface-panel px-3 py-3 text-base text-ink-strong outline-none transition placeholder:text-ink-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
            value={values.notes}
            maxLength={500}
            disabled={isSubmitting}
            onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
          />
        </label>

        <ItemParticipantPicker
          participants={participants}
          selectedParticipants={selectedParticipants}
          eligibleParticipantIds={eligibleParticipantIds}
          disabled={isSubmitting}
          onToggle={toggleParticipant}
          onSelectAll={() => setAllParticipants('manual')}
          onSelectEligible={setEligibleParticipantsForExceptionMode}
          onClear={clearParticipants}
        />

        {selectedParticipants.length === 0 ? <p className="rounded-lg bg-brand-red/20 p-3 text-sm text-ink-body">Este item esta sem participantes. Isso e permitido nesta etapa, mas ele nao sera dividido ate alguem ser associado.</p> : null}
        {selectedOutsideTime.length > 0 ? <p className="rounded-lg bg-brand-red/20 p-3 text-sm text-ink-body">Ha participante selecionado fora do horario sugerido. A escolha manual sera respeitada.</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button variant="ghost" type="button" disabled={isSubmitting} onClick={onCancel}>
              <X aria-hidden="true" size={18} />
              Cancelar
            </Button>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {item ? <Save aria-hidden="true" size={18} /> : <ShoppingBasket aria-hidden="true" size={18} />}
            {item ? 'Salvar item' : 'Adicionar item'}
          </Button>
        </div>
      </form>

      <Modal title="Remover associacao manual" isOpen={Boolean(pendingManualRemoval)} onClose={() => setPendingManualRemoval(null)}>
        <div className="grid gap-4 text-sm text-ink-body">
          <p>Esta pessoa foi associada manualmente. Confirme para remover sem perder as outras escolhas do item.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setPendingManualRemoval(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmManualRemoval}>Remover associacao</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

export type { ItemFormSubmitValues };
