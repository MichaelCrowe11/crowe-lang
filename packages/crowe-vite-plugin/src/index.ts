export interface Plugin {
  name: string;
  configureServer?: (server: any) => void;
  transform?: (code: string, id: string) => Promise<any> | any;
  handleHotUpdate?: (ctx: any) => any;
  transformIndexHtml?: (html: string) => string;
  error?: (message: string, options?: any) => void;
}

export interface ViteDevServer {
  // Minimal interface
}
import { compileCroweToReactTSXWithStats } from '../../crowe-compiler/src/index';
import * as path from 'path';
import * as fs from 'fs';

export interface CroweViteOptions {
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
  hmr?: boolean;
  sourceMaps?: boolean;
}

function matchesPattern(id: string, pattern: string | RegExp | (string | RegExp)[]): boolean {
  if (Array.isArray(pattern)) {
    return pattern.some(p => matchesPattern(id, p));
  }
  if (typeof pattern === 'string') {
    return id.includes(pattern);
  }
  return pattern.test(id);
}

export function crowePlugin(options: CroweViteOptions = {}): Plugin {
  const {
    include = /\.crowe$/,
    exclude = /node_modules/,
    hmr = true,
    sourceMaps = true
  } = options;

  let server: ViteDevServer | undefined;

  return {
    name: 'vite-plugin-crowe',

    configureServer(_server: any) {
      server = _server;
    },

    async transform(code: string, id: string) {
      // Check if this is a Crowe file
      if (!matchesPattern(id, include)) {
        return null;
      }

      // Check exclusions
      if (exclude && matchesPattern(id, exclude)) {
        return null;
      }

      try {
        // Compile Crowe to React TSX
        const result = compileCroweToReactTSXWithStats(code, {
          filename: id,
          sourceMaps,
          enableProfiling: false,
          useCache: true
        });

        // Add HMR code if enabled
        let output = result.output;
        if (hmr && server) {
          output = addHMRCode(output, id);
        }

        // Transform to JavaScript (let Vite handle JSX)
        const transformed = {
          code: output,
          map: result.sourceMap || null
        };

        return transformed;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (this.error) {
          this.error(`Crowe compilation failed:\n${message}`, { id });
        } else {
          throw new Error(`Crowe compilation failed:\n${message}`);
        }
      }
    },

    handleHotUpdate({ file, server, modules }: any) {
      if (!matchesPattern(file, include)) {
        return;
      }

      // Log HMR update
      console.log(`[crowe] hot update: ${path.relative(process.cwd(), file)}`);

      // Return modules to trigger HMR
      return modules;
    }
  };
}

function addHMRCode(code: string, id: string): string {
  // Extract component name from the export
  const componentMatch = code.match(/export\s+function\s+(\w+)/);
  if (!componentMatch) {
    return code;
  }

  const componentName = componentMatch[1];
  const hmrCode = `
// Crowe HMR Integration
if (import.meta.hot) {
  import.meta.hot.accept();
  
  const prevComponent = window.__croweComponents?.['${id}'];
  if (prevComponent) {
    // Preserve component state during HMR
    const prevState = window.__croweComponentStates?.['${id}'];
    if (prevState) {
      // Restore state after component update
      window.__croweRestoreState = prevState;
    }
  }
  
  // Register component for HMR
  window.__croweComponents = window.__croweComponents || {};
  window.__croweComponents['${id}'] = ${componentName};
}
`;

  return code + hmrCode;
}

// Create app integration helper
export function createCroweApp(options: CroweViteOptions = {}): Plugin[] {
  return [
    crowePlugin(options),
    {
      name: 'crowe-app-setup',
      transformIndexHtml(html: string) {
        // Inject Crowe runtime if needed
        const croweRuntime = `
          <script type="module">
            window.__croweComponents = {};
            window.__croweComponentStates = {};
            console.log('[Crowe] Runtime initialized');
          </script>
        `;
        
        return html.replace('</head>', `${croweRuntime}</head>`);
      }
    }
  ];
}

// Export for use in vite.config.ts
export default crowePlugin;