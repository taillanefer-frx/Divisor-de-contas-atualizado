import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import ts from 'typescript';

const root = typeof nodeRepl !== 'undefined' ? nodeRepl.cwd : process.cwd();
const outDir = path.join(root, '.tmp-receipt-ocr-tests');
await fs.rm(outDir, { recursive: true, force: true });

const files = [
  'src/config/freePlanLimits.ts',
  'src/lib/money/money.ts',
  'src/domain/receipt-ocr/types.ts',
  'src/domain/receipt-ocr/fileValidation.ts',
  'src/domain/receipt-ocr/lineParsing.ts',
  'src/domain/receipt-ocr/localTesseractOcr.ts',
  'src/domain/receipt-ocr/normalizeOcrResult.ts',
  'src/domain/receipt-ocr/review.ts',
  'src/domain/receipt-ocr/index.ts',
  'src/domain/receipt-ocr/receiptOcr.test.ts',
];

function aliasToRelative(fromRel, aliasTarget) {
  const fromDir = path.dirname(path.join(outDir, fromRel)).replace(/\\/g, '/');
  const target = path.join(outDir, 'src', aliasTarget).replace(/\\/g, '/');
  let relative = path.posix.relative(fromDir, target).replace(/\.ts$/, '.js');
  if (!relative.startsWith('.')) relative = './' + relative;
  return relative;
}

async function compile(relPath) {
  let source = await fs.readFile(path.join(root, relPath), 'utf8');
  source = source.replace(/from '([^']+)'/g, (match, specifier) => {
    if (specifier === './index') return "from './index.js'";
    if (!specifier.startsWith('@/')) return match;
    return "from '" + aliasToRelative(relPath.replace(/\.ts$/, '.js'), specifier.slice(2) + '.ts') + "'";
  });

  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: relPath,
  }).outputText;
  const outPath = path.join(outDir, relPath).replace(/\.ts$/, '.js');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, output, 'utf8');
}

for (const file of files) await compile(file);
await import(url.pathToFileURL(path.join(outDir, 'src/domain/receipt-ocr/receiptOcr.test.js')).href);
await fs.rm(outDir, { recursive: true, force: true });
console.log('receipt ocr tests passed');
