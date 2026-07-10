export type OcrRequestStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

export type OcrPreviewLine = {
  raw_text: string;
  recognized_name: string | null;
  recognized_amount_cents: number | null;
  confidence: number | null;
};

export async function requestReceiptRecognition(): Promise<OcrPreviewLine[]> {
  return [];
}
