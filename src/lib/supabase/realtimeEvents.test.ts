import { applyRealtimeRowEvent, belongsToTable, reconcileByKey, removeByKey, upsertByKey } from '@/lib/supabase/realtimeEvents';

type Row = { id: string; table_id: string; value: string };

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const getId = (row: Row) => row.id;
const getOldId = (row: Partial<Row>) => row.id ?? null;

export function runRealtimeEventTests() {
  const tests: Array<[string, () => void]> = [
    ['upsert adiciona por id', () => {
      const result = upsertByKey<Row>([], { id: '1', table_id: 't1', value: 'a' }, getId);
      assert(result.length === 1 && result[0].value === 'a', 'nao adicionou');
    }],
    ['upsert atualiza sem duplicar', () => {
      const result = upsertByKey<Row>([{ id: '1', table_id: 't1', value: 'a' }], { id: '1', table_id: 't1', value: 'b' }, getId);
      assert(result.length === 1 && result[0].value === 'b', 'duplicou ou nao atualizou');
    }],
    ['remove por id', () => {
      const result = removeByKey<Row>([{ id: '1', table_id: 't1', value: 'a' }], '1', getId);
      assert(result.length === 0, 'nao removeu');
    }],
    ['INSERT aplica upsert', () => {
      const result = applyRealtimeRowEvent<Row>([], { eventType: 'INSERT', newRecord: { id: '1', table_id: 't1', value: 'a' }, oldRecord: null }, getId, getOldId);
      assert(result.length === 1, 'insert falhou');
    }],
    ['UPDATE aplica upsert', () => {
      const result = applyRealtimeRowEvent<Row>([{ id: '1', table_id: 't1', value: 'a' }], { eventType: 'UPDATE', newRecord: { id: '1', table_id: 't1', value: 'b' }, oldRecord: { id: '1' } }, getId, getOldId);
      assert(result.length === 1 && result[0].value === 'b', 'update falhou');
    }],
    ['DELETE remove com old id', () => {
      const result = applyRealtimeRowEvent<Row>([{ id: '1', table_id: 't1', value: 'a' }], { eventType: 'DELETE', newRecord: null, oldRecord: { id: '1' } }, getId, getOldId);
      assert(result.length === 0, 'delete falhou');
    }],
    ['pertencimento a mesa valido', () => {
      assert(belongsToTable({ table_id: 't1' }, 't1'), 'pertencimento deveria ser valido');
    }],
    ['pertencimento a mesa invalido', () => {
      assert(!belongsToTable({ table_id: 't2' }, 't1'), 'vazou entre mesas');
    }],
    ['reconciliacao substitui remoto', () => {
      const result = reconcileByKey<Row>([{ id: '1', table_id: 't1', value: 'local' }], [{ id: '1', table_id: 't1', value: 'remote' }], getId);
      assert(result.length === 1 && result[0].value === 'remote', 'nao substituiu pelo banco');
    }],
    ['reconciliacao remove ausente remoto', () => {
      const result = reconcileByKey<Row>([{ id: '1', table_id: 't1', value: 'local' }], [], getId);
      assert(result.length === 0, 'nao removeu ausente remoto');
    }],
    ['evento fora de ordem nao duplica', () => {
      const afterUpdate = applyRealtimeRowEvent<Row>([], { eventType: 'UPDATE', newRecord: { id: '1', table_id: 't1', value: 'b' }, oldRecord: null }, getId, getOldId);
      const afterInsert = applyRealtimeRowEvent<Row>(afterUpdate, { eventType: 'INSERT', newRecord: { id: '1', table_id: 't1', value: 'b' }, oldRecord: null }, getId, getOldId);
      assert(afterInsert.length === 1, 'evento fora de ordem duplicou');
    }],
  ];

  const passed: string[] = [];

  for (const [name, run] of tests) {
    run();
    passed.push(name);
  }

  return { total: tests.length, passed };
}
