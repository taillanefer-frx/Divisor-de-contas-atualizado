import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { ParticipantRemovalSafety } from '@/services/participantService';

type ParticipantDeleteDialogProps = {
  participantName: string;
  isOpen: boolean;
  isChecking: boolean;
  isDeleting: boolean;
  safety: ParticipantRemovalSafety | null;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function ParticipantDeleteDialog({ participantName, isOpen, isChecking, isDeleting, safety, errorMessage, onClose, onConfirm }: ParticipantDeleteDialogProps) {
  const isBlocked = Boolean(safety && !safety.canRemove);

  return (
    <Modal title="Remover participante" isOpen={isOpen} onClose={onClose}>
      <div className="grid gap-4">
        <div className="flex gap-3 rounded-lg bg-surface-muted p-3 text-sm text-ink-body">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0 text-red-700 dark:text-red-200" size={20} />
          <div className="grid gap-2">
            <p className="font-semibold text-ink-strong">{participantName}</p>
            {isChecking ? <p>Verificando se existe historico vinculado a esta pessoa...</p> : null}
            {!isChecking && !isBlocked ? <p>Esta pessoa nao tem itens, pagamentos ou aceite individual vinculados. A remocao pode ser feita com seguranca.</p> : null}
            {isBlocked ? <p>Esta pessoa ja possui historico vinculado. Para preservar a conta e a auditoria, registre o horario de saida em vez de remover.</p> : null}
            {errorMessage ? <p className="text-red-700 dark:text-red-200">{errorMessage}</p> : null}
          </div>
        </div>

        {isBlocked ? (
          <ul className="grid gap-2 text-sm text-ink-muted">
            {safety?.hasItemLinks ? <li>Possui itens associados.</li> : null}
            {safety?.hasPayments ? <li>Possui pagamentos registrados.</li> : null}
            {safety?.hasConsentLogs ? <li>Possui registro de aceite individual.</li> : null}
          </ul>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Fechar
          </Button>
          {!isBlocked ? (
            <Button variant="danger" onClick={onConfirm} disabled={isChecking || isDeleting || Boolean(errorMessage)}>
              <Trash2 aria-hidden="true" size={18} />
              Remover definitivamente
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
