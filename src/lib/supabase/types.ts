export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Uuid = string;
export type IsoTimestamp = string;
export type MoneyCents = number;
export type PgNumeric = number;

export type TableStatus = 'open' | 'closed' | 'archived';
export type RoundingStrategy = 'largest_remainder' | 'first_participant' | 'manual_adjustment';
export type ReceiptScanStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'canceled' | 'confirmed';
export type ItemSource = 'manual' | 'ocr';
export type ItemStatus = 'active' | 'void';
export type ItemParticipantAssignmentType = 'manual' | 'automatic' | 'suggested';
export type ReceiptScanItemReviewStatus = 'pending' | 'accepted' | 'ignored' | 'edited';
export type PaymentType = 'partial' | 'total';
export type PaymentStatus = 'registered' | 'canceled';
export type AuditLogEntityType = 'table' | 'participant' | 'item' | 'payment' | 'receipt_scan' | 'receipt_scan_item' | 'settings' | 'consent';
export type TableMembershipRole = 'owner' | 'member';
export type MenuItemSource = 'manual' | 'saved_bar' | 'menu_scan';
export type ConsumptionType = 'Bebida' | 'Comida' | 'Petisco' | 'Sobremesa' | 'Drinks' | 'Outros';

export type CreateOwnerRecoveryCodeArgs = { p_table_id: Uuid };
export type CreateOwnerRecoveryCodeResult = { recovery_code: string; expires_at: IsoTimestamp };
export type RecoverTableOwnerArgs = { p_share_token: string; p_recovery_code: string };
export type TableLifecycleArgs = { p_table_id: Uuid };

export type CreateTableWithConsentArgs = {
  p_table_name: string;
  p_terms_version: string;
  p_privacy_version: string;
  p_user_agent?: string | null;
};

export type CreateTableWithConsentResult = {
  id: Uuid;
  share_token: string;
  name: string;
  status: TableStatus;
  created_at: IsoTimestamp;
};

export type JoinTableByShareTokenArgs = {
  p_share_token: string;
};

export type JoinTableByShareTokenResult = TablesRow & {
  role: TableMembershipRole;
};

export type ManualItemParticipantPayload = {
  participant_id: Uuid;
  assignment_type: Extract<ItemParticipantAssignmentType, 'manual' | 'suggested'>;
};

export type UpsertManualItemWithParticipantsArgs = {
  p_table_id: Uuid;
  p_item_id: Uuid | null;
  p_name: string;
  p_amount_cents: MoneyCents;
  p_quantity: number;
  p_consumed_at: IsoTimestamp;
  p_notes: string | null;
  p_participants: ManualItemParticipantPayload[];
};

export type ManualItemWithParticipantsResult = ItemsRow & {
  participants: Array<Pick<ItemParticipantsRow, 'id' | 'participant_id' | 'assignment_type' | 'share_weight' | 'created_at'>>;
};

export type VoidManualItemArgs = {
  p_table_id: Uuid;
  p_item_id: Uuid;
};

export type ConfirmReceiptScanImportArgs = {
  p_table_id: Uuid;
  p_receipt_scan_id: Uuid;
  p_lines: Json;
};

export type TablesRow = {
  id: Uuid;
  name: string;
  share_token: string;
  status: TableStatus;
  receipt_total_cents: MoneyCents | null;
  totals_compared_at: IsoTimestamp | null;
  closed_at: IsoTimestamp | null;
  archived_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type TablesInsert = {
  id?: Uuid;
  name: string;
  share_token?: string;
  status?: TableStatus;
  receipt_total_cents?: MoneyCents | null;
  totals_compared_at?: IsoTimestamp | null;
  closed_at?: IsoTimestamp | null;
  archived_at?: IsoTimestamp | null;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
};

export type TablesUpdate = Partial<TablesInsert>;

export type TableSettingsRow = {
  table_id: Uuid;
  service_fee_percent: PgNumeric;
  cover_charge_cents: MoneyCents;
  minimum_consumption_cents: MoneyCents;
  rounding_strategy: RoundingStrategy;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type TableSettingsInsert = {
  table_id: Uuid;
  service_fee_percent?: PgNumeric;
  cover_charge_cents?: MoneyCents;
  minimum_consumption_cents?: MoneyCents;
  rounding_strategy?: RoundingStrategy;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
};

export type TableSettingsUpdate = Partial<Omit<TableSettingsInsert, 'table_id'>>;

export type ParticipantsRow = {
  id: Uuid;
  table_id: Uuid;
  display_name: string;
  arrival_at: IsoTimestamp;
  departure_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type ParticipantsInsert = {
  id?: Uuid;
  table_id: Uuid;
  display_name: string;
  arrival_at: IsoTimestamp;
  departure_at?: IsoTimestamp | null;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
};

export type ParticipantsUpdate = Partial<ParticipantsInsert>;

export type ItemsRow = {
  id: Uuid;
  table_id: Uuid;
  name: string;
  amount_cents: MoneyCents;
  quantity: PgNumeric;
  consumed_at: IsoTimestamp;
  source: ItemSource;
  status: ItemStatus;
  receipt_scan_id: Uuid | null;
  notes: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type ItemsInsert = {
  id?: Uuid;
  table_id: Uuid;
  name: string;
  amount_cents: MoneyCents;
  quantity?: PgNumeric;
  consumed_at: IsoTimestamp;
  source?: ItemSource;
  status?: ItemStatus;
  receipt_scan_id?: Uuid | null;
  notes?: string | null;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
};

export type ItemsUpdate = Partial<ItemsInsert>;

export type TableMenuItemsRow = {
  id: Uuid;
  table_id: Uuid;
  consumption_type: ConsumptionType;
  name: string;
  amount_cents: MoneyCents;
  source: MenuItemSource;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type TableMenuItemsInsert = {
  id?: Uuid;
  table_id: Uuid;
  consumption_type?: ConsumptionType;
  name: string;
  amount_cents: MoneyCents;
  source?: MenuItemSource;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
};

export type TableMenuItemsUpdate = Partial<Omit<TableMenuItemsInsert, 'id' | 'table_id'>>;

export type ItemParticipantsRow = {
  id: Uuid;
  table_id: Uuid;
  item_id: Uuid;
  participant_id: Uuid;
  assignment_type: ItemParticipantAssignmentType;
  share_weight: PgNumeric;
  created_at: IsoTimestamp;
};

export type ItemParticipantsInsert = {
  id?: Uuid;
  table_id: Uuid;
  item_id: Uuid;
  participant_id: Uuid;
  assignment_type?: ItemParticipantAssignmentType;
  share_weight?: PgNumeric;
  created_at?: IsoTimestamp;
};

export type ItemParticipantsUpdate = Partial<Omit<ItemParticipantsInsert, 'id' | 'table_id' | 'item_id' | 'participant_id'>>;

export type PaymentsRow = {
  id: Uuid;
  table_id: Uuid;
  participant_id: Uuid;
  amount_cents: MoneyCents;
  payment_type: PaymentType;
  status: PaymentStatus;
  paid_at: IsoTimestamp;
  canceled_at: IsoTimestamp | null;
  notes: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type PaymentsInsert = {
  id?: Uuid;
  table_id: Uuid;
  participant_id: Uuid;
  amount_cents: MoneyCents;
  payment_type: PaymentType;
  status?: PaymentStatus;
  paid_at?: IsoTimestamp;
  canceled_at?: IsoTimestamp | null;
  notes?: string | null;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
};

export type PaymentsUpdate = Partial<PaymentsInsert>;

export type ReceiptScansRow = {
  id: Uuid;
  table_id: Uuid;
  storage_path: string | null;
  original_file_name: string | null;
  mime_type: string | null;
  status: ReceiptScanStatus;
  receipt_total_cents: MoneyCents | null;
  raw_ocr_text: string | null;
  error_message: string | null;
  processed_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type ReceiptScansInsert = {
  id?: Uuid;
  table_id: Uuid;
  storage_path?: string | null;
  original_file_name?: string | null;
  mime_type?: string | null;
  status?: ReceiptScanStatus;
  receipt_total_cents?: MoneyCents | null;
  raw_ocr_text?: string | null;
  error_message?: string | null;
  processed_at?: IsoTimestamp | null;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
};

export type ReceiptScansUpdate = Partial<ReceiptScansInsert>;

export type ReceiptScanItemsRow = {
  id: Uuid;
  receipt_scan_id: Uuid;
  table_id: Uuid;
  line_index: number;
  raw_text: string;
  recognized_name: string | null;
  recognized_amount_cents: MoneyCents | null;
  confidence: PgNumeric | null;
  review_status: ReceiptScanItemReviewStatus;
  matched_item_id: Uuid | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type ReceiptScanItemsInsert = {
  id?: Uuid;
  receipt_scan_id: Uuid;
  table_id: Uuid;
  line_index: number;
  raw_text: string;
  recognized_name?: string | null;
  recognized_amount_cents?: MoneyCents | null;
  confidence?: PgNumeric | null;
  review_status?: ReceiptScanItemReviewStatus;
  matched_item_id?: Uuid | null;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
};

export type ReceiptScanItemsUpdate = Partial<ReceiptScanItemsInsert>;

export type TableMembershipsRow = {
  id: Uuid;
  table_id: Uuid;
  user_id: Uuid;
  role: TableMembershipRole;
  created_at: IsoTimestamp;
  last_seen_at: IsoTimestamp;
};

export type TableMembershipsInsert = {
  id?: Uuid;
  table_id: Uuid;
  user_id: Uuid;
  role?: TableMembershipRole;
  created_at?: IsoTimestamp;
  last_seen_at?: IsoTimestamp;
};

export type TableMembershipsUpdate = Partial<Omit<TableMembershipsInsert, 'id' | 'table_id' | 'user_id'>>;

export type TableOwnerRecoveryCodesRow = {
  id: Uuid;
  table_id: Uuid;
  code_hash: string;
  used_at: IsoTimestamp | null;
  expires_at: IsoTimestamp;
  attempts: number;
  created_at: IsoTimestamp;
};

export type TableOwnerRecoveryCodesInsert = {
  id?: Uuid;
  table_id: Uuid;
  code_hash: string;
  used_at?: IsoTimestamp | null;
  expires_at?: IsoTimestamp;
  attempts?: number;
  created_at?: IsoTimestamp;
};

export type TableOwnerRecoveryCodesUpdate = Partial<TableOwnerRecoveryCodesInsert>;

export type ConsentLogsRow = {
  id: Uuid;
  table_id: Uuid;
  participant_id: Uuid | null;
  terms_version: string;
  privacy_version: string;
  accepted_at: IsoTimestamp;
  user_agent: string | null;
  created_at: IsoTimestamp;
};

export type ConsentLogsInsert = {
  id?: Uuid;
  table_id: Uuid;
  participant_id?: Uuid | null;
  terms_version: string;
  privacy_version: string;
  accepted_at?: IsoTimestamp;
  user_agent?: string | null;
  created_at?: IsoTimestamp;
};

export type ConsentLogsUpdate = Partial<ConsentLogsInsert>;

export type AuditLogsRow = {
  id: Uuid;
  table_id: Uuid | null;
  participant_id: Uuid | null;
  event_type: string;
  entity_type: AuditLogEntityType | null;
  entity_id: Uuid | null;
  metadata: Json;
  created_at: IsoTimestamp;
};

export type AuditLogsInsert = {
  id?: Uuid;
  table_id?: Uuid | null;
  participant_id?: Uuid | null;
  event_type: string;
  entity_type?: AuditLogEntityType | null;
  entity_id?: Uuid | null;
  metadata?: Json;
  created_at?: IsoTimestamp;
};

export type AuditLogsUpdate = Partial<AuditLogsInsert>;

export type Database = {
  public: {
    Tables: {
      tables: { Row: TablesRow; Insert: TablesInsert; Update: TablesUpdate; Relationships: [] };
      table_settings: { Row: TableSettingsRow; Insert: TableSettingsInsert; Update: TableSettingsUpdate; Relationships: [] };
      participants: { Row: ParticipantsRow; Insert: ParticipantsInsert; Update: ParticipantsUpdate; Relationships: [] };
      items: { Row: ItemsRow; Insert: ItemsInsert; Update: ItemsUpdate; Relationships: [] };
      table_menu_items: { Row: TableMenuItemsRow; Insert: TableMenuItemsInsert; Update: TableMenuItemsUpdate; Relationships: [] };
      item_participants: { Row: ItemParticipantsRow; Insert: ItemParticipantsInsert; Update: ItemParticipantsUpdate; Relationships: [] };
      payments: { Row: PaymentsRow; Insert: PaymentsInsert; Update: PaymentsUpdate; Relationships: [] };
      receipt_scans: { Row: ReceiptScansRow; Insert: ReceiptScansInsert; Update: ReceiptScansUpdate; Relationships: [] };
      receipt_scan_items: { Row: ReceiptScanItemsRow; Insert: ReceiptScanItemsInsert; Update: ReceiptScanItemsUpdate; Relationships: [] };
      consent_logs: { Row: ConsentLogsRow; Insert: ConsentLogsInsert; Update: ConsentLogsUpdate; Relationships: [] };
      audit_logs: { Row: AuditLogsRow; Insert: AuditLogsInsert; Update: AuditLogsUpdate; Relationships: [] };
      table_memberships: { Row: TableMembershipsRow; Insert: TableMembershipsInsert; Update: TableMembershipsUpdate; Relationships: [] };
      table_owner_recovery_codes: { Row: TableOwnerRecoveryCodesRow; Insert: TableOwnerRecoveryCodesInsert; Update: TableOwnerRecoveryCodesUpdate; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      create_table_with_consent: {
        Args: CreateTableWithConsentArgs;
        Returns: CreateTableWithConsentResult[];
      };
      join_table_by_share_token: {
        Args: JoinTableByShareTokenArgs;
        Returns: JoinTableByShareTokenResult[];
      };
      upsert_manual_item_with_participants: {
        Args: UpsertManualItemWithParticipantsArgs;
        Returns: ManualItemWithParticipantsResult[];
      };
      void_manual_item: {
        Args: VoidManualItemArgs;
        Returns: ItemsRow;
      };
      confirm_receipt_scan_import: {
        Args: ConfirmReceiptScanImportArgs;
        Returns: ItemsRow[];
      };
      create_owner_recovery_code: {
        Args: CreateOwnerRecoveryCodeArgs;
        Returns: CreateOwnerRecoveryCodeResult[];
      };
      recover_table_owner: {
        Args: RecoverTableOwnerArgs;
        Returns: TablesRow;
      };
      close_table: { Args: TableLifecycleArgs; Returns: TablesRow };
      reopen_table: { Args: TableLifecycleArgs; Returns: TablesRow };
      archive_table: { Args: TableLifecycleArgs; Returns: TablesRow };
      delete_table: { Args: TableLifecycleArgs; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type TableName = keyof Database['public']['Tables'];
export type TableRow<Name extends TableName> = Database['public']['Tables'][Name]['Row'];
export type TableInsert<Name extends TableName> = Database['public']['Tables'][Name]['Insert'];
export type TableUpdate<Name extends TableName> = Database['public']['Tables'][Name]['Update'];
