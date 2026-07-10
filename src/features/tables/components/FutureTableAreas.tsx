import { SavedBarMenusPanel } from '@/features/menu/components/SavedBarMenusPanel';

type FutureTableAreasProps = {
  onMenusChanged?: () => void;
};

export function FutureTableAreas({ onMenusChanged }: FutureTableAreasProps) {
  return <SavedBarMenusPanel onChanged={onMenusChanged} />;
}
