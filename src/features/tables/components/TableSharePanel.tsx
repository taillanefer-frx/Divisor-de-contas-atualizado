import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { copyTextToClipboard, shareTableLink, buildTableShareUrl, validateShareToken } from '@/lib/sharing';
import { QrCodePreview } from '@/features/tables/components/QrCodePreview';

type TableSharePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  shareToken: string | null | undefined;
};

type Feedback = { tone: 'success' | 'error' | 'neutral'; message: string } | null;

export function TableSharePanel({ isOpen, onClose, tableName, shareToken }: TableSharePanelProps) {
  const [copyFeedback, setCopyFeedback] = useState<Feedback>(null);
  const [shareFeedback, setShareFeedback] = useState<Feedback>(null);
  const copyTimerRef = useRef<number | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const shareUrl = useMemo(() => {
    try {
      return buildTableShareUrl(shareToken);
    } catch {
      return null;
    }
  }, [shareToken]);

  const tokenValidation = validateShareToken(shareToken);
  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  function scheduleFeedbackClear() {
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopyFeedback(null), 3000);
  }

  async function handleCopy() {
    if (!shareUrl) {
      setCopyFeedback({ tone: 'error', message: 'Link indisponivel para copia.' });
      return;
    }

    const result = await copyTextToClipboard(shareUrl);

    if (result === 'copied') {
      setCopyFeedback({ tone: 'success', message: 'Link copiado.' });
    } else {
      linkInputRef.current?.select();
      setCopyFeedback({ tone: 'error', message: 'Nao foi possivel copiar. Selecione o link manualmente.' });
    }

    scheduleFeedbackClear();
  }

  async function handleNativeShare() {
    if (!shareUrl) {
      setShareFeedback({ tone: 'error', message: 'Link indisponivel para compartilhamento.' });
      return;
    }

    const result = await shareTableLink({
      title: 'Entre na mesa ' + tableName,
      text: 'Abra o link para participar da divisao da conta.',
      url: shareUrl,
    });

    if (result === 'shared') setShareFeedback({ tone: 'success', message: 'Compartilhamento aberto.' });
    if (result === 'canceled') setShareFeedback({ tone: 'neutral', message: 'Compartilhamento cancelado.' });
    if (result === 'unsupported') setShareFeedback({ tone: 'neutral', message: 'Compartilhamento nativo indisponivel neste navegador.' });
    if (result === 'failed') setShareFeedback({ tone: 'error', message: 'Nao foi possivel compartilhar agora.' });
  }

  return (
    <Modal title="Compartilhar mesa" description="Use o QR Code ou o link para convidar outras pessoas." isOpen={isOpen} onClose={onClose}>
      <div className="grid gap-4">
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">Mesa</p>
          <h3 className="truncate text-xl font-bold text-ink-strong" title={tableName}>{tableName}</h3>
        </div>

        {!tokenValidation.ok || !shareUrl ? (
          <Card className="border-brand-red/70 bg-brand-red/20 text-sm text-ink-body">
            Nao foi possivel gerar um link valido para esta mesa. Tente recarregar a pagina.
          </Card>
        ) : (
          <>
            <div className="grid place-items-center">
              <QrCodePreview value={shareUrl} label={'QR Code da mesa ' + tableName} />
            </div>
            <p className="text-center text-sm text-ink-muted">Aponte a camera de outro celular para entrar nesta mesa.</p>

            <Input ref={linkInputRef} label="Link da mesa" value={shareUrl} readOnly onFocus={(event) => event.target.select()} />

            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={handleCopy}>
                {copyFeedback?.tone === 'success' ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
                {copyFeedback?.tone === 'success' ? 'Link copiado' : 'Copiar link'}
              </Button>
              {canNativeShare ? (
                <Button onClick={handleNativeShare}>
                  <Share2 aria-hidden="true" size={18} />
                  Compartilhar
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => linkInputRef.current?.select()}>
                  <ExternalLink aria-hidden="true" size={18} />
                  Selecionar link
                </Button>
              )}
            </div>

            <div className="grid gap-1 text-sm" aria-live="polite">
              {copyFeedback ? <p className={copyFeedback.tone === 'error' ? 'text-red-700 dark:text-red-200' : 'text-ink-muted'}>{copyFeedback.message}</p> : null}
              {shareFeedback ? <p className={shareFeedback.tone === 'error' ? 'text-red-700 dark:text-red-200' : 'text-ink-muted'}>{shareFeedback.message}</p> : null}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
