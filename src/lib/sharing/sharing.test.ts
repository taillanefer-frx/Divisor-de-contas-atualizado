import { strict as assert } from 'node:assert';
import {
  buildTablePath,
  buildTableShareUrl,
  canUseClipboard,
  canUseNativeShare,
  copyTextToClipboard,
  getAppOrigin,
  shareTableLink,
  validateShareToken,
} from './index';

const validToken = 'a'.repeat(48);
const otherToken = 'b'.repeat(48);
const internalTableId = '11111111-2222-3333-4444-555555555555';

async function run() {
  assert.deepEqual(validateShareToken(validToken), { ok: true, token: validToken });
  assert.deepEqual(validateShareToken('  ' + validToken + '  '), { ok: true, token: validToken });
  assert.equal(validateShareToken('').ok, false);
  assert.equal(validateShareToken('   ').ok, false);
  assert.equal(validateShareToken(undefined).ok, false);
  assert.equal(validateShareToken(null).ok, false);
  assert.equal(validateShareToken('mesa-demo').ok, false);
  assert.equal(validateShareToken('g'.repeat(48)).ok, false);
  assert.equal(validateShareToken('a'.repeat(47)).ok, false);
  assert.equal(validateShareToken('a'.repeat(49)).ok, false);

  assert.equal(buildTablePath(validToken), '/mesa/' + validToken);
  assert.equal(buildTablePath('  ' + validToken + '  '), '/mesa/' + validToken);
  assert.throws(() => buildTablePath('demo'));

  assert.equal(getAppOrigin({ appUrl: 'https://app.exemplo.com///' }), 'https://app.exemplo.com');
  assert.equal(getAppOrigin({ appUrl: '   ', windowOrigin: 'https://local.exemplo.test/' }), 'https://local.exemplo.test');
  assert.equal(buildTableShareUrl(validToken, { appUrl: 'https://app.exemplo.com/' }), 'https://app.exemplo.com/mesa/' + validToken);
  assert.equal(buildTableShareUrl(otherToken, { windowOrigin: 'https://origem-do-navegador.exemplo/' }), 'https://origem-do-navegador.exemplo/mesa/' + otherToken);
  assert.throws(() => buildTableShareUrl(validToken, { appUrl: '', windowOrigin: '' }));

  const publicUrl = buildTableShareUrl(validToken, { appUrl: 'https://app.exemplo.com' });
  assert.equal(publicUrl.includes(internalTableId), false);
  assert.equal(publicUrl.includes('/mesas/'), false);
  assert.equal(publicUrl.includes('/mesa/' + validToken), true);

  let copiedText = '';
  assert.equal(canUseClipboard(undefined), false);
  assert.equal(canUseClipboard({ clipboard: { writeText: async (text: string) => { copiedText = text; } } as Clipboard }), true);
  assert.equal(await copyTextToClipboard(publicUrl, undefined), 'unsupported');
  assert.equal(await copyTextToClipboard(publicUrl, { clipboard: { writeText: async (text: string) => { copiedText = text; } } as Clipboard }), 'copied');
  assert.equal(copiedText, publicUrl);
  assert.equal(await copyTextToClipboard(publicUrl, { clipboard: { writeText: async () => { throw new Error('denied'); } } as unknown as Clipboard }), 'failed');

  assert.equal(canUseNativeShare(undefined), false);
  assert.equal(await shareTableLink({ title: 'Mesa', url: publicUrl }, undefined), 'unsupported');
  assert.equal(await shareTableLink({ title: 'Mesa', url: publicUrl }, { share: async () => undefined }), 'shared');
  const abortError = new Error('cancelado');
  abortError.name = 'AbortError';
  assert.equal(await shareTableLink({ title: 'Mesa', url: publicUrl }, { share: async () => { throw abortError; } }), 'canceled');
  assert.equal(await shareTableLink({ title: 'Mesa', url: publicUrl }, { share: async () => { throw new Error('falha'); } }), 'failed');
}

await run();
