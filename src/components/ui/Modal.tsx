import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  description?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
};

export function Modal({ title, isOpen, onClose, children, description, initialFocusRef }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const nextFocus = initialFocusRef?.current ?? dialogRef.current?.querySelector<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    nextFocus?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [initialFocusRef, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/35 p-3 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="app-modal-title" aria-describedby={description ? 'app-modal-description' : undefined}>
      <div ref={dialogRef} className="max-h-[88vh] w-full max-w-lg overflow-auto rounded-lg border border-surface-border bg-surface-panel p-4 shadow-soft">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="app-modal-title" className="text-lg font-bold text-ink-strong">{title}</h2>
            {description ? <p id="app-modal-description" className="mt-1 text-sm text-ink-muted">{description}</p> : null}
          </div>
          <Button aria-label="Fechar" size="icon" variant="ghost" onClick={onClose}>
            <X aria-hidden="true" size={20} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
