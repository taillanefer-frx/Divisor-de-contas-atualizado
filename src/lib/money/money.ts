export type MoneyParseResult =
  | { ok: true; cents: number }
  | { ok: false; error: string };

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatMoney(cents: number) {
  return currencyFormatter.format(cents / 100);
}

export function parseCurrencyToCents(value: string): MoneyParseResult {
  const normalized = value.trim();

  if (!normalized) {
    return { ok: false, error: 'Informe o valor.' };
  }

  if (normalized.includes('-')) {
    return { ok: false, error: 'O valor nao pode ser negativo.' };
  }

  const onlyCurrencyChars = normalized.replace(/[^0-9,.]/g, '');
  if (!onlyCurrencyChars) {
    return { ok: false, error: 'Informe um valor valido.' };
  }

  const lastComma = onlyCurrencyChars.lastIndexOf(',');
  const lastDot = onlyCurrencyChars.lastIndexOf('.');
  const decimalIndex = Math.max(lastComma, lastDot);

  let reaisPart = onlyCurrencyChars;
  let centsPart = '';

  if (decimalIndex >= 0) {
    reaisPart = onlyCurrencyChars.slice(0, decimalIndex);
    centsPart = onlyCurrencyChars.slice(decimalIndex + 1);
  }

  const reaisDigits = reaisPart.replace(/[^0-9]/g, '') || '0';
  const centsDigits = centsPart.replace(/[^0-9]/g, '');

  if (centsDigits.length > 2) {
    return { ok: false, error: 'Use no maximo duas casas decimais.' };
  }

  const reais = BigInt(reaisDigits);
  const cents = BigInt((centsDigits + '00').slice(0, 2));
  const total = reais * 100n + cents;

  if (total > BigInt(Number.MAX_SAFE_INTEGER)) {
    return { ok: false, error: 'Valor muito alto.' };
  }

  return { ok: true, cents: Number(total) };
}

export function centsToCurrencyInput(cents: number) {
  const signal = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  const reais = Math.floor(absolute / 100);
  const centavos = String(absolute % 100).padStart(2, '0');
  return signal + reais + ',' + centavos;
}

