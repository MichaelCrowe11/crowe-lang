export class CroweError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number,
    public file?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'CroweError';
  }

  toString(): string {
    const location = this.file ? `${this.file}:${this.line}:${this.column}` : `${this.line}:${this.column}`;
    let output = `${this.name}: ${this.message}\n  at ${location}`;
    
    if (this.code) {
      const lines = this.code.split('\n');
      const startLine = Math.max(0, this.line - 2);
      const endLine = Math.min(lines.length, this.line + 2);
      
      output += '\n\n';
      for (let i = startLine; i < endLine; i++) {
        const lineNum = (i + 1).toString().padStart(4, ' ');
        const marker = i === this.line - 1 ? '>' : ' ';
        output += `${marker} ${lineNum} | ${lines[i]}\n`;
        
        if (i === this.line - 1) {
          const spaces = ' '.repeat(7 + this.column);
          output += `${spaces}^\n`;
        }
      }
    }
    
    return output;
  }
}

export class ParseError extends CroweError {
  constructor(message: string, line: number, column: number, file?: string, code?: string) {
    super(`Parse error: ${message}`, line, column, file, code);
    this.name = 'ParseError';
  }
}

export class TypeError extends CroweError {
  constructor(message: string, line: number, column: number, file?: string, code?: string) {
    super(`Type error: ${message}`, line, column, file, code);
    this.name = 'TypeError';
  }
}

export class CompilationError extends CroweError {
  constructor(message: string, line: number, column: number, file?: string, code?: string) {
    super(`Compilation error: ${message}`, line, column, file, code);
    this.name = 'CompilationError';
  }
}

export class ErrorCollector {
  private errors: CroweError[] = [];
  private warnings: CroweError[] = [];
  
  addError(error: CroweError): void {
    this.errors.push(error);
  }
  
  addWarning(warning: CroweError): void {
    this.warnings.push(warning);
  }
  
  hasErrors(): boolean {
    return this.errors.length > 0;
  }
  
  getErrors(): CroweError[] {
    return this.errors;
  }
  
  getWarnings(): CroweError[] {
    return this.warnings;
  }
  
  clear(): void {
    this.errors = [];
    this.warnings = [];
  }
  
  formatAll(): string {
    let output = '';
    
    if (this.errors.length > 0) {
      output += `Found ${this.errors.length} error(s):\n\n`;
      output += this.errors.map(e => e.toString()).join('\n\n');
    }
    
    if (this.warnings.length > 0) {
      if (output) output += '\n\n';
      output += `Found ${this.warnings.length} warning(s):\n\n`;
      output += this.warnings.map(w => w.toString()).join('\n\n');
    }
    
    return output;
  }
}