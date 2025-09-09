#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { program } from 'commander';

const TEMPLATES = {
  basic: {
    name: 'Basic',
    description: 'Simple Crowe component with state management'
  },
  'react-app': {
    name: 'React App',
    description: 'Full React application with Crowe components'
  },
  'ai-chat': {
    name: 'AI Chat',
    description: 'Chat application with AI model integration'
  },
  'real-time': {
    name: 'Real-Time App',
    description: 'WebSocket-based real-time application'
  },
  'full-stack': {
    name: 'Full Stack',
    description: 'Complete application with stores, streams, and AI'
  }
};

interface ProjectOptions {
  template?: string;
  typescript?: boolean;
  git?: boolean;
  install?: boolean;
  packageManager?: 'npm' | 'yarn' | 'pnpm';
}

function createProject(projectName: string, options: ProjectOptions) {
  const projectPath = path.join(process.cwd(), projectName);
  
  // Check if directory exists
  if (fs.existsSync(projectPath)) {
    console.error(`❌ Directory ${projectName} already exists`);
    process.exit(1);
  }

  console.log(`\n🎉 Creating new Crowe project: ${projectName}`);
  console.log(`📁 Directory: ${projectPath}`);
  console.log(`📦 Template: ${options.template || 'basic'}\n`);

  // Create project directory
  fs.mkdirSync(projectPath, { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'public'), { recursive: true });

  // Generate template files based on selected template
  generateTemplate(projectPath, options.template || 'basic', options);

  // Create package.json
  const packageJson: any = {
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts: {
      'dev': 'crowe dev --watch-dir src',
      'build': 'crowe compile src/**/*.crowe --output-dir dist',
      'preview': 'vite preview',
      'test': 'jest',
      'lint': 'eslint src',
      'type-check': 'tsc --noEmit'
    },
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'zustand': '^4.4.0'
    },
    devDependencies: {
      'crowe-lang': '^0.2.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'typescript': '^5.0.0',
      'vite': '^5.0.0',
      '@vitejs/plugin-react': '^4.0.0'
    }
  };

  // Add template-specific dependencies
  if (options.template === 'ai-chat') {
    packageJson.dependencies['openai'] = '^4.0.0';
  }
  if (options.template === 'real-time') {
    packageJson.dependencies['socket.io-client'] = '^4.5.0';
  }

  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create tsconfig.json if TypeScript
  if (options.typescript) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        jsx: 'react-jsx',
        module: 'ESNext',
        moduleResolution: 'node',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true
      },
      include: ['src'],
      exclude: ['node_modules', 'dist']
    };

    fs.writeFileSync(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }

  // Create vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createCroweApp } from 'crowe-lang/vite-plugin';

export default defineConfig({
  plugins: [
    ...createCroweApp({
      hmr: true,
      sourceMaps: true
    }),
    react()
  ],
  server: {
    port: 3000,
    open: true
  }
});`;

  fs.writeFileSync(path.join(projectPath, 'vite.config.ts'), viteConfig);

  // Create .gitignore
  if (options.git) {
    const gitignore = `node_modules/
dist/
.crowe-cache/
*.log
.DS_Store
.env.local
.env.*.local
coverage/
*.vsix`;

    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);
  }

  // Create README.md
  const readme = `# ${projectName}

A Crowe language project created with create-crowe-app.

## Getting Started

\`\`\`bash
# Install dependencies
${options.packageManager || 'npm'} install

# Start development server
${options.packageManager || 'npm'} run dev

# Build for production
${options.packageManager || 'npm'} run build
\`\`\`

## Project Structure

\`\`\`
${projectName}/
├── src/
│   ├── App.crowe       # Main application component
│   ├── components/     # Reusable Crowe components
│   └── stores/         # Global state stores
├── public/             # Static assets
├── package.json
└── vite.config.ts      # Vite configuration
\`\`\`

## Learn More

- [Crowe Documentation](https://github.com/MichaelCrowe11/crowe-lang)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
`;

  fs.writeFileSync(path.join(projectPath, 'README.md'), readme);

  // Initialize git repository
  if (options.git) {
    console.log('📝 Initializing git repository...');
    execSync('git init', { cwd: projectPath, stdio: 'ignore' });
    execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
    execSync('git commit -m "Initial commit from create-crowe-app"', { 
      cwd: projectPath, 
      stdio: 'ignore' 
    });
  }

  // Install dependencies
  if (options.install) {
    console.log('📦 Installing dependencies...');
    const pm = options.packageManager || 'npm';
    const installCmd = pm === 'yarn' ? 'yarn' : `${pm} install`;
    
    try {
      execSync(installCmd, { cwd: projectPath, stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Failed to install dependencies automatically');
      console.log(`   Please run '${installCmd}' manually`);
    }
  }

  // Success message
  console.log('\n✅ Project created successfully!\n');
  console.log('Next steps:');
  console.log(`  cd ${projectName}`);
  if (!options.install) {
    console.log(`  ${options.packageManager || 'npm'} install`);
  }
  console.log(`  ${options.packageManager || 'npm'} run dev\n`);
  console.log('Happy coding with Crowe! 🚀');
}

function generateTemplate(projectPath: string, template: string, options: ProjectOptions) {
  switch (template) {
    case 'basic':
      generateBasicTemplate(projectPath);
      break;
    case 'ai-chat':
      generateAIChatTemplate(projectPath);
      break;
    case 'real-time':
      generateRealTimeTemplate(projectPath);
      break;
    case 'full-stack':
      generateFullStackTemplate(projectPath);
      break;
    default:
      generateBasicTemplate(projectPath);
  }
}

function generateBasicTemplate(projectPath: string) {
  const appComponent = `component App() {
  state count: number = 0;
  state message: string = "Welcome to Crowe!";
  
  computed doubleCount: number {
    return count * 2;
  }
  
  action increment() {
    count = count + 1;
  }
  
  action updateMessage(newMessage: string) {
    message = newMessage;
  }
  
  render {
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>{message}</h1>
      <div style={{ marginTop: 20 }}>
        <p>Count: {count}</p>
        <p>Double: {doubleCount}</p>
        <button onClick={() => increment()}>
          Increment
        </button>
      </div>
      <div style={{ marginTop: 20 }}>
        <input 
          type="text"
          value={message}
          onChange={(e) => updateMessage(e.target.value)}
          style={{ padding: 8, width: 300 }}
        />
      </div>
    </div>
  }
}`;

  fs.writeFileSync(path.join(projectPath, 'src', 'App.crowe'), appComponent);
  
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crowe App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(projectPath, 'index.html'), indexHtml);

  const mainTsx = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.crowe';

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(<App />);`;

  fs.writeFileSync(path.join(projectPath, 'src', 'main.tsx'), mainTsx);
}

function generateAIChatTemplate(projectPath: string) {
  const chatComponent = `component ChatApp() {
  state messages: Message[] = [];
  state input: string = "";
  state loading: boolean = false;
  
  ai assistant: ChatModel = model("gpt-3.5-turbo");
  
  action async sendMessage() {
    if (!input.trim() || loading) return;
    
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input
    };
    
    messages = [...messages, userMessage];
    input = "";
    loading = true;
    
    try {
      const response = await assistant.complete(messages);
      messages = [...messages, response];
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      loading = false;
    }
  }
  
  render {
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>AI Chat Assistant</h1>
      <div style={{ height: 400, overflowY: 'auto', border: '1px solid #ccc', padding: 20 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: 10 }}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
        {loading && <div>AI is thinking...</div>}
      </div>
      <div style={{ marginTop: 20, display: 'flex' }}>
        <input 
          value={input}
          onChange={(e) => input = e.target.value}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          style={{ flex: 1, padding: 10 }}
          placeholder="Type your message..."
        />
        <button onClick={() => sendMessage()} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  }
}`;

  fs.writeFileSync(path.join(projectPath, 'src', 'App.crowe'), chatComponent);
  generateBasicTemplate(projectPath); // Also generate basic files
}

function generateRealTimeTemplate(projectPath: string) {
  const realtimeComponent = `component LiveDashboard() {
  state data: DataPoint[] = [];
  state connected: boolean = false;
  
  stream liveData: any = "wss://api.example.com/stream";
  
  effect onMount {
    liveData.onOpen(() => {
      connected = true;
      console.log("Connected to live stream");
    });
    
    liveData.onMessage((event) => {
      const newData = JSON.parse(event.data);
      data = [...data.slice(-99), newData]; // Keep last 100 points
    });
    
    liveData.onClose(() => {
      connected = false;
    });
  }
  
  render {
    <div style={{ padding: 20 }}>
      <h1>Real-Time Dashboard</h1>
      <div style={{ 
        padding: 10, 
        background: connected ? '#4ade80' : '#f87171',
        color: 'white',
        borderRadius: 4
      }}>
        {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      <div style={{ marginTop: 20 }}>
        <h2>Live Data ({data.length} points)</h2>
        <div style={{ height: 300, overflowY: 'auto', border: '1px solid #ccc' }}>
          {data.map((point, i) => (
            <div key={i} style={{ padding: 5 }}>
              {point.timestamp}: {point.value}
            </div>
          ))}
        </div>
      </div>
    </div>
  }
}`;

  fs.writeFileSync(path.join(projectPath, 'src', 'App.crowe'), realtimeComponent);
  generateBasicTemplate(projectPath); // Also generate basic files
}

function generateFullStackTemplate(projectPath: string) {
  // Create stores directory
  fs.mkdirSync(path.join(projectPath, 'src', 'stores'), { recursive: true });
  
  const appStore = `store AppStore {
  state user: User | null = null;
  state theme: string = "light";
  state notifications: Notification[] = [];
  
  action login(userData: User) {
    user = userData;
  }
  
  action logout() {
    user = null;
  }
  
  action toggleTheme() {
    theme = theme === "light" ? "dark" : "light";
  }
  
  action addNotification(notification: Notification) {
    notifications = [...notifications, notification];
  }
}`;

  fs.writeFileSync(path.join(projectPath, 'src', 'stores', 'AppStore.crowe'), appStore);
  
  const fullApp = `component App() {
  computed store: any { return useAppStore(); }
  
  state activeTab: string = "dashboard";
  
  stream updates: any = "wss://api.example.com/updates";
  ai assistant: Model = model("gpt-3.5-turbo");
  
  effect onMount {
    updates.onMessage((msg) => {
      const data = JSON.parse(msg.data);
      store.addNotification(data);
    });
  }
  
  render {
    <div style={{ 
      minHeight: '100vh',
      background: store.theme === 'light' ? '#fff' : '#1a1a1a',
      color: store.theme === 'light' ? '#000' : '#fff'
    }}>
      <header style={{ padding: 20, borderBottom: '1px solid #ccc' }}>
        <h1>Full Stack Crowe App</h1>
        <button onClick={() => store.toggleTheme()}>
          Toggle Theme
        </button>
      </header>
      
      <nav style={{ padding: 20 }}>
        <button onClick={() => activeTab = "dashboard"}>Dashboard</button>
        <button onClick={() => activeTab = "chat"}>AI Chat</button>
        <button onClick={() => activeTab = "settings"}>Settings</button>
      </nav>
      
      <main style={{ padding: 20 }}>
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "chat" && <Chat />}
        {activeTab === "settings" && <Settings />}
      </main>
      
      <div style={{ position: 'fixed', bottom: 20, right: 20 }}>
        {store.notifications.map(notif => (
          <div key={notif.id} style={{ 
            background: '#3b82f6', 
            color: 'white', 
            padding: 10,
            marginBottom: 10,
            borderRadius: 4
          }}>
            {notif.message}
          </div>
        ))}
      </div>
    </div>
  }
}`;

  fs.writeFileSync(path.join(projectPath, 'src', 'App.crowe'), fullApp);
  generateBasicTemplate(projectPath); // Also generate basic files
}

// CLI Setup
program
  .name('create-crowe-app')
  .description('Create a new Crowe application')
  .version('0.1.0')
  .argument('<project-name>', 'Name of the project')
  .option('-t, --template <template>', 'Template to use', 'basic')
  .option('--typescript', 'Use TypeScript', true)
  .option('--no-git', 'Skip git initialization')
  .option('--no-install', 'Skip dependency installation')
  .option('--pm <package-manager>', 'Package manager to use (npm, yarn, pnpm)', 'npm')
  .action((projectName, options) => {
    // Show available templates if requested
    if (options.template === 'list') {
      console.log('\nAvailable templates:\n');
      Object.entries(TEMPLATES).forEach(([key, value]) => {
        console.log(`  ${key.padEnd(12)} - ${value.description}`);
      });
      console.log();
      return;
    }

    createProject(projectName, {
      template: options.template,
      typescript: options.typescript,
      git: options.git,
      install: options.install,
      packageManager: options.pm as 'npm' | 'yarn' | 'pnpm'
    });
  });

program.parse();

export { createProject };