#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import * as chokidar from 'chokidar';
import { compileCroweToReactTSXWithStats, clearCache, formatPerformanceStats } from '../../crowe-compiler/src/index';
import { parseCroweWithErrors } from '../../crowe-compiler/src/parser';

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8'));

program
  .name('crowe')
  .description('Crowe language compiler - React-native computing language with AI operations')
  .version(packageJson.version);

program
  .command('compile')
  .alias('c')
  .description('Compile .crowe files to React TSX')
  .argument('<input>', 'Input .crowe file')
  .option('-o, --output <file>', 'Output file')
  .option('-w, --watch', 'Watch for changes and recompile')
  .option('--check', 'Check syntax only, don\'t generate output')
  .option('--source-maps', 'Generate source maps for debugging')
  .option('--no-cache', 'Disable compilation cache')
  .option('--profile', 'Enable performance profiling')
  .option('--cache-dir <dir>', 'Cache directory', '.crowe-cache')
  .action(async (input, options) => {
    const compile = (inputFile: string) => {
      try {
        console.log(`🔄 Compiling ${inputFile}...`);
        
        const src = fs.readFileSync(inputFile, 'utf8');
        
        if (options.check) {
          const result = parseCroweWithErrors(src, inputFile);
          if (result.errors.hasErrors()) {
            console.error('❌ Compilation errors:');
            console.error(result.errors.formatAll());
            return false;
          } else {
            console.log('✅ Syntax check passed');
            return true;
          }
        }
        
        const compileOptions = {
          filename: inputFile,
          sourceMaps: options.sourceMaps,
          sourceMapPath: options.sourceMaps && options.output ? 
            `${options.output}.map` : undefined,
          useCache: !options.noCache,
          enableProfiling: options.profile,
          cacheDir: options.cacheDir
        };
        
        const compileResult = compileCroweToReactTSXWithStats(src, compileOptions);
        const out = compileResult.output;
        
        if (options.profile && compileResult.stats) {
          const stats = compileResult.stats;
          console.log(`⚡ Performance: parse=${stats.parseTime.toFixed(1)}ms, codegen=${stats.codegenTime.toFixed(1)}ms, total=${stats.totalTime.toFixed(1)}ms${stats.cacheHit ? ' (cached)' : ''}`);
          if (stats.memoryUsed) {
            console.log(`📊 Memory used: ${stats.memoryUsed}`);
          }
        }
        const base = path.basename(inputFile).replace(/\.crowe$/i, '') || 'Component';
        const finalOutput = out.replace(/export function\s+([A-Za-z_][A-Za-z0-9_]*)/, `export function ${base}`);
        
        if (options.output) {
          fs.writeFileSync(options.output, finalOutput);
          console.log(`✅ Compiled to ${options.output}`);
        } else {
          console.log(finalOutput);
        }
        return true;
      } catch (error) {
        console.error('❌ Compilation failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    };

    if (options.watch) {
      console.log(`👀 Watching ${input} for changes...`);
      
      const watcher = chokidar.watch(input, {
        ignoreInitial: false,
        persistent: true
      });
      
      watcher.on('change', () => compile(input));
      watcher.on('add', () => compile(input));
      
      // Keep the process alive
      process.on('SIGINT', () => {
        console.log('\n👋 Stopping watch mode...');
        watcher.close();
        process.exit(0);
      });
    } else {
      const success = compile(input);
      if (!success) {
        process.exit(1);
      }
    }
  });

program
  .command('init')
  .description('Initialize a new Crowe project')
  .argument('[name]', 'Project name', 'my-crowe-app')
  .action((name) => {
    console.log(`🎉 Creating new Crowe project: ${name}`);
    
    const projectDir = path.join(process.cwd(), name);
    
    if (fs.existsSync(projectDir)) {
      console.error(`❌ Directory ${name} already exists`);
      process.exit(1);
    }
    
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });
    
    // Create example component
    const exampleComponent = `component App() {
  state message: string = "Hello, Crowe!";
  state count: number = 0;
  
  action increment() {
    count = count + 1;
  }
  
  render {
    <div style={{ padding: 20, fontFamily: 'system-ui' }}>
      <h1>{message}</h1>
      <p>Count: {count}</p>
      <button onClick={() => increment()}>
        Click me!
      </button>
    </div>
  }
}`;
    
    fs.writeFileSync(path.join(projectDir, 'src', 'App.crowe'), exampleComponent);
    
    // Create package.json
    const projectPackageJson = {
      "name": name,
      "version": "1.0.0",
      "private": true,
      "scripts": {
        "dev": "crowe compile src/App.crowe --watch --output src/App.tsx",
        "build": "crowe compile src/App.crowe --output src/App.tsx"
      },
      "devDependencies": {
        "crowe-lang": `^${packageJson.version}`
      },
      "dependencies": {
        "react": "^18.0.0",
        "@types/react": "^18.0.0"
      }
    };
    
    fs.writeFileSync(
      path.join(projectDir, 'package.json'), 
      JSON.stringify(projectPackageJson, null, 2)
    );
    
    // Create README
    const readme = `# ${name}

A Crowe language project.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development (watch mode)
npm run dev

# Build once
npm run build
\`\`\`

## Learn More

- [Crowe Language Documentation](https://github.com/MichaelCrowe11/crowe-lang)
- [React Documentation](https://reactjs.org)
`;
    
    fs.writeFileSync(path.join(projectDir, 'README.md'), readme);
    
    console.log('✅ Project created successfully!');
    console.log('');
    console.log('Next steps:');
    console.log(`  cd ${name}`);
    console.log('  npm install');
    console.log('  npm run dev');
  });

program
  .command('cache')
  .description('Cache management commands')
  .option('--clear', 'Clear compilation cache')
  .option('--stats', 'Show cache statistics')
  .option('--dir <dir>', 'Cache directory', '.crowe-cache')
  .action((options) => {
    if (options.clear) {
      console.log('🧹 Clearing compilation cache...');
      clearCache();
      console.log('✅ Cache cleared');
    } else if (options.stats) {
      console.log('📊 Performance Statistics:');
      console.log(formatPerformanceStats());
    } else {
      console.log('Use --clear to clear cache or --stats to show performance statistics');
    }
  });

program
  .command('install-extension')
  .description('Install the Crowe VS Code extension')
  .option('--local', 'Install from local .vsix file')
  .option('--marketplace', 'Install from VS Code marketplace (after publishing)')
  .action(async (options) => {
    const { execSync } = require('child_process');
    
    try {
      // Check if VS Code is installed
      try {
        execSync('code --version', { stdio: 'ignore' });
      } catch {
        console.error('❌ VS Code is not installed or not in PATH');
        console.log('   Please install VS Code from: https://code.visualstudio.com');
        process.exit(1);
      }
      
      if (options.marketplace) {
        console.log('📦 Installing Crowe extension from VS Code marketplace...');
        try {
          execSync('code --install-extension MichaelCrowe11.crowe-lang', { stdio: 'inherit' });
          console.log('✅ Extension installed successfully from marketplace!');
        } catch (error) {
          console.error('❌ Failed to install from marketplace');
          console.log('   The extension may not be published yet.');
          console.log('   Try installing locally with: crowe install-extension --local');
        }
      } else {
        // Install from local .vsix file
        console.log('📦 Installing Crowe extension from local package...');
        
        // Look for .vsix file
        const vsixFiles = fs.readdirSync(process.cwd()).filter((f: string) => f.endsWith('.vsix'));
        let vsixPath: string;
        
        if (vsixFiles.length === 0) {
          // Try to find in common locations
          const possiblePaths = [
            path.join(process.cwd(), 'crowe-lang-vscode-0.2.0.vsix'),
            path.join(process.cwd(), 'vscode-extension', 'crowe-lang-0.2.0.vsix'),
            path.join(__dirname, '..', '..', '..', 'crowe-lang-vscode-0.2.0.vsix'),
            path.join(__dirname, '..', '..', '..', 'vscode-extension', 'crowe-lang-0.2.0.vsix')
          ];
          
          const found = possiblePaths.find((p: string) => fs.existsSync(p));
          if (!found) {
            console.error('❌ No .vsix file found');
            console.log('   Build the extension first:');
            console.log('     cd vscode-extension');
            console.log('     npm install');
            console.log('     vsce package');
            process.exit(1);
          }
          vsixPath = found;
        } else {
          vsixPath = vsixFiles[0];
        }
        
        console.log(`📄 Found extension package: ${path.basename(vsixPath)}`);
        execSync(`code --install-extension "${vsixPath}"`, { stdio: 'inherit' });
        console.log('✅ Extension installed successfully!');
      }
      
      console.log('');
      console.log('🎉 Crowe Language extension is ready to use!');
      console.log('   1. Open VS Code');
      console.log('   2. Create a .crowe file');
      console.log('   3. Start coding with syntax highlighting and IntelliSense!');
      
    } catch (error) {
      console.error('❌ Installation failed:', error);
      process.exit(1);
    }
  });

program
  .command('extension-status')
  .description('Check if Crowe VS Code extension is installed')
  .action(() => {
    const { execSync } = require('child_process');
    
    try {
      const output = execSync('code --list-extensions', { encoding: 'utf-8' });
      const extensions = output.split('\n').map((e: string) => e.trim()).filter(Boolean);
      
      // Check for both possible extension IDs (local and marketplace)
      const isInstalled = extensions.includes('MichaelCrowe11.crowe-lang') || 
                          extensions.includes('crowe-lang.crowe-lang');
      
      if (isInstalled) {
        console.log('✅ Crowe Language extension is installed');
        const id = extensions.includes('MichaelCrowe11.crowe-lang') ? 
                   'MichaelCrowe11.crowe-lang' : 'crowe-lang.crowe-lang';
        console.log(`   Extension ID: ${id}`);
        console.log('   Version: 0.2.0');
      } else {
        console.log('❌ Crowe Language extension is not installed');
        console.log('');
        console.log('Install it with one of these commands:');
        console.log('  crowe install-extension --local       (from local .vsix file)');
        console.log('  crowe install-extension --marketplace (from VS Code marketplace)');
      }
    } catch (error) {
      console.error('❌ Failed to check extension status');
      console.log('   Make sure VS Code is installed and in PATH');
    }
  });

program
  .command('uninstall-extension')
  .description('Uninstall the Crowe VS Code extension')
  .action(() => {
    const { execSync } = require('child_process');
    
    try {
      // Check which extension ID is installed
      const output = execSync('code --list-extensions', { encoding: 'utf-8' });
      const extensions = output.split('\n').map((e: string) => e.trim()).filter(Boolean);
      
      let extensionId: string | null = null;
      if (extensions.includes('MichaelCrowe11.crowe-lang')) {
        extensionId = 'MichaelCrowe11.crowe-lang';
      } else if (extensions.includes('crowe-lang.crowe-lang')) {
        extensionId = 'crowe-lang.crowe-lang';
      }
      
      if (extensionId) {
        console.log('🗑️  Uninstalling Crowe extension...');
        execSync(`code --uninstall-extension ${extensionId}`, { stdio: 'inherit' });
        console.log('✅ Extension uninstalled successfully');
      } else {
        console.log('❌ Crowe Language extension is not installed');
      }
    } catch (error) {
      console.error('❌ Failed to uninstall extension:', error);
    }
  });

program
  .command('dev')
  .description('Start development server with hot module replacement')
  .option('-p, --port <port>', 'HMR server port', '3001')
  .option('-h, --host <host>', 'HMR server host', 'localhost')
  .option('-w, --watch-dir <dir>', 'Directory to watch', process.cwd())
  .option('-o, --output-dir <dir>', 'Output directory for compiled files')
  .action(async (options) => {
    console.log('🚀 Starting Crowe development server with HMR...');
    
    try {
      // Dynamic import to avoid circular dependency
      const { startHMRServer, generateHMRClient } = await import('../../crowe-hmr/src/index');
      
      const server = startHMRServer({
        port: parseInt(options.port),
        host: options.host,
        watchDir: options.watchDir,
        verbose: true
      });
      
      // Generate HMR client script
      if (options.outputDir) {
        const clientScript = generateHMRClient();
        const clientPath = path.join(options.outputDir, 'crowe-hmr-client.js');
        fs.writeFileSync(clientPath, clientScript);
        console.log(`📄 HMR client script generated at: ${clientPath}`);
      }
      
      console.log('');
      console.log('📦 Add this to your HTML:');
      console.log(`  <script src="crowe-hmr-client.js"></script>`);
      console.log('');
      console.log('✨ Hot Module Replacement is ready!');
      console.log('   Edit .crowe files to see changes instantly');
      console.log('');
      
      // Keep process alive
      process.on('SIGINT', () => {
        console.log('\n👋 Stopping development server...');
        server.stop();
        process.exit(0);
      });
    } catch (error) {
      console.error('❌ Failed to start development server:', error);
      process.exit(1);
    }
  });

program
  .command('benchmark')
  .description('Run compilation benchmarks')
  .argument('[input]', 'Input .crowe file to benchmark', 'examples/hello-world.crowe')
  .option('-n, --iterations <count>', 'Number of iterations', '10')
  .action((input, options) => {
    if (!fs.existsSync(input)) {
      console.error(`❌ File not found: ${input}`);
      process.exit(1);
    }

    const iterations = parseInt(options.iterations);
    const src = fs.readFileSync(input, 'utf8');
    
    console.log(`🏁 Running benchmark: ${iterations} iterations of ${input}`);
    console.log('');

    const times: number[] = [];
    
    // Clear cache to ensure fair benchmarking
    clearCache();
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      const result = compileCroweToReactTSXWithStats(src, { 
        filename: input,
        enableProfiling: true,
        useCache: i > 0 // First run populates cache, subsequent runs use it
      });
      
      const end = performance.now();
      times.push(end - start);
      
      if (i === 0) {
        console.log(`First run (no cache): ${(end - start).toFixed(2)}ms`);
      }
    }

    const cacheRuns = times.slice(1);
    if (cacheRuns.length > 0) {
      const avgCached = cacheRuns.reduce((a, b) => a + b) / cacheRuns.length;
      console.log(`Cached runs average: ${avgCached.toFixed(2)}ms`);
      console.log(`Speedup: ${(times[0] / avgCached).toFixed(1)}x faster with cache`);
    }

    console.log('');
    console.log(formatPerformanceStats());
  });

// For backward compatibility, if no command is provided, assume compile
const knownCommands = ['compile', 'init', 'c', 'cache', 'benchmark', 'dev', 'install-extension', 'extension-status', 'uninstall-extension'];
if (process.argv.length > 2 && !process.argv[2].startsWith('-') && !knownCommands.includes(process.argv[2])) {
  // Legacy mode: crowe file.crowe
  const input = process.argv[2];
  const output = process.argv[3];
  
  try {
    const src = fs.readFileSync(input, 'utf8');
    const result = compileCroweToReactTSXWithStats(src, { filename: input }).output;
    const base = path.basename(input).replace(/\.crowe$/i, '') || 'Component';
    const finalOutput = result.replace(/export function\s+([A-Za-z_][A-Za-z0-9_]*)/, `export function ${base}`);
    
    if (output) {
      fs.writeFileSync(output, finalOutput);
      console.log(`✅ Compiled to ${output}`);
    } else {
      console.log(finalOutput);
    }
  } catch (error) {
    console.error('❌ Compilation failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
} else {
  program.parse();
}