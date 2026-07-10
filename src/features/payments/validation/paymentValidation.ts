import { parseCurrencyToCents } from '@/lib/money/money';

export type PaymentFormValues = {
  amount: string;
  paid_at: string;
  notes: string;
};

export type PaymentFormErrors = {
  amount?: string;
  paid_at?: string;
};

export function validatePaymentForm(values: PaymentFormValues) {
  const errors: PaymentFormErrors = {};
  const money = parseCurrencyToCents(values.amount);

  if (!money.ok) {
    errors.amount = money.error;
  } else if (money.cents <= 0) {
    errors.amount = 'O pagamento precisa ser maior que zero.';
  } else if (!Number.isSafeInteger(money.cents) || !Number.isFinite(money.cents)) {
    errors.amount = 'Informe um valor valido.';
  }

  if (!values.paid_at) {
    errors.paid_at = 'Informe a data e hora do pagamento.';
  }

  return errors;
}

export function hasPaymentFormErrors(errors: PaymentFormErrors) {
  return Boolean(errors.amount || errors.paid_at);
}
