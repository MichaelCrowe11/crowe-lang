import * as WebSocket from 'ws';
import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs';
import { compileCroweToReactTSXWithStats } from '../../crowe-compiler/src/index';
import { createHash } from 'crypto';

export interface HMROptions {
  port?: number;
  host?: string;
  watchDir?: string;
  verbose?: boolean;
}

export interface HMRUpdate {
  type: 'update' | 'error' | 'full-reload';
  path: string;
  content?: string;
  error?: string;
  timestamp: number;
  hash?: string;
}

export class CroweHMRServer {
  private wss: WebSocket.Server;
  private watcher: chokidar.FSWatcher | null = null;
  private clients = new Set<WebSocket.WebSocket>();
  private fileHashes = new Map<string, string>();
  private options: Required<HMROptions>;

  constructor(options: HMROptions = {}) {
    this.options = {
      port: options.port || 3001,
      host: options.host || 'localhost',
      watchDir: options.watchDir || process.cwd(),
      verbose: options.verbose || false
    };

    this.wss = new WebSocket.Server({
      port: this.options.port,
      host: this.options.host
    });

    this.setupWebSocketServer();
    this.setupFileWatcher();

    if (this.options.verbose) {
      console.log(`🔥 Crowe HMR Server running at ws://${this.options.host}:${this.options.port}`);
    }
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket.WebSocket) => {
      this.clients.add(ws as any);
      
      if (this.options.verbose) {
        console.log('✅ HMR client connected');
      }

      ws.on('close', () => {
        this.clients.delete(ws as any);
        if (this.options.verbose) {
          console.log('❌ HMR client disconnected');
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws as any);
      });

      // Send initial connection success
      ws.send(JSON.stringify({
        type: 'connected',
        timestamp: Date.now()
      }));
    });
  }

  private setupFileWatcher(): void {
    const watchPattern = path.join(this.options.watchDir, '**/*.crowe');
    
    this.watcher = chokidar.watch(watchPattern, {
      ignoreInitial: true,
      persistent: true
    });

    this.watcher.on('change', (filePath) => {
      this.handleFileChange(filePath);
    });

    this.watcher.on('add', (filePath) => {
      this.handleFileChange(filePath);
    });

    this.watcher.on('unlink', (filePath) => {
      this.handleFileRemoval(filePath);
    });
  }

  private getFileHash(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  private async handleFileChange(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = this.getFileHash(content);
      
      // Check if file actually changed
      const previousHash = this.fileHashes.get(filePath);
      if (previousHash === hash) {
        return; // No actual change
      }
      
      this.fileHashes.set(filePath, hash);

      if (this.options.verbose) {
        console.log(`📝 File changed: ${path.relative(this.options.watchDir, filePath)}`);
      }

      // Compile the Crowe file
      const result = compileCroweToReactTSXWithStats(content, {
        filename: filePath,
        enableProfiling: false,
        useCache: true
      });

      // Check if component can be hot-reloaded
      const canHotReload = this.isComponentHotReloadable(content, result.output);

      const update: HMRUpdate = {
        type: canHotReload ? 'update' : 'full-reload',
        path: filePath,
        content: result.output,
        timestamp: Date.now(),
        hash
      };

      this.broadcast(update);

      if (this.options.verbose) {
        console.log(`♻️  ${canHotReload ? 'Hot update' : 'Full reload'} sent for ${path.basename(filePath)}`);
      }
    } catch (error) {
      const errorUpdate: HMRUpdate = {
        type: 'error',
        path: filePath,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      };

      this.broadcast(errorUpdate);

      if (this.options.verbose) {
        console.error(`❌ Compilation error:`, error);
      }
    }
  }

  private handleFileRemoval(filePath: string): void {
    this.fileHashes.delete(filePath);
    
    const update: HMRUpdate = {
      type: 'full-reload',
      path: filePath,
      timestamp: Date.now()
    };

    this.broadcast(update);

    if (this.options.verbose) {
      console.log(`🗑️  File removed: ${path.relative(this.options.watchDir, filePath)}`);
    }
  }

  private isComponentHotReloadable(source: string, compiled: string): boolean {
    // Check if the component is stateless or has simple state
    // that can be preserved during hot reload
    
    // Components with stores or complex effects need full reload
    if (source.includes('store ') || source.includes('effect ')) {
      return false;
    }

    // Check if compiled output exports a single component
    const exportMatches = compiled.match(/export\s+(function|const)\s+(\w+)/g);
    if (!exportMatches || exportMatches.length !== 1) {
      return false;
    }

    // Component is likely hot-reloadable
    return true;
  }

  private broadcast(update: HMRUpdate): void {
    const message = JSON.stringify(update);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
    }
    
    this.clients.forEach(client => {
      client.close();
    });
    
    this.wss.close();

    if (this.options.verbose) {
      console.log('🛑 HMR Server stopped');
    }
  }
}

// CLI support
export function startHMRServer(options: HMROptions = {}): CroweHMRServer {
  return new CroweHMRServer(options);
}

// React HMR client code generator
export function generateHMRClient(): string {
  return `
// Crowe HMR Client
(function() {
  if (typeof window === 'undefined') return;
  
  const HMR_PORT = ${process.env.CROWE_HMR_PORT || 3001};
  const HMR_HOST = '${process.env.CROWE_HMR_HOST || 'localhost'}';
  
  let ws;
  let reconnectTimer;
  
  function connect() {
    ws = new WebSocket(\`ws://\${HMR_HOST}:\${HMR_PORT}\`);
    
    ws.onopen = () => {
      console.log('[Crowe HMR] Connected');
      clearTimeout(reconnectTimer);
    };
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      switch (update.type) {
        case 'connected':
          console.log('[Crowe HMR] Ready');
          break;
          
        case 'update':
          handleHotUpdate(update);
          break;
          
        case 'full-reload':
          console.log('[Crowe HMR] Full reload required');
          window.location.reload();
          break;
          
        case 'error':
          console.error('[Crowe HMR] Compilation error:', update.error);
          showError(update.error);
          break;
      }
    };
    
    ws.onclose = () => {
      console.log('[Crowe HMR] Connection lost, reconnecting...');
      reconnectTimer = setTimeout(connect, 1000);
    };
    
    ws.onerror = (error) => {
      console.error('[Crowe HMR] WebSocket error:', error);
    };
  }
  
  function handleHotUpdate(update) {
    console.log('[Crowe HMR] Applying hot update for', update.path);
    
    // Create a new script element with the updated code
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = \`
      import * as React from 'react';
      import { createRoot } from 'react-dom/client';
      
      \${update.content}
      
      // Re-render the component
      if (window.__croweHMRRoot) {
        const Component = eval(update.content.match(/export function (\\w+)/)[1]);
        window.__croweHMRRoot.render(React.createElement(Component));
      }
    \`;
    
    document.head.appendChild(script);
    
    // Clean up old script
    setTimeout(() => script.remove(), 100);
  }
  
  function showError(error) {
    // Show error overlay
    const overlay = document.createElement('div');
    overlay.id = 'crowe-hmr-error';
    overlay.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      color: #ff5555;
      padding: 20px;
      font-family: monospace;
      font-size: 14px;
      white-space: pre-wrap;
      overflow: auto;
      z-index: 999999;
    \`;
    overlay.textContent = '⚠️ Crowe Compilation Error\\n\\n' + error;
    overlay.onclick = () => overlay.remove();
    
    document.body.appendChild(overlay);
  }
  
  connect();
})();
`;
}