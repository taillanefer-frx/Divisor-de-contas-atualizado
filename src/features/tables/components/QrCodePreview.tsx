import { QRCodeSVG } from 'qrcode.react';

type QrCodePreviewProps = {
  value: string;
  label?: string;
};

export function QrCodePreview({ value, label = 'QR Code da mesa' }: QrCodePreviewProps) {
  return (
    <figure className="grid aspect-square w-full max-w-64 place-items-center rounded-lg border border-surface-border bg-white p-4 shadow-soft">
      <QRCodeSVG value={value} size={224} bgColor="#ffffff" fgColor="#263238" level="M" includeMargin className="h-full w-full" aria-label={label} />
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
