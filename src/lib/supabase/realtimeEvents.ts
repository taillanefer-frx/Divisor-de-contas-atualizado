export type RealtimeRowEvent<Row> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRecord: Row | null;
  oldRecord: Partial<Row> | null;
};

export function upsertByKey<Row>(rows: Row[], nextRow: Row, getKey: (row: Row) => string) {
  const nextKey = getKey(nextRow);
  const existingIndex = rows.findIndex((row) => getKey(row) === nextKey);

  if (existingIndex === -1) return [...rows, nextRow];

  return rows.map((row, index) => (index === existingIndex ? nextRow : row));
}

export function removeByKey<Row>(rows: Row[], key: string, getKey: (row: Row) => string) {
  return rows.filter((row) => getKey(row) !== key);
}

export function reconcileByKey<Row>(currentRows: Row[], remoteRows: Row[], getKey: (row: Row) => string) {
  const remoteByKey = new Map(remoteRows.map((row) => [getKey(row), row]));
  const reconciled = currentRows.filter((row) => remoteByKey.has(getKey(row))).map((row) => remoteByKey.get(getKey(row)) ?? row);
  const currentKeys = new Set(reconciled.map(getKey));

  for (const row of remoteRows) {
    if (!currentKeys.has(getKey(row))) reconciled.push(row);
  }

  return reconciled;
}

export function belongsToTable(record: { table_id?: string | null } | null | undefined, tableId: string) {
  return record?.table_id === tableId;
}

export function applyRealtimeRowEvent<Row>(rows: Row[], event: RealtimeRowEvent<Row>, getKey: (row: Row) => string, getOldKey: (row: Partial<Row>) => string | null) {
  if (event.eventType === 'DELETE') {
    const oldKey = event.oldRecord ? getOldKey(event.oldRecord) : null;
    return oldKey ? removeByKey(rows, oldKey, getKey) : rows;
  }

  if (!event.newRecord) return rows;
  return upsertByKey(rows, event.newRecord, getKey);
}
