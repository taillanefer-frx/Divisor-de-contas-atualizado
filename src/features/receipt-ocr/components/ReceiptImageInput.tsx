import { useEffect, useId, useMemo, useState, type ChangeEvent } from 'react';
import { Camera, RefreshCw, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { validateReceiptImageFile, RECEIPT_IMAGE_MAX_BYTES } from '@/domain/receipt-ocr';

const maxSizeMb = Math.floor(RECEIPT_IMAGE_MAX_BYTES / 1024 / 1024);

type ReceiptImageInputProps = {
  disabled?: boolean;
  title?: string;
  submitLabel?: string;
  onUpload: (file: File) => Promise<void> | void;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB';
  return (size / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
}

export function ReceiptImageInput({ disabled = false, title = 'Foto da nota', submitLabel = 'Ler nota no aparelho', onUpload }: ReceiptImageInputProps) {
  const inputId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validation = useMemo(() => validateReceiptImageFile(selectedFile), [selectedFile]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [selectedFile]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setErrorMessage(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const nextValidation = validateReceiptImageFile(file);
    if (!nextValidation.ok) {
      setSelectedFile(null);
      setErrorMessage(nextValidation.error);
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    const nextValidation = validateReceiptImageFile(selectedFile);
    if (!nextValidation.ok) {
      setErrorMessage(nextValidation.error);
      return;
    }

    await onUpload(selectedFile);
    setSelectedFile(null);
  }

  return (
    <Card className="grid gap-4">
      <div className="grid gap-2">
        <h3 className="text-lg font-bold text-ink-strong">{title}</h3>
        <p className="text-sm leading-6 text-ink-muted">Fotografe a nota inteira em um lugar claro, sem reflexo e com o texto legivel. O OCR ajuda, mas a revisao humana continua obrigatoria.</p>
        <p className="text-xs text-ink-muted">Formatos aceitos: JPEG, PNG e WebP. Tamanho maximo: {maxSizeMb} MB. A imagem nao e enviada por padrao.</p>
      </div>

      <input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={disabled} onChange={handleFileChange} />

      <div className="flex flex-col gap-2 sm:flex-row">
<label htmlFor={inputId} className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-slate-950 transition hover:brightness-95 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-purple focus-within:ring-offset-2 focus-within:ring-offset-surface-canvas">
          <Camera aria-hidden="true" size={18} />
          Tirar ou escolher foto
        </label>
        {selectedFile ? (
          <Button variant="ghost" onClick={() => setSelectedFile(null)} disabled={disabled}>
            <X aria-hidden="true" size={18} />
            Trocar foto
          </Button>
        ) : null}
      </div>

      {errorMessage ? <p className="rounded-lg bg-brand-red/20 p-3 text-sm text-ink-body" role="alert">{errorMessage}</p> : null}

      {selectedFile && previewUrl ? (
        <div className="grid gap-3">
          <img src={previewUrl} alt="Pre-visualizacao da nota escolhida" className="max-h-[55vh] w-full rounded-lg border border-surface-border object-contain" />
          <div className="grid gap-1 text-sm text-ink-muted">
            <p>{selectedFile.name} - {formatFileSize(selectedFile.size)}</p>
            {validation.ok ? validation.warnings.map((warning) => <p key={warning}>{warning}</p>) : null}
          </div>
          <Button onClick={handleUpload} disabled={disabled || !validation.ok}>
            {disabled ? <RefreshCw aria-hidden="true" size={18} /> : <UploadCloud aria-hidden="true" size={18} />}
            {submitLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
