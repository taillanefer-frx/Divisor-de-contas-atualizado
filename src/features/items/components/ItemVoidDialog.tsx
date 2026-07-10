import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { ItemWithParticipants } from '@/services/itemService';

type ItemVoidDialogProps = {
  item: ItemWithParticipants | null;
  isOpen: boolean;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function ItemVoidDialog({ item, isOpen, isSubmitting, errorMessage, onClose, onConfirm }: ItemVoidDialogProps) {
  return (
    <Modal title="Anular item" isOpen={isOpen} onClose={onClose}>
      <div className="grid gap-4 text-sm text-ink-body">
        <div className="flex gap-3 rounded-lg bg-brand-red/20 p-3">
          <Ban aria-hidden="true" className="mt-0.5 shrink-0 text-red-700 dark:text-red-200" size={20} />
          <div className="grid gap-2">
            <p className="font-semibold text-ink-strong">{item?.name ?? 'Item'}</p>
            <p>O item sera mantido no historico como anulado e nao deve entrar nos calculos futuros.</p>
            <p>Nenhum registro relacionado sera apagado silenciosamente.</p>
          </div>
        </div>
        {errorMessage ? <p className="text-red-700 dark:text-red-200">{errorMessage}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" disabled={isSubmitting} onClick={onClose}>Cancelar</Button>
          <Button variant="danger" disabled={isSubmitting} onClick={onConfirm}>Anular item</Button>
        </div>
      </div>
    </Modal>
  );
}
