import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const root = typeof nodeRepl !== 'undefined' ? nodeRepl.cwd : process.cwd();
const require = createRequire(import.meta.url);
const ts = require('typescript');
const cache = new Map();

function resolveModule(id, fromFile) {
  if (id.startsWith('@/')) {
    const relative = id.slice(2);
    const candidates = [path.join(root, 'src', relative + '.ts'), path.join(root, 'src', relative + '.tsx'), path.join(root, 'src', relative, 'index.ts')];
    const found = candidates.find((candidate) => fs.existsSync(candidate));
    if (!found) throw new Error('Cannot resolve ' + id);
    return found;
  }
  if (id.startsWith('.')) {
    const base = path.resolve(path.dirname(fromFile), id);
    const candidates = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')];
    const found = candidates.find((candidate) => fs.existsSync(candidate));
    if (!found) throw new Error('Cannot resolve ' + id + ' from ' + fromFile);
    return found;
  }
  return id;
}

function loadModule(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return require(filePath);
  if (cache.has(filePath)) return cache.get(filePath).exports;

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  cache.set(filePath, module);
  const localRequire = (id) => loadModule(resolveModule(id, filePath));
  const context = { exports: module.exports, module, require: localRequire, console, JSON, Math, Number, String, Set, Map, Error };
  vm.runInNewContext(output, context, { filename: filePath });
  return module.exports;
}

const testModule = loadModule(path.join(root, 'src/lib/supabase/realtimeEvents.test.ts'));
const result = testModule.runRealtimeEventTests();
console.log('Realtime event tests passed: ' + result.total + '/' + result.total);
for (const name of result.passed) console.log('- ' + name);
