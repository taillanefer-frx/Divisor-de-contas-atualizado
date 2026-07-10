import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { ItemParticipantAssignmentType, ItemParticipantsRow, ItemsInsert, ItemsRow, ItemsUpdate, ManualItemParticipantPayload, ManualItemWithParticipantsResult } from '@/lib/supabase/types';
import { getClient } from '@/services/supabaseServiceHelpers';

export type ItemWithParticipants = ItemsRow & {
  participants: Array<ItemParticipantsRow & { display_name: string }>;
};

export type UpsertManualItemInput = {
  table_id: string;
  item_id?: string | null;
  name: string;
  amount_cents: number;
  quantity: number;
  consumed_at: string;
  notes: string | null;
  participants: ManualItemParticipantPayload[];
};

function normalizeAssignmentType(value: ItemParticipantAssignmentType): Extract<ItemParticipantAssignmentType, 'manual' | 'suggested'> {
  return value === 'suggested' ? 'suggested' : 'manual';
}

export const itemService = {
  async listByTableId(table_id: string) {
    const { data, error } = await getClient().from('items').select('*').eq('table_id', table_id).order('consumed_at', { ascending: true });
    throwIfSupabaseError(error);
    return data as ItemsRow[];
  },

  async listWithParticipantsByTableId(table_id: string): Promise<ItemWithParticipants[]> {
    const [itemsResult, itemParticipantsResult, participantsResult] = await Promise.all([
      getClient().from('items').select('*').eq('table_id', table_id).order('consumed_at', { ascending: false }),
      getClient().from('item_participants').select('*').eq('table_id', table_id).order('created_at', { ascending: true }),
      getClient().from('participants').select('*').eq('table_id', table_id),
    ]);

    throwIfSupabaseError(itemsResult.error);
    throwIfSupabaseError(itemParticipantsResult.error);
    throwIfSupabaseError(participantsResult.error);

    const participantsById = new Map((participantsResult.data ?? []).map((participant) => [participant.id, participant.display_name]));
    const assignmentsByItem = new Map<string, Array<ItemParticipantsRow & { display_name: string }>>();

    for (const assignment of (itemParticipantsResult.data ?? []) as ItemParticipantsRow[]) {
      const current = assignmentsByItem.get(assignment.item_id) ?? [];
      current.push({ ...assignment, assignment_type: normalizeAssignmentType(assignment.assignment_type), display_name: participantsById.get(assignment.participant_id) ?? 'Participante removido' });
      assignmentsByItem.set(assignment.item_id, current);
    }

    return ((itemsResult.data ?? []) as ItemsRow[]).map((item) => ({ ...item, participants: assignmentsByItem.get(item.id) ?? [] }));
  },

  async getById(id: string) {
    const { data, error } = await getClient().from('items').select('*').eq('id', id).single();
    throwIfSupabaseError(error);
    return data as ItemsRow;
  },

  async upsertManualWithParticipants(values: UpsertManualItemInput) {
    const { data, error } = await getClient().rpc('upsert_manual_item_with_participants', {
      p_table_id: values.table_id,
      p_item_id: values.item_id ?? null,
      p_name: values.name,
      p_amount_cents: values.amount_cents,
      p_quantity: values.quantity,
      p_consumed_at: values.consumed_at,
      p_notes: values.notes,
      p_participants: values.participants,
    });

    throwIfSupabaseError(error);

    const savedItem = data?.[0];
    if (!savedItem) {
      throw new Error('Supabase did not return the saved item.');
    }

    return savedItem as ManualItemWithParticipantsResult;
  },

  async voidManualItem(table_id: string, item_id: string) {
    const { data, error } = await getClient().rpc('void_manual_item', {
      p_table_id: table_id,
      p_item_id: item_id,
    });

    throwIfSupabaseError(error);
    return data as ItemsRow;
  },

  async create(values: ItemsInsert) {
    const { data, error } = await getClient().from('items').insert(values).select('*').single();
    throwIfSupabaseError(error);
    return data as ItemsRow;
  },

  async update(id: string, values: ItemsUpdate) {
    const { data, error } = await getClient().from('items').update(values).eq('id', id).select('*').single();
    throwIfSupabaseError(error);
    return data as ItemsRow;
  },

  async remove(id: string) {
    const { error } = await getClient().from('items').delete().eq('id', id);
    throwIfSupabaseError(error);
  },
};
