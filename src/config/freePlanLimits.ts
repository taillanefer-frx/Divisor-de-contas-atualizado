export const FREE_PLAN_LIMITS = {
  maxActiveTablesPerAnonymousUser: 3,
  maxParticipantsPerTable: 30,
  maxItemsPerTable: 300,
  maxPaymentsPerTable: 500,
  maxReceiptScansPerTable: 20,
  maxReceiptScanItemsPerScan: 120,
  maxTableNameLength: 80,
  maxParticipantNameLength: 80,
  maxItemNameLength: 140,
  maxItemNotesLength: 300,
  maxReceiptImageBytes: 6 * 1024 * 1024,
} as const;

export type FreePlanLimits = typeof FREE_PLAN_LIMITS;
