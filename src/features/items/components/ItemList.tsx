import { EmptyState } from '@/components/ui/EmptyState';
import type { ItemWithParticipants } from '@/services/itemService';
import { ItemCard } from '@/features/items/components/ItemCard';

type ItemListProps = {
  items: ItemWithParticipants[];
  disabled?: boolean;
  onEdit: (item: ItemWithParticipants) => void;
  onVoid: (item: ItemWithParticipants) => void;
};

export function ItemList({ items, disabled = false, onEdit, onVoid }: ItemListProps) {
  if (items.length === 0) {
    return <EmptyState title="Ainda nao tem itens" description="Cadastre manualmente o que foi consumido e associe as pessoas da mesa." />;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} disabled={disabled} onEdit={onEdit} onVoid={onVoid} />
      ))}
    </div>
  );
}
