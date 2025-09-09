import { parseCrowe } from './parser';
import { generateReactTSX, CodeGenOptions } from './codegen.react';

export interface CompileOptions extends CodeGenOptions {
  filename?: string;
}

export function compileCroweToReactTSX(source: string, options: CompileOptions = {}): string {
  const ast = parseCrowe(source, options.filename);
  
  const codeGenOptions: CodeGenOptions = {
    ...options,
    originalSource: source,
    sourcePath: options.filename
  };
  
  return generateReactTSX(ast, codeGenOptions);
}

export { parseCrowe, generateReactTSX };