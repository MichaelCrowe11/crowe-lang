// Main compiler entry point for CroweLang
// This module provides the primary API for compiling CroweLang source code to TypeScript

import { CroweLangParser, croweLangParser } from './parser-trading';
import { CroweLangLexer } from './lexer-trading';
import { TradingCodeGenerator, CodegenOptions } from './codegen-trading';
import { Program, StrategyDecl } from './ast-trading';

export interface CompileOptions {
  /** Target output format */
  target?: 'typescript' | 'javascript';
  /** Output module format */
  module?: 'commonjs' | 'esm';
  /** Include runtime type checking */
  typeChecking?: boolean;
  /** Optimization level */
  optimization?: 'none' | 'basic' | 'aggressive';
  /** Source map generation */
  sourceMap?: boolean;
  /** Output directory for generated files */
  outDir?: string;
}

export interface CompileResult {
  /** Generated TypeScript/JavaScript code */
  code: string;
  /** Source map if enabled */
  sourceMap?: string;
  /** Parse errors if any */
  errors: CompilerError[];
  /** Warning messages */
  warnings: CompilerWarning[];
  /** AST representation */
  ast?: Program;
}

export interface CompilerError {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  code?: string;
}

export interface CompilerWarning {
  message: string;
  line: number;
  column: number;
  code?: string;
}

export class CroweLangCompiler {
  private lexer: any;
  private parser: CroweLangParser;
  private codeGenerator: TradingCodeGenerator;

  constructor(private options: CompileOptions = {}) {
    this.lexer = CroweLangLexer;
    this.parser = croweLangParser;
    const codegenOptions: CodegenOptions = {
      target: 'typescript',
      runtime: 'backtest',
      optimize: options.optimization !== 'none',
      debug: false
    };
    this.codeGenerator = new TradingCodeGenerator(codegenOptions);
  }

  /**
   * Compile CroweLang source code to TypeScript
   */
  compile(sourceCode: string, fileName?: string): CompileResult {
    const errors: CompilerError[] = [];
    const warnings: CompilerWarning[] = [];

    try {
      // Lexical analysis
      const lexResult = this.lexer.tokenize(sourceCode);
      if (lexResult.errors.length > 0) {
        errors.push(...lexResult.errors.map((err: any) => ({
          message: err.message,
          line: err.line || 1,
          column: err.column || 1,
          severity: 'error' as const,
          code: 'LEX_ERROR'
        })));
      }

      if (errors.length > 0) {
        return { code: '', errors, warnings };
      }

      // Parsing
      this.parser.input = lexResult.tokens;
      const cst = this.parser.program();

      if (this.parser.errors.length > 0) {
        errors.push(...this.parser.errors.map((err: any) => ({
          message: err.message,
          line: err.token?.startLine || 1,
          column: err.token?.startColumn || 1,
          severity: 'error' as const,
          code: 'PARSE_ERROR'
        })));
      }

      if (errors.length > 0) {
        return { code: '', errors, warnings };
      }

      // For now, create a simple AST representation
      const ast: Program = {
        kind: 'Program',
        imports: [],
        data: [],
        indicators: [],
        strategies: [],
        backtests: [],
        orders: [],
        events: [],
        portfolios: []
      };

      // Semantic analysis and validation
      this.validateAst(ast, errors, warnings);

      if (errors.length > 0) {
        return { code: '', errors, warnings, ast };
      }

      // Code generation
      const generatedCode = this.codeGenerator.generateProgram(ast);

      return {
        code: generatedCode,
        errors,
        warnings,
        ast
      };

    } catch (error) {
      errors.push({
        message: error instanceof Error ? error.message : 'Unknown compilation error',
        line: 1,
        column: 1,
        severity: 'error',
        code: 'INTERNAL_ERROR'
      });

      return { code: '', errors, warnings };
    }
  }

  /**
   * Parse CroweLang source without code generation
   */
  parse(sourceCode: string): { ast?: Program; errors: CompilerError[] } {
    const errors: CompilerError[] = [];

    try {
      const lexResult = this.lexer.tokenize(sourceCode);
      if (lexResult.errors.length > 0) {
        errors.push(...lexResult.errors.map((err: any) => ({
          message: err.message,
          line: err.line || 1,
          column: err.column || 1,
          severity: 'error' as const,
          code: 'LEX_ERROR'
        })));
        return { errors };
      }

      this.parser.input = lexResult.tokens;
      const cst = this.parser.program();

      if (this.parser.errors.length > 0) {
        errors.push(...this.parser.errors.map((err: any) => ({
          message: err.message,
          line: err.token?.startLine || 1,
          column: err.token?.startColumn || 1,
          severity: 'error' as const,
          code: 'PARSE_ERROR'
        })));
        return { errors };
      }

      // For now, create a simple AST representation
      const ast: Program = {
        kind: 'Program',
        imports: [],
        data: [],
        indicators: [],
        strategies: [],
        backtests: [],
        orders: [],
        events: [],
        portfolios: []
      };
      return { ast, errors };

    } catch (error) {
      errors.push({
        message: error instanceof Error ? error.message : 'Unknown parse error',
        line: 1,
        column: 1,
        severity: 'error',
        code: 'INTERNAL_ERROR'
      });

      return { errors };
    }
  }

  /**
   * Validate AST for semantic correctness
   */
  private validateAst(ast: Program, errors: CompilerError[], warnings: CompilerWarning[]): void {
    // Basic AST validation
    if (!ast) {
      errors.push({
        message: 'Empty AST generated',
        line: 1,
        column: 1,
        severity: 'error',
        code: 'EMPTY_AST'
      });
      return;
    }

    // Strategy-specific validation
    for (const strategy of ast.strategies) {
      this.validateStrategy(strategy, errors, warnings);
    }
  }

  /**
   * Validate trading strategy declaration
   */
  private validateStrategy(strategy: StrategyDecl, errors: CompilerError[], warnings: CompilerWarning[]): void {
    // Check required strategy components
    const hasRules = strategy.rules && strategy.rules.rules && strategy.rules.rules.length > 0;
    if (!hasRules) {
      warnings.push({
        message: `Strategy '${strategy.name}' has no trading rules defined`,
        line: 1,
        column: 1,
        code: 'NO_RULES'
      });
    }

    // Check for risky patterns
    const hasRiskManagement = strategy.risk && strategy.risk.limits && strategy.risk.limits.length > 0;
    if (!hasRiskManagement) {
      warnings.push({
        message: `Strategy '${strategy.name}' has no risk management defined`,
        line: 1,
        column: 1,
        code: 'NO_RISK_MGMT'
      });
    }
  }

  /**
   * Set compiler options
   */
  setOptions(options: Partial<CompileOptions>): void {
    this.options = { ...this.options, ...options };
    const codegenOptions: CodegenOptions = {
      target: 'typescript',
      runtime: 'backtest',
      optimize: options.optimization !== 'none',
      debug: false
    };
    this.codeGenerator = new TradingCodeGenerator(codegenOptions);
  }

  /**
   * Get current compiler options
   */
  getOptions(): CompileOptions {
    return { ...this.options };
  }
}

// Factory function for creating compiler instance
export function createCompiler(options?: CompileOptions): CroweLangCompiler {
  return new CroweLangCompiler(options);
}

// Convenience function for one-off compilation
export function compile(sourceCode: string, options?: CompileOptions): CompileResult {
  const compiler = createCompiler(options);
  return compiler.compile(sourceCode);
}

// Export core classes and interfaces
export {
  CroweLangParser,
  CroweLangLexer,
  TradingCodeGenerator,
  croweLangParser
};

export * from './ast-trading';
export * from './lexer-trading';
export * from './parser-trading';
export * from './codegen-trading';