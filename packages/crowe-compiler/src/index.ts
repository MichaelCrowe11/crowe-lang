import { parseCrowe } from './parser';
import { generateReactTSX, CodeGenOptions } from './codegen.react';
import { CompilerCache } from './cache';
import { measure, globalTimer, globalMemory, formatMs } from './performance';
import * as path from 'path';

export interface CompileOptions extends CodeGenOptions {
  filename?: string;
  useCache?: boolean;
  cacheDir?: string;
  enableProfiling?: boolean;
}

export interface CompileResult {
  output: string;
  sourceMap?: string;
  stats?: {
    parseTime: number;
    codegenTime: number;
    totalTime: number;
    cacheHit: boolean;
    memoryUsed?: string;
  };
}

let cache: CompilerCache | null = null;

export function compileCroweToReactTSX(source: string, options: CompileOptions = {}): string {
  const result = compileCroweToReactTSXWithStats(source, options);
  return result.output;
}

export function compileCroweToReactTSXWithStats(source: string, options: CompileOptions = {}): CompileResult {
  const startTime = performance.now();
  const enableProfiling = options.enableProfiling || false;
  const useCache = options.useCache !== false; // Default to true
  const filename = options.filename || 'anonymous';
  
  if (enableProfiling) {
    globalMemory.snapshot('compile-start');
  }

  // Initialize cache if needed
  if (useCache && !cache) {
    cache = new CompilerCache(options.cacheDir);
  }

  // Check cache first
  if (useCache && cache && cache.isValid(filename, source)) {
    const cached = cache.get(filename)!;
    const totalTime = performance.now() - startTime;
    
    return {
      output: cached.compiledOutput,
      sourceMap: cached.sourceMap,
      stats: enableProfiling ? {
        parseTime: 0,
        codegenTime: 0,
        totalTime,
        cacheHit: true,
        memoryUsed: '0 B'
      } : undefined
    };
  }

  // Parse AST
  const parseStart = performance.now();
  const ast = measure('parse', () => parseCrowe(source, filename));
  const parseTime = performance.now() - parseStart;

  if (enableProfiling) {
    globalMemory.snapshot('parse-complete');
  }

  // Generate code
  const codegenStart = performance.now();
  const codeGenOptions: CodeGenOptions = {
    ...options,
    originalSource: source,
    sourcePath: filename
  };
  
  const output = measure('codegen', () => generateReactTSX(ast, codeGenOptions));
  const codegenTime = performance.now() - codegenStart;

  if (enableProfiling) {
    globalMemory.snapshot('codegen-complete');
  }

  // Cache the result
  if (useCache && cache) {
    cache.set(filename, source, output, undefined, []);
  }

  const totalTime = performance.now() - startTime;

  let memoryUsed: string | undefined;
  if (enableProfiling) {
    const memDiff = globalMemory.getDiff('compile-start', 'codegen-complete');
    if (memDiff) {
      memoryUsed = globalMemory.formatBytes(memDiff.heapUsed);
    }
  }

  return {
    output,
    stats: enableProfiling ? {
      parseTime,
      codegenTime, 
      totalTime,
      cacheHit: false,
      memoryUsed
    } : undefined
  };
}

export function clearCache(): void {
  if (cache) {
    cache.clear();
  }
}

export function getCacheStats(): { size: number; entries: number } | null {
  return cache ? cache.stats() : null;
}

export function getPerformanceStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
  return globalTimer.getAllStats();
}

export function formatPerformanceStats(): string {
  const stats = getPerformanceStats();
  const lines = ['Performance Statistics:'];
  
  for (const [name, stat] of Object.entries(stats)) {
    lines.push(`  ${name}:`);
    lines.push(`    avg: ${formatMs(stat.avg)}`);
    lines.push(`    min: ${formatMs(stat.min)}`);
    lines.push(`    max: ${formatMs(stat.max)}`);
    lines.push(`    count: ${stat.count}`);
  }
  
  const cacheStats = getCacheStats();
  if (cacheStats) {
    lines.push(`Cache: ${cacheStats.entries} entries`);
  }
  
  return lines.join('\n');
}

export { parseCrowe, generateReactTSX };