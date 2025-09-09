import { SourceMapGenerator, Position } from 'source-map';
import { getLineColumn } from './utils';

export interface SourceMapOptions {
  file?: string;
  sourceRoot?: string;
  sourcesContent?: string[];
}

export class CroweSourceMapGenerator {
  private generator: SourceMapGenerator;
  private generatedLine: number = 1;
  private generatedColumn: number = 0;

  constructor(options: SourceMapOptions = {}) {
    this.generator = new SourceMapGenerator({
      file: options.file || 'output.tsx',
      sourceRoot: options.sourceRoot
    });

    if (options.sourcesContent) {
      options.sourcesContent.forEach((content, i) => {
        this.generator.setSourceContent(`source${i}.crowe`, content);
      });
    }
  }

  addMapping(generated: Position, original: Position, source: string, name?: string): void {
    this.generator.addMapping({
      generated,
      original,
      source,
      name
    });
  }

  addMappingForRange(
    generatedStart: Position,
    generatedEnd: Position,
    originalStart: Position,
    originalEnd: Position,
    source: string,
    name?: string
  ): void {
    // Add mapping for the start position
    this.addMapping(generatedStart, originalStart, source, name);
    
    // For multi-line ranges, add mappings for each line
    let currentGenerated = { ...generatedStart };
    let currentOriginal = { ...originalStart };
    
    while (currentGenerated.line < generatedEnd.line || 
           (currentGenerated.line === generatedEnd.line && currentGenerated.column < generatedEnd.column)) {
      currentGenerated.column++;
      currentOriginal.column++;
      
      if (currentGenerated.column > generatedEnd.column && currentGenerated.line === generatedEnd.line) {
        break;
      }
      
      this.addMapping(currentGenerated, currentOriginal, source);
    }
  }

  trackGenerated(text: string): void {
    for (const char of text) {
      if (char === '\n') {
        this.generatedLine++;
        this.generatedColumn = 0;
      } else {
        this.generatedColumn++;
      }
    }
  }

  getCurrentPosition(): Position {
    return {
      line: this.generatedLine,
      column: this.generatedColumn
    };
  }

  toString(): string {
    return this.generator.toString();
  }

  toJSON(): any {
    return this.generator.toJSON();
  }
}

export function generateSourceMapForComponent(
  originalSource: string,
  generatedSource: string,
  sourcePath: string
): string {
  const sourceMap = new CroweSourceMapGenerator({
    file: sourcePath.replace(/\.crowe$/, '.tsx'),
    sourcesContent: [originalSource]
  });

  // This is a simplified source map generation
  // In a real implementation, we'd need to track exact transformations
  const originalLines = originalSource.split('\n');
  const generatedLines = generatedSource.split('\n');

  let originalLineIndex = 0;
  let generatedLineIndex = 0;

  // Map import statements (these don't exist in original)
  while (generatedLineIndex < generatedLines.length && 
         generatedLines[generatedLineIndex].startsWith('import')) {
    generatedLineIndex++;
  }

  // Map the main component and its content
  for (let i = 0; i < originalLines.length; i++) {
    const originalLine = originalLines[i].trim();
    
    if (originalLine.startsWith('component') || 
        originalLine.includes('render') ||
        originalLine.includes('state') ||
        originalLine.includes('action') ||
        originalLine.includes('computed')) {
      
      // Find corresponding line in generated code
      for (let j = generatedLineIndex; j < generatedLines.length; j++) {
        const generatedLine = generatedLines[j].trim();
        
        if (generatedLine.includes(originalLine.split(' ')[0]) ||
            (originalLine.includes('render') && generatedLine.includes('return'))) {
          
          sourceMap.addMapping(
            { line: j + 1, column: 0 },
            { line: i + 1, column: 0 },
            sourcePath
          );
          
          generatedLineIndex = j + 1;
          break;
        }
      }
    }
  }

  return sourceMap.toString();
}

export function addSourceMapComment(generatedCode: string, sourceMapPath: string): string {
  return `${generatedCode}\n//# sourceMappingURL=${sourceMapPath}`;
}