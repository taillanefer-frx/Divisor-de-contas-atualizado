import type { ItemParticipantAssignmentType, ItemStatus, RoundingStrategy } from '@/lib/supabase/types';

export type BillingErrorCode =
  | 'invalid_participant'
  | 'invalid_item'
  | 'invalid_assignment'
  | 'invalid_settings'
  | 'missing_participant'
  | 'missing_item'
  | 'duplicate_assignment'
  | 'item_without_participants'
  | 'zero_weight_sum';

export type BillingWarningCode =
  | 'empty_bill'
  | 'void_item_has_assignments'
  | 'participant_without_items'
  | 'minimum_consumption_rule_limited'
  | 'unsupported_rounding_strategy';

export type BillingIssue = {
  code: BillingErrorCode | BillingWarningCode;
  message: string;
  entityId?: string;
};

export type BillingParticipant = {
  id: string;
  display_name: string;
};

export type BillingItem = {
  id: string;
  name: string;
  amount_cents: number;
  quantity: number;
  status: ItemStatus;
};

export type BillingItemParticipant = {
  item_id: string;
  participant_id: string;
  share_weight: number;
  assignment_type?: ItemParticipantAssignmentType;
};

export type BillingSettings = {
  service_fee_percent: number;
  cover_charge_cents: number;
  minimum_consumption_cents: number;
  rounding_strategy: RoundingStrategy;
};

export type BillingInput = {
  participants: BillingParticipant[];
  items: BillingItem[];
  itemParticipants: BillingItemParticipant[];
  settings: BillingSettings;
};

export type ParticipantItemBreakdown = {
  item_id: string;
  item_name: string;
  line_total_cents: number;
  assigned_cents: number;
  share_weight: number;
};

export type ParticipantBillingResult = {
  participant_id: string;
  display_name: string;
  item_consumption_cents: number;
  service_fee_cents: number;
  cover_charge_cents: number;
  minimum_consumption_adjustment_cents: number;
  subtotal_cents: number;
  total_due_cents: number;
  items: ParticipantItemBreakdown[];
};

export type BillingTotals = {
  items_subtotal_cents: number;
  service_fee_cents: number;
  cover_charge_cents: number;
  minimum_consumption_adjustment_cents: number;
  grand_total_cents: number;
  participants_total_cents: number;
  reconciliation_difference_cents: number;
};

export type BillingResult = {
  participants: ParticipantBillingResult[];
  totals: BillingTotals;
  warnings: BillingIssue[];
  errors: BillingIssue[];
};

export type SplitWeight = {
  id: string;
  weight: number;
};

export type SplitResult = {
  id: string;
  amount_cents: number;
};
