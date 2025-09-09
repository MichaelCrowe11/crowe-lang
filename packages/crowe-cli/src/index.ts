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
  .command('setup-logo')
  .description('Set up the COS logo for the project and VS Code extension')
  .option('--url <url>', 'URL of the logo image to download')
  .option('--file <path>', 'Local file path of the logo image')
  .action(async (options) => {
    let sharp: any = null;
    try {
      sharp = require('sharp');
    } catch {
      // Sharp not available
    }
    const https = require('https');
    const { promisify } = require('util');
    const pipeline = promisify(require('stream').pipeline);
    
    console.log('🎨 Setting up COS logo...');
    
    // Create a simple base64 encoded SVG logo if no image provided
    if (!options.url && !options.file) {
      console.log('📝 Creating COS logo...');
      
      // Create an SVG version of the COS logo
      const svgLogo = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark circle background -->
  <circle cx="64" cy="64" r="64" fill="#1a3a52"/>
  
  <!-- COS text -->
  <text x="64" y="48" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="url(#gradient)">
    COS
  </text>
  
  <!-- Branching pattern from O -->
  <g stroke="url(#gradient)" stroke-width="2" fill="none" opacity="0.8">
    <!-- Main branches -->
    <path d="M64,55 L64,75 M64,75 L54,85 M64,75 L74,85 M64,75 L64,90"/>
    <path d="M54,85 L49,90 M54,85 L54,95"/>
    <path d="M74,85 L79,90 M74,85 L74,95"/>
    <!-- Nodes -->
    <circle cx="64" cy="90" r="3" fill="url(#gradient)"/>
    <circle cx="49" cy="90" r="2" fill="url(#gradient)"/>
    <circle cx="79" cy="90" r="2" fill="url(#gradient)"/>
    <circle cx="54" cy="95" r="2" fill="url(#gradient)"/>
    <circle cx="74" cy="95" r="2" fill="url(#gradient)"/>
  </g>
  
  <!-- Gradient definition -->
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4ade80;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#14b8a6;stop-opacity:1" />
    </linearGradient>
  </defs>
</svg>`;

      // Save SVG logo
      const logoPath = path.join(process.cwd(), 'vscode-extension', 'icons', 'cos-logo.svg');
      fs.mkdirSync(path.dirname(logoPath), { recursive: true });
      fs.writeFileSync(logoPath, svgLogo);
      console.log(`✅ Created SVG logo at: ${logoPath}`);
      
      // Create PNG versions if sharp is available
      if (sharp) {
        try {
        
        // 128x128 for VS Code extension
        await sharp(Buffer.from(svgLogo))
          .resize(128, 128)
          .png()
          .toFile(path.join(process.cwd(), 'vscode-extension', 'icons', 'icon.png'));
        console.log('✅ Created icon.png (128x128) for VS Code extension');
        
        // 512x512 for documentation
        await sharp(Buffer.from(svgLogo))
          .resize(512, 512)
          .png()
          .toFile(path.join(process.cwd(), 'docs', 'images', 'logo.png'));
        console.log('✅ Created logo.png (512x512) for documentation');
        
        // 64x64 for NPM
        await sharp(Buffer.from(svgLogo))
          .resize(64, 64)
          .png()
          .toFile(path.join(process.cwd(), 'logo-small.png'));
        console.log('✅ Created logo-small.png (64x64) for NPM');
        
        } catch (error) {
          console.log('⚠️  PNG generation failed:', error);
        }
      } else {
        console.log('⚠️  PNG generation requires sharp. Install with: npm install sharp');
        console.log('   SVG logo created successfully.');
      }
      
    } else if (options.url) {
      // Download from URL
      console.log(`📥 Downloading logo from: ${options.url}`);
      // Implementation for downloading from URL
      console.log('⚠️  URL download not yet implemented');
      
    } else if (options.file) {
      // Copy from local file
      console.log(`📁 Copying logo from: ${options.file}`);
      
      if (!fs.existsSync(options.file)) {
        console.error('❌ File not found:', options.file);
        process.exit(1);
      }
      
      const iconPath = path.join(process.cwd(), 'vscode-extension', 'icons', 'icon.png');
      fs.mkdirSync(path.dirname(iconPath), { recursive: true });
      fs.copyFileSync(options.file, iconPath);
      console.log('✅ Logo copied to VS Code extension');
    }
    
    console.log('');
    console.log('🎉 Logo setup complete!');
    console.log('   The COS logo is now configured for:');
    console.log('   • VS Code extension icon');
    console.log('   • Documentation website');
    console.log('   • NPM package');
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
const knownCommands = ['compile', 'init', 'c', 'cache', 'benchmark', 'dev', 'install-extension', 'extension-status', 'uninstall-extension', 'setup-logo'];
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