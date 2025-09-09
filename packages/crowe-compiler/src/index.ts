import { parseCrowe } from './parser';
import { generateReactTSX } from './codegen.react';

export function compileCroweToReactTSX(source: string): string {
  const ast = parseCrowe(source);
  return generateReactTSX(ast);
}