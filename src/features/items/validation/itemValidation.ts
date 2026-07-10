import { parseCurrencyToCents } from '@/lib/money/money';

export type ItemFormErrors = {
  name?: string;
  amount?: string;
  quantity?: string;
  consumed_at?: string;
};

export type ItemFormValues = {
  name: string;
  amount: string;
  quantity: string;
  consumed_at: string;
  notes: string;
};

export function validateItemForm(values: ItemFormValues) {
  const errors: ItemFormErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = 'Informe o nome do item.';
  } else if (name.length > 140) {
    errors.name = 'Use no maximo 140 caracteres.';
  }

  const money = parseCurrencyToCents(values.amount);
  if (!money.ok) {
    errors.amount = money.error;
  }

  if (!values.quantity.trim()) {
    errors.quantity = 'Informe a quantidade.';
  } else if (!/^[0-9]+$/.test(values.quantity.trim())) {
    errors.quantity = 'Use quantidade inteira no MVP.';
  } else {
    const quantity = Number(values.quantity.trim());
    if (quantity < 1) errors.quantity = 'A quantidade deve ser maior que zero.';
    if (quantity > 9999) errors.quantity = 'A quantidade maxima e 9999.';
  }

  if (!values.consumed_at) {
    errors.consumed_at = 'Informe o horario de consumo.';
  }

  return errors;
}

export function hasItemFormErrors(errors: ItemFormErrors) {
  return Boolean(errors.name || errors.amount || errors.quantity || errors.consumed_at);
}
