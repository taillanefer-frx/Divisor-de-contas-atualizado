import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { PaymentsInsert, PaymentsRow, PaymentsUpdate } from '@/lib/supabase/types';
import { getClient } from '@/services/supabaseServiceHelpers';

export type RegisterPaymentInput = {
  table_id: string;
  participant_id: string;
  amount_cents: number;
  payment_type: 'partial' | 'total';
  paid_at: string;
  notes?: string | null;
};

export const paymentService = {
  async listByTableId(table_id: string) {
    const { data, error } = await getClient().from('payments').select('*').eq('table_id', table_id).order('paid_at', { ascending: false });
    throwIfSupabaseError(error);
    return data as PaymentsRow[];
  },

  async listByParticipantId(table_id: string, participant_id: string) {
    const { data, error } = await getClient().from('payments').select('*').eq('table_id', table_id).eq('participant_id', participant_id).order('paid_at', { ascending: false });
    throwIfSupabaseError(error);
    return data as PaymentsRow[];
  },

  async getById(id: string) {
    const { data, error } = await getClient().from('payments').select('*').eq('id', id).single();
    throwIfSupabaseError(error);
    return data as PaymentsRow;
  },

  async register(values: RegisterPaymentInput) {
    const { data, error } = await getClient()
      .from('payments')
      .insert({
        table_id: values.table_id,
        participant_id: values.participant_id,
        amount_cents: values.amount_cents,
        payment_type: values.payment_type,
        status: 'registered',
        paid_at: values.paid_at,
        notes: values.notes ?? null,
      })
      .select('*')
      .single();

    throwIfSupabaseError(error);
    return data as PaymentsRow;
  },

  async cancel(id: string) {
    const { data, error } = await getClient()
      .from('payments')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'registered')
      .select('*')
      .single();

    throwIfSupabaseError(error);
    return data as PaymentsRow;
  },

  async create(values: PaymentsInsert) {
    const { data, error } = await getClient().from('payments').insert(values).select('*').single();
    throwIfSupabaseError(error);
    return data as PaymentsRow;
  },

  async update(id: string, values: PaymentsUpdate) {
    const { data, error } = await getClient().from('payments').update(values).eq('id', id).select('*').single();
    throwIfSupabaseError(error);
    return data as PaymentsRow;
  },
};
