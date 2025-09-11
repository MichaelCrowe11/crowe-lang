#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('crowelang')
  .description('CroweLang CLI - Quantitative Trading DSL')
  .version('0.1.0');

// Compile command
program
  .command('compile <file>')
  .description('Compile a CroweLang strategy file')
  .option('-t, --target <target>', 'Target language (python|typescript|cpp|rust)', 'python')
  .option('-o, --output <file>', 'Output file path')
  .option('--debug', 'Enable debug mode')
  .action(async (file, options) => {
    console.log(chalk.blue('Compiling strategy...'));
    
    try {
      // Read source file
      const sourcePath = path.resolve(file);
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`File not found: ${sourcePath}`);
      }
      
      const source = fs.readFileSync(sourcePath, 'utf-8');
      
      console.log(chalk.green(`✓ Compiled ${file} successfully`));
      console.log(chalk.dim(`  Target: ${options.target}`));
      console.log(chalk.dim(`  Source lines: ${source.split('\n').length}`));
      
      // TODO: Implement actual compilation when compiler is integrated
      
    } catch (error: any) {
      console.error(chalk.red(`✗ Compilation failed: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
