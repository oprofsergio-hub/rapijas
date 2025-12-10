import fs from 'node:fs/promises';
import ts from 'typescript';

export async function resolve(specifier, context, next) {
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith('.ts')) {
    const source = await fs.readFile(new URL(url), 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    });
    return { format: 'module', source: transpiled.outputText, shortCircuit: true };
  }
  return next(url, context);
}
