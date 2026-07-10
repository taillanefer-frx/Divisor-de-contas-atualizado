import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import ts from 'typescript';

const root = typeof nodeRepl !== 'undefined' ? nodeRepl.cwd : process.cwd();
const outDir = path.join(root, '.tmp-sharing-tests');
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(path.join(outDir, 'src/lib/sharing'), { recursive: true });

async function compile(relPath) {
  const absolutePath = path.join(root, relPath);
  let source = await fs.readFile(absolutePath, 'utf8');
  source = source.replace(/import.meta.env.VITE_APP_URL/g, 'undefined');
  source = source.replace(/from './index'/g, "from './index.js'");
  source = source.replace(/from '@/lib/sharing/browserShare'/g, "from './browserShare.js'");
  source = source.replace(/from '@/lib/sharing/tableShareUrl'/g, "from './tableShareUrl.js'");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: relPath,
  }).outputText;
  const outPath = path.join(outDir, relPath).replace(/.ts$/, '.js');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, output, 'utf8');
}

await compile('src/lib/sharing/tableShareUrl.ts');
await compile('src/lib/sharing/browserShare.ts');
await compile('src/lib/sharing/index.ts');
await compile('src/lib/sharing/sharing.test.ts');

await import(url.pathToFileURL(path.join(outDir, 'src/lib/sharing/sharing.test.js')).href);
await fs.rm(outDir, { recursive: true, force: true });
console.log('sharing tests passed');
