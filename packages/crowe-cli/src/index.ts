#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';
import { compileCroweToReactTSX } from '../../crowe-compiler/src/index';

function main() {
  const inFile = process.argv[2];
  if (!inFile) {
    console.error('Usage: crowe <input.crowe>');
    process.exit(1);
  }
  const src = fs.readFileSync(inFile, 'utf8');
  const out = compileCroweToReactTSX(src);
  const base = path.basename(inFile).replace(/\.crowe$/i, '') || 'Component';
  console.log(out.replace(/export function\s+([A-Za-z_][A-Za-z0-9_]*)/, `export function ${base}`));
}

if (require.main === module) main();