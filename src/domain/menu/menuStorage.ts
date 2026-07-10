import { parseCurrencyToCents } from '@/lib/money/money';

export const consumptionTypes = ['Bebida', 'Comida', 'Petisco', 'Sobremesa', 'Drinks', 'Outros'] as const;

export type ConsumptionType = (typeof consumptionTypes)[number];

export type SavedMenuItem = {
  id: string;
  type: ConsumptionType;
  name: string;
  amount_cents: number;
};

export type SavedBarMenu = {
  id: string;
  name: string;
  items: SavedMenuItem[];
  updated_at: string;
};

const savedBarsKey = 'divisor.savedBarMenus.v1';

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return prefix + '-' + crypto.randomUUID();
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function listSavedBarMenus() {
  return readJson<SavedBarMenu[]>(savedBarsKey, []).map((bar) => ({ ...bar, items: bar.items ?? [] }));
}

export function saveBarMenu(bar: Pick<SavedBarMenu, 'name'> & Partial<Pick<SavedBarMenu, 'id' | 'items'>>) {
  const bars = listSavedBarMenus();
  const id = bar.id ?? createId('bar');
  const nextBar: SavedBarMenu = {
    id,
    name: bar.name.trim(),
    items: bar.items ?? bars.find((current) => current.id === id)?.items ?? [],
    updated_at: new Date().toISOString(),
  };

  writeJson(savedBarsKey, [nextBar, ...bars.filter((current) => current.id !== id)]);
  return nextBar;
}

export function addItemToBarMenu(barId: string, item: { type: ConsumptionType; name: string; amount: string }) {
  const amount = parseCurrencyToCents(item.amount);
  if (!amount.ok) throw new Error(amount.error);

  const bars = listSavedBarMenus();
  const bar = bars.find((current) => current.id === barId);
  if (!bar) throw new Error('Bar nao encontrado.');

  const nextItem: SavedMenuItem = {
    id: createId('item'),
    type: item.type,
    name: item.name.trim(),
    amount_cents: amount.cents,
  };
  const nextBar = { ...bar, items: [...bar.items, nextItem], updated_at: new Date().toISOString() };

  writeJson(savedBarsKey, bars.map((current) => (current.id === barId ? nextBar : current)));
  return nextBar;
}
