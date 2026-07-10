import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { Modal } from '@/components/ui/Modal';
import { AppServiceError } from '@/lib/supabase/errors';
import type { ParticipantsRow, PaymentsRow, ReceiptScanItemsRow, ReceiptScansRow, TableSettingsRow, TablesRow } from '@/lib/supabase/types';
import { calculateBill, calculatePaymentSummary, type ParticipantPaymentSummary } from '@/domain/billing';
import { BillingSummary } from '@/features/billing/components/BillingSummary';
import { BillingExportActions } from '@/features/billing/components/BillingExportActions';
import { ItemForm, type ItemFormSubmitValues } from '@/features/items/components/ItemForm';
import { ItemList } from '@/features/items/components/ItemList';
import { ItemVoidDialog } from '@/features/items/components/ItemVoidDialog';
import { PaymentCancelDialog } from '@/features/payments/components/PaymentCancelDialog';
import { ReceiptOcrSection } from '@/features/receipt-ocr/components/ReceiptOcrSection';
import { PaymentForm, type PaymentFormSubmitValues } from '@/features/payments/components/PaymentForm';
import { PaymentHistory } from '@/features/payments/components/PaymentHistory';
import { MenuScanDraftPanel } from '@/features/menu/components/MenuScanDraftPanel';
import { ParticipantDeleteDialog } from '@/features/participants/components/ParticipantDeleteDialog';
import { ParticipantForm, type ParticipantFormSubmitValues } from '@/features/participants/components/ParticipantForm';
import { ParticipantList } from '@/features/participants/components/ParticipantList';
import { FutureTableAreas } from '@/features/tables/components/FutureTableAreas';
import { TableSharePanel } from '@/features/tables/components/TableSharePanel';
import { RealtimeStatusBadge } from '@/features/tables/components/RealtimeStatusBadge';
import { TableHeader } from '@/features/tables/components/TableHeader';
import { TableEntryGate, type TableEntryMenuChoice } from '@/features/tables/components/TableEntryGate';
import { InvalidTableNotice, TableStatusNotice } from '@/features/tables/components/TableStatusNotice';
import { useTableRealtime } from '@/features/tables/hooks/useTableRealtime';
import { listSavedBarMenus } from '@/domain/menu/menuStorage';
import { getLocalTableEntryProfile, rememberLatestTable, saveLocalTableEntryProfile } from '@/lib/storage/tableSessionStorage';
import type { TableMenuItemsRow } from '@/lib/supabase/types';
import { itemService, type ItemWithParticipants } from '@/services/itemService';
import { participantService, type ParticipantRemovalSafety } from '@/services/participantService';
import { paymentService } from '@/services/paymentService';
import { receiptScanService } from '@/services/receiptScanService';
import { receiptScanItemService } from '@/services/receiptScanItemService';
import { tableMenuService } from '@/services/tableMenuService';
import { tableService } from '@/services/tableService';
import { tableSettingsService } from '@/services/tableSettingsService';
import { validateShareToken } from '@/lib/sharing';

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

export function TablePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const normalizedShareToken = useMemo(() => (shareToken ?? '').trim(), [shareToken]);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [table, setTable] = useState<TablesRow | null>(null);
  const [participants, setParticipants] = useState<ParticipantsRow[]>([]);
  const [items, setItems] = useState<ItemWithParticipants[]>([]);
  const [tableSettings, setTableSettings] = useState<TableSettingsRow | null>(null);
  const [payments, setPayments] = useState<PaymentsRow[]>([]);
  const [receiptScans, setReceiptScans] = useState<ReceiptScansRow[]>([]);
  const [receiptScanItems, setReceiptScanItems] = useState<ReceiptScanItemsRow[]>([]);
  const [tableMenuItems, setTableMenuItems] = useState<TableMenuItemsRow[]>([]);
  const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);
  const [participantFormErrorMessage, setParticipantFormErrorMessage] = useState<string | null>(null);
  const [itemFormErrorMessage, setItemFormErrorMessage] = useState<string | null>(null);
  const [isSavingParticipant, setIsSavingParticipant] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantsRow | null>(null);
  const [editingItem, setEditingItem] = useState<ItemWithParticipants | null>(null);
  const [itemToVoid, setItemToVoid] = useState<ItemWithParticipants | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<{ participant: ParticipantPaymentSummary; mode: 'partial' | 'total' } | null>(null);
  const [paymentToCancel, setPaymentToCancel] = useState<PaymentsRow | null>(null);
  const [voidItemErrorMessage, setVoidItemErrorMessage] = useState<string | null>(null);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string | null>(null);
  const [participantToRemove, setParticipantToRemove] = useState<ParticipantsRow | null>(null);
  const [removalSafety, setRemovalSafety] = useState<ParticipantRemovalSafety | null>(null);
  const [isCheckingRemoval, setIsCheckingRemoval] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [hasCompletedEntry, setHasCompletedEntry] = useState(false);
  const [isAddActionOpen, setIsAddActionOpen] = useState(false);
  const [isManualItemOpen, setIsManualItemOpen] = useState(false);
  const [isReceiptScanOpen, setIsReceiptScanOpen] = useState(false);
  const [isMenuScanOpen, setIsMenuScanOpen] = useState(false);
  const [menuRevision, setMenuRevision] = useState(0);

  const isReadOnly = table?.status === 'closed' || table?.status === 'archived';
  const participantNames = useMemo(() => new Map(participants.map((participant) => [participant.id, participant.display_name])), [participants]);
  const menuItems = useMemo(() => {
    void menuRevision;
    return tableMenuItems.map((item) => ({ id: item.id, type: item.consumption_type, name: item.name, amount_cents: item.amount_cents }));
  }, [menuRevision, tableMenuItems]);

  const billingResult = useMemo(() => {
    if (!tableSettings) return null;

    return calculateBill({
      participants: participants.map((participant) => ({ id: participant.id, display_name: participant.display_name })),
      items: items.map((item) => ({ id: item.id, name: item.name, amount_cents: item.amount_cents, quantity: item.quantity, status: item.status })),
      itemParticipants: items.flatMap((item) => item.participants.map((participant) => ({ item_id: item.id, participant_id: participant.participant_id, share_weight: participant.share_weight, assignment_type: participant.assignment_type }))),
      settings: {
        service_fee_percent: tableSettings.service_fee_percent,
        cover_charge_cents: tableSettings.cover_charge_cents,
        minimum_consumption_cents: tableSettings.minimum_consumption_cents,
        rounding_strategy: tableSettings.rounding_strategy,
      },
    });
  }, [items, participants, tableSettings]);

  const paymentSummary = useMemo(() => (billingResult && table ? calculatePaymentSummary(billingResult, payments, table.id) : null), [billingResult, payments, table]);

  const loadTable = useCallback(async (options: { showLoading?: boolean } = {}) => {
    const showLoading = options.showLoading ?? true;
    const tokenValidation = validateShareToken(normalizedShareToken);
    if (!tokenValidation.ok) {
      setPageState('invalid_token');
      setPageErrorMessage(tokenValidation.error === 'Token da mesa vazio.' ? 'O link da mesa esta vazio. Abra novamente pelo link compartilhado.' : 'Este link de mesa nao parece valido. Confira se ele foi copiado por completo.');
      return;
    }

    if (showLoading) setPageState('loading');
    setPageErrorMessage(null);

    try {
      const foundTable = await tableService.getByShareToken(tokenValidation.token);
      rememberLatestTable(tokenValidation.token);
      const [foundParticipants, foundItems, foundSettings, foundPayments, foundReceiptScans, foundReceiptScanItems, foundMenuItems] = await Promise.all([
        participantService.listByTableId(foundTable.id),
        itemService.listWithParticipantsByTableId(foundTable.id),
        tableSettingsService.getByTableId(foundTable.id),
        paymentService.listByTableId(foundTable.id),
        receiptScanService.listByTableId(foundTable.id),
        receiptScanItemService.listByTableId(foundTable.id),
        tableMenuService.listByTableId(foundTable.id),
      ]);
      setTable(foundTable);
      setParticipants(foundParticipants);
      setItems(foundItems);
      setTableSettings(foundSettings);
      setPayments(foundPayments);
      setReceiptScans(foundReceiptScans);
      setReceiptScanItems(foundReceiptScanItems);
      setTableMenuItems(foundMenuItems);
      setHasCompletedEntry(Boolean(getLocalTableEntryProfile(tokenValidation.token)));
      setPageState('ready');
    } catch (error) {
      if (showLoading) {
        setTable(null);
        setParticipants([]);
        setItems([]);
        setTableSettings(null);
        setPayments([]);
        setReceiptScans([]);
        setReceiptScanItems([]);
        setTableMenuItems([]);
        setPageState(getPageStateFromError(error));
      }
      setPageErrorMessage(getErrorMessage(error));
    }
  }, [normalizedShareToken]);

  useEffect(() => {
    void loadTable();
  }, [loadTable]);

  const { status: realtimeStatus, reconcile: reconcileRealtime } = useTableRealtime({
    tableId: table?.id ?? null,
    enabled: pageState === 'ready' && Boolean(table),
    onReconcile: async () => {
      await loadTable({ showLoading: false });
    },
    onError: (error) => {
      setPageErrorMessage(getErrorMessage(error));
    },
  });

  async function refreshParticipants(tableId: string) {
    const nextParticipants = await participantService.listByTableId(tableId);
    setParticipants(nextParticipants);
  }

  async function refreshItems(tableId: string) {
    const nextItems = await itemService.listWithParticipantsByTableId(tableId);
    setItems(nextItems);
  }

  async function refreshPayments(tableId: string) {
    const nextPayments = await paymentService.listByTableId(tableId);
    setPayments(nextPayments);
  }

  async function refreshReceiptOcr(tableId: string) {
    const [nextScans, nextScanItems, nextItems] = await Promise.all([
      receiptScanService.listByTableId(tableId),
      receiptScanItemService.listByTableId(tableId),
      itemService.listWithParticipantsByTableId(tableId),
    ]);
    setReceiptScans(nextScans);
    setReceiptScanItems(nextScanItems);
    setItems(nextItems);
  }

  async function refreshTableMenu(tableId: string) {
    const nextMenuItems = await tableMenuService.listByTableId(tableId);
    setTableMenuItems(nextMenuItems);
    setMenuRevision((current) => current + 1);
  }

  async function persistEntryMenuChoice(tableId: string, menuChoice: TableEntryMenuChoice) {
    if (menuChoice.mode === 'saved' && menuChoice.savedBarId) {
      const savedBar = listSavedBarMenus().find((bar) => bar.id === menuChoice.savedBarId);
      if (!savedBar) throw new Error('Cardapio salvo nao encontrado neste aparelho.');
      await tableMenuService.copySavedItemsToTable(tableId, savedBar.items);
      await refreshTableMenu(tableId);
      return;
    }

    if (menuChoice.mode === 'new' && menuChoice.newMenuName) {
      await refreshTableMenu(tableId);
    }
  }

  async function handleCreateParticipant(values: ParticipantFormSubmitValues) {
    if (!table || isReadOnly) return;

    setIsSavingParticipant(true);
    setParticipantFormErrorMessage(null);

    try {
      await participantService.create({ table_id: table.id, ...values });
      await refreshParticipants(table.id);
    } catch (error) {
      setParticipantFormErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingParticipant(false);
    }
  }

  async function handleCompleteEntry(values: ParticipantFormSubmitValues, menuChoice: TableEntryMenuChoice) {
    if (!table) return;

    setIsSavingParticipant(true);
    setParticipantFormErrorMessage(null);

    try {
      const normalizedName = values.display_name.trim().toLocaleLowerCase('pt-BR');
      const existingParticipant = participants.find((participant) => participant.display_name.trim().toLocaleLowerCase('pt-BR') === normalizedName);
      const participant = existingParticipant ?? await participantService.create({ table_id: table.id, ...values });

      await persistEntryMenuChoice(table.id, menuChoice);

      saveLocalTableEntryProfile({
        shareToken: normalizedShareToken,
        participantId: participant.id,
        displayName: participant.display_name,
        arrivalAt: participant.arrival_at,
      });
      if (!existingParticipant) await refreshParticipants(table.id);
      setHasCompletedEntry(true);
    } catch (error) {
      setParticipantFormErrorMessage(getErrorMessage(error));
      throw error;
    } finally {
      setIsSavingParticipant(false);
    }
  }

  function handleSkipEntryGate() {
    if (!table) return;

    saveLocalTableEntryProfile({
      shareToken: normalizedShareToken,
      participantId: 'local-bypass',
      displayName: 'Acesso local',
      arrivalAt: new Date().toISOString(),
    });
    setHasCompletedEntry(true);
  }

  async function handleUpdateParticipant(values: ParticipantFormSubmitValues) {
    if (!table || !editingParticipant || isReadOnly) return;

    setIsSavingParticipant(true);
    setParticipantFormErrorMessage(null);

    try {
      await participantService.update(editingParticipant.id, values);
      await refreshParticipants(table.id);
      await refreshItems(table.id);
      setEditingParticipant(null);
    } catch (error) {
      setParticipantFormErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingParticipant(false);
    }
  }

  async function handleSaveItem(values: ItemFormSubmitValues) {
    if (!table || isReadOnly) return false;

    setIsSavingItem(true);
    setItemFormErrorMessage(null);

    try {
      await itemService.upsertManualWithParticipants({
        table_id: table.id,
        item_id: editingItem?.id ?? null,
        ...values,
      });
      await refreshItems(table.id);
      setEditingItem(null);
      return true;
    } catch (error) {
      setItemFormErrorMessage(getErrorMessage(error));
      return false;
    } finally {
      setIsSavingItem(false);
    }
  }

  async function handleVoidItem() {
    if (!table || !itemToVoid || isReadOnly) return;

    setIsSavingItem(true);
    setVoidItemErrorMessage(null);

    try {
      await itemService.voidManualItem(table.id, itemToVoid.id);
      await refreshItems(table.id);
      setItemToVoid(null);
    } catch (error) {
      setVoidItemErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingItem(false);
    }
  }

  async function handleRegisterPayment(values: PaymentFormSubmitValues) {
    if (!table || !paymentTarget || isReadOnly) return;

    setIsSavingPayment(true);
    setPaymentErrorMessage(null);

    try {
      await paymentService.register({
        table_id: table.id,
        participant_id: paymentTarget.participant.participant_id,
        amount_cents: values.amount_cents,
        payment_type: paymentTarget.mode,
        paid_at: values.paid_at,
        notes: values.notes,
      });
      if (values.departure_at) {
        await participantService.update(paymentTarget.participant.participant_id, { departure_at: values.departure_at });
        await refreshParticipants(table.id);
      }
      await refreshPayments(table.id);
      setPaymentTarget(null);
    } catch (error) {
      setPaymentErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingPayment(false);
    }
  }

  async function handleCancelPayment() {
    if (!table || !paymentToCancel) return;

    setIsSavingPayment(true);
    setPaymentErrorMessage(null);

    try {
      await paymentService.cancel(paymentToCancel.id);
      await refreshPayments(table.id);
      setPaymentToCancel(null);
    } catch (error) {
      setPaymentErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingPayment(false);
    }
  }

  async function handleRequestRemove(participant: ParticipantsRow) {
    setParticipantToRemove(participant);
    setRemovalSafety(null);
    setDeleteErrorMessage(null);
    setIsCheckingRemoval(true);

    try {
      const safety = await participantService.getRemovalSafety(participant.id);
      setRemovalSafety(safety);
    } catch (error) {
      setDeleteErrorMessage(getErrorMessage(error));
    } finally {
      setIsCheckingRemoval(false);
    }
  }

  async function handleConfirmRemove() {
    if (!table || !participantToRemove || isReadOnly) return;

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      await participantService.remove(participantToRemove.id);
      await refreshParticipants(table.id);
      await refreshItems(table.id);
      setParticipantToRemove(null);
      setRemovalSafety(null);
    } catch (error) {
      setDeleteErrorMessage(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  if (pageState === 'loading') {
    return <LoadingState label="Carregando mesa..." />;
  }

  if (pageState !== 'ready' || !table) {
    const fallback = pageState === 'not_found' ? 'Nao encontramos uma mesa com esse link.' : pageState === 'connection_failed' ? 'Nao foi possivel conectar ao Supabase agora.' : pageState === 'invalid_token' ? 'O link informado nao pode ser usado para acessar uma mesa.' : 'Nao foi possivel abrir esta mesa.';

    return (
      <div className="grid gap-4">
        <InvalidTableNotice title="Mesa indisponivel" description={pageErrorMessage ?? fallback} />
        <Button variant="secondary" onClick={() => void loadTable()} disabled={pageState === 'invalid_token'}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!hasCompletedEntry && table.status !== 'archived') {
    return (
      <>
        <TableEntryGate
          shareToken={normalizedShareToken}
          tableName={table.name}
          isSubmitting={isSavingParticipant}
          errorMessage={participantFormErrorMessage}
          onSubmit={handleCompleteEntry}
          onSkipEntry={handleSkipEntryGate}
          onOpenScan={() => setIsMenuScanOpen(true)}
        />
        <Modal title="Escanear cardapio" isOpen={isMenuScanOpen} onClose={() => setIsMenuScanOpen(false)}>
          <MenuScanDraftPanel
            isSaving={isSavingItem}
            onSave={async (draftItems) => {
              await tableMenuService.addItems(table.id, draftItems.map((item) => ({ consumption_type: item.type, name: item.name, amount_cents: item.amount_cents, source: 'menu_scan' })));
              await refreshTableMenu(table.id);
              setIsMenuScanOpen(false);
            }}
          />
        </Modal>
      </>
    );
  }

  return (
    <div className="grid gap-5">
      <TableHeader table={table} participantCount={participants.length} onShare={table.status === 'archived' ? undefined : () => setIsSharePanelOpen(true)} />
      <RealtimeStatusBadge status={realtimeStatus} />
      <TableStatusNotice status={table.status} />
      <TableSharePanel isOpen={isSharePanelOpen} onClose={() => setIsSharePanelOpen(false)} tableName={table.name} shareToken={table.share_token} />

      {billingResult ? (
        <>
          <BillingSummary
            result={billingResult}
            paymentSummary={paymentSummary}
            receiptItems={items}
            onOpenAddItem={!isReadOnly ? () => setIsAddActionOpen(true) : undefined}
            onOpenScanReceipt={!isReadOnly ? () => setIsReceiptScanOpen(true) : undefined}
            onRegisterPartialPayment={(participant) => setPaymentTarget({ participant, mode: 'partial' })}
            onRegisterFullPayment={(participant) => setPaymentTarget({ participant, mode: 'total' })}
          />
          <BillingExportActions tableName={table.name} billing={billingResult} payments={paymentSummary} />
        </>
      ) : null}

      <section className="grid gap-3">
        <div>
          <Badge tone="green">Participantes</Badge>
          <h2 className="mt-2 text-xl font-bold text-ink-strong">Quem esta na mesa</h2>
        </div>

        {!isReadOnly ? (
          <div className="grid gap-2">
            <ParticipantForm isSubmitting={isSavingParticipant} showDeparture={false} onSubmit={handleCreateParticipant} />
            {participantFormErrorMessage ? <p className="text-sm font-medium text-red-700 dark:text-red-200">{participantFormErrorMessage}</p> : null}
          </div>
        ) : null}
      </section>

      {editingParticipant ? (
        <Card className="grid gap-3 border-brand-purple/70">
          <div>
            <Badge tone="purple">Editando</Badge>
            <h2 className="mt-2 text-lg font-bold text-ink-strong">{editingParticipant.display_name}</h2>
          </div>
          <ParticipantForm participant={editingParticipant} framed={false} isSubmitting={isSavingParticipant} submitLabel="Salvar alteracoes" onSubmit={handleUpdateParticipant} onCancel={() => setEditingParticipant(null)} />
        </Card>
      ) : null}

      <ParticipantList participants={participants} disabled={isReadOnly || isSavingParticipant} onEdit={setEditingParticipant} onRequestRemove={handleRequestRemove} />

      <section className="grid gap-3">
        <div>
          <Badge tone="blue">Itens manuais</Badge>
          <h2 className="mt-2 text-xl font-bold text-ink-strong">O que foi consumido</h2>
        </div>

        {!isReadOnly ? (
          <div className="grid gap-2">
            <Button variant="ghost" onClick={() => setIsAddActionOpen(true)}>Adicionar pela previa da nota</Button>
            {itemFormErrorMessage ? <p className="text-sm font-medium text-red-700 dark:text-red-200">{itemFormErrorMessage}</p> : null}
          </div>
        ) : null}
      </section>

      <ItemList items={items} disabled={isReadOnly || isSavingItem} onEdit={setEditingItem} onVoid={setItemToVoid} />

      <PaymentHistory payments={payments} participantNames={participantNames} isSubmitting={isSavingPayment} onCancelPayment={setPaymentToCancel} />

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => void reconcileRealtime()}>
          Atualizar dados
        </Button>
      </div>

      <FutureTableAreas onMenusChanged={() => setMenuRevision((current) => current + 1)} />

      <Modal title="Adicionar na nota" isOpen={isAddActionOpen} onClose={() => setIsAddActionOpen(false)}>
        <div className="grid gap-3">
          <Button onClick={() => { setIsAddActionOpen(false); setIsManualItemOpen(true); }}>Adicionar item manualmente</Button>
          <Button variant="secondary" onClick={() => { setIsAddActionOpen(false); setIsReceiptScanOpen(true); }}>Escanear nota</Button>
        </div>
      </Modal>

      <Modal title="Adicionar item manualmente" isOpen={isManualItemOpen} onClose={() => setIsManualItemOpen(false)}>
        <ItemForm
          participants={participants}
          menuItems={menuItems}
          isSubmitting={isSavingItem}
          onSubmit={async (values) => {
            const saved = await handleSaveItem(values);
            if (saved) setIsManualItemOpen(false);
          }}
          onCancel={() => setIsManualItemOpen(false)}
        />
        {itemFormErrorMessage ? <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-200">{itemFormErrorMessage}</p> : null}
      </Modal>

      <Modal title="Escanear nota" isOpen={isReceiptScanOpen} onClose={() => setIsReceiptScanOpen(false)}>
        <ReceiptOcrSection
          tableId={table.id}
          isReadOnly={isReadOnly}
          participants={participants}
          scans={receiptScans}
          scanItems={receiptScanItems}
          appCalculatedTotalCents={billingResult?.totals.grand_total_cents ?? 0}
          onRefresh={() => refreshReceiptOcr(table.id)}
        />
      </Modal>

      <Modal title="Editar item" isOpen={Boolean(editingItem)} onClose={() => setEditingItem(null)}>
        {editingItem ? <ItemForm item={editingItem} participants={participants} menuItems={menuItems} isSubmitting={isSavingItem} onSubmit={handleSaveItem} onCancel={() => setEditingItem(null)} /> : null}
        {itemFormErrorMessage ? <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-200">{itemFormErrorMessage}</p> : null}
      </Modal>

      <Modal title="Registrar pagamento" isOpen={Boolean(paymentTarget)} onClose={() => setPaymentTarget(null)}>
        {paymentTarget ? (
          <PaymentForm
            participantName={paymentTarget.participant.display_name}
            remainingBalanceCents={paymentTarget.participant.remaining_balance_cents}
            defaultAmountCents={paymentTarget.mode === 'total' ? paymentTarget.participant.remaining_balance_cents : undefined}
            isSubmitting={isSavingPayment}
            onSubmit={handleRegisterPayment}
            onCancel={() => setPaymentTarget(null)}
          />
        ) : null}
        {paymentErrorMessage ? <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-200">{paymentErrorMessage}</p> : null}
      </Modal>

      <PaymentCancelDialog
        payment={paymentToCancel}
        participantName={paymentToCancel ? participantNames.get(paymentToCancel.participant_id) ?? 'Participante' : ''}
        isSubmitting={isSavingPayment}
        errorMessage={paymentErrorMessage}
        onClose={() => setPaymentToCancel(null)}
        onConfirm={() => void handleCancelPayment()}
      />

      <ItemVoidDialog item={itemToVoid} isOpen={Boolean(itemToVoid)} isSubmitting={isSavingItem} errorMessage={voidItemErrorMessage} onClose={() => setItemToVoid(null)} onConfirm={() => void handleVoidItem()} />

      <ParticipantDeleteDialog
        participantName={participantToRemove?.display_name ?? ''}
        isOpen={Boolean(participantToRemove)}
        isChecking={isCheckingRemoval}
        isDeleting={isDeleting}
        safety={removalSafety}
        errorMessage={deleteErrorMessage}
        onClose={() => {
          setParticipantToRemove(null);
          setRemovalSafety(null);
          setDeleteErrorMessage(null);
        }}
        onConfirm={() => void handleConfirmRemove()}
      />
    </div>
  );
}
