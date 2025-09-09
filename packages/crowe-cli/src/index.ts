#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import * as chokidar from 'chokidar';
import { compileCroweToReactTSX } from '../../crowe-compiler/src/index';
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
        
        const out = compileCroweToReactTSX(src);
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

// For backward compatibility, if no command is provided, assume compile
if (process.argv.length > 2 && !process.argv[2].startsWith('-') && !['compile', 'init', 'c'].includes(process.argv[2])) {
  // Legacy mode: crowe file.crowe
  const input = process.argv[2];
  const output = process.argv[3];
  
  try {
    const src = fs.readFileSync(input, 'utf8');
    const result = compileCroweToReactTSX(src);
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