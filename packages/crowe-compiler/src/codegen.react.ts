import { CroweFile, Component, Store, Section, StateDecl, ComputedDecl, EffectDecl, ActionDecl, RenderBlock, StreamDecl, AIDecl } from './ast';
import { generateSourceMapForComponent, addSourceMapComment } from './source-map';

export interface CodeGenOptions {
  sourceMaps?: boolean;
  sourceMapPath?: string;
  originalSource?: string;
  sourcePath?: string;
}

export function generateReactTSX(ast: CroweFile, options: CodeGenOptions = {}): string {
  const lines: string[] = [];
  lines.push(`import * as React from 'react';`);
  
  // Check if we need Zustand for stores
  if (ast.stores && ast.stores.length > 0) {
    lines.push(`import { create } from 'zustand';`);
  }
  
  // Check if we have AI operations
  const hasAI = ast.components.some(c => c.sections.some(s => s.kind === 'ai')) ||
                ast.stores?.some(s => s.sections.some(sec => sec.kind === 'ai'));
  
  if (hasAI) {
    lines.push(`import { loadModel, inferenceSession } from '@crowe/ai-runtime';`);
  }
  
  lines.push('');

  // Emit stores first (they become Zustand stores)
  if (ast.stores) {
    for (const store of ast.stores) {
      emitStore(store, lines);
      lines.push('');
    }
  }

  // Then emit components
  for (const comp of ast.components) {
    emitComponent(comp, lines);
    lines.push('');
  }
  let result = lines.join('\n');
  
  // Generate source maps if requested
  if (options.sourceMaps && options.originalSource && options.sourcePath) {
    const sourceMap = generateSourceMapForComponent(
      options.originalSource,
      result,
      options.sourcePath
    );
    
    if (options.sourceMapPath) {
      result = addSourceMapComment(result, options.sourceMapPath);
    }
  }
  
  return result;
}

function emitComponent(comp: Component, out: string[]) {
  const fnHeader = `export function ${comp.name}(${comp.params ?? ''}) {`;
  out.push(fnHeader);

  const stateNames: string[] = [];
  const setters: Record<string,string> = {};

  // First pass: emit state declarations
  for (const s of comp.sections) if (s.kind === 'state') {
    const st = s as StateDecl;
    const setter = 'set' + capitalize(st.name);
    stateNames.push(st.name); setters[st.name] = setter;
    out.push(`  const [${st.name}, ${setter}] = React.useState<${st.type ?? 'any'}>(${st.init});`);
  }

  // Handle AI models
  for (const s of comp.sections) if (s.kind === 'ai') {
    const ai = s as AIDecl;
    out.push(`  const [${ai.name}, set${capitalize(ai.name)}] = React.useState(null);`);
    out.push(`  React.useEffect(() => {`);
    out.push(`    loadModel('${ai.model}').then(set${capitalize(ai.name)});`);
    out.push(`  }, []);`);
  }
  
  // Handle streams
  for (const s of comp.sections) if (s.kind === 'stream') {
    const stream = s as StreamDecl;
    out.push(`  const [${stream.name}, set${capitalize(stream.name)}] = React.useState<${stream.type || 'any'}>(null);`);
    out.push(`  React.useEffect(() => {`);
    out.push(`    const source = new EventSource(${stream.source});`);
    out.push(`    source.onmessage = (e) => set${capitalize(stream.name)}(JSON.parse(e.data));`);
    out.push(`    return () => source.close();`);
    out.push(`  }, []);`);
  }

  // Second pass: computed -> either IIFE or useMemo
  for (const s of comp.sections) if (s.kind === 'computed') {
    const c = s as ComputedDecl;
    if (c.deps && c.deps.length > 0) {
      out.push(`  const ${c.name} = React.useMemo(() => { ${inlineReturn(c.body)} }, [${c.deps.join(', ')}]);`);
    } else {
      // IIFE to avoid deps ambiguity; re-run each render
      out.push(`  const ${c.name} = (() => { ${inlineReturn(c.body)} })();`);
    }
  }

  // Third pass: effects
  for (const s of comp.sections) if (s.kind === 'effect') {
    const e = s as any as { name: string; deps?: string[]; body: string };
    const deps = e.name === 'onMount' ? '[]' : (e.deps ? `[${e.deps.join(', ')}]` : 'undefined as any');
    out.push(`  React.useEffect(() => { ${e.body} }, ${deps});`);
  }

  // Fourth pass: actions (with state assignment transformation)
  for (const s of comp.sections) if (s.kind === 'action') {
    const a = s as ActionDecl;
    const body = transformStateAssignments(a.body, stateNames);
    const prefix = a.isAsync ? 'async ' : '';
    out.push(`  ${prefix}function ${a.name}(${a.params}) { ${body} }`);
  }

  // Render (single, last wins if multiple)
  const render = comp.sections.find(s => s.kind === 'render') as RenderBlock | undefined;
  if (!render) throw new Error(`Component ${comp.name} is missing a render block`);
  out.push(`  return ( ${render.jsx} );`);
  out.push('}');
}

function transformStateAssignments(body: string, stateNames: string[]): string {
  // Replace top-level assignments `name = expr;` with `setName(expr);`
  // This is a heuristic MVP transform; it does not handle destructuring or property assignment.
  let out = body;
  for (const name of stateNames) {
    const setter = 'set' + capitalize(name);
    // Match: beginning of line or non-word boundary, then name, optional whitespace, =, capture until ; at same statement level.
    const re = new RegExp(`(^|[^\\w\.])(${name})\\s*=\\s*([^;]+);`, 'g');
    out = out.replace(re, (_m, pfx, _nm, rhs) => `${pfx}${setter}(${rhs.trim()});`);
  }
  return out;
}

function inlineReturn(body: string): string {
  // If body already contains a top-level return, emit as-is; otherwise wrap as return (expr)
  if (/\breturn\b/.test(body)) return body;
  return `return (${body});`;
}

function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function emitStore(store: Store, out: string[]) {
  out.push(`export const use${store.name} = create((set, get) => ({`);
  
  const stateFields: string[] = [];
  const actions: string[] = [];
  const computedGetters: string[] = [];
  
  for (const section of store.sections) {
    switch (section.kind) {
      case 'state':
        const st = section as StateDecl;
        stateFields.push(`  ${st.name}: ${st.init},`);
        break;
        
      case 'computed':
        const comp = section as ComputedDecl;
        // Store computed as getter
        computedGetters.push(`  get ${comp.name}() { ${inlineReturn(comp.body)} },`);
        break;
        
      case 'action':
        const act = section as ActionDecl;
        const asyncPrefix = act.isAsync ? 'async ' : '';
        // Transform state assignments in store actions
        const transformedBody = transformStoreActions(act.body);
        actions.push(`  ${asyncPrefix}${act.name}: (${act.params}) => { ${transformedBody} },`);
        break;
        
      case 'stream':
        const stream = section as StreamDecl;
        // Initialize WebSocket/EventSource in store
        stateFields.push(`  ${stream.name}: null as ${stream.type || 'any'},`);
        actions.push(`  connect${capitalize(stream.name)}: () => {
    const source = new EventSource(${stream.source});
    source.onmessage = (e) => set({ ${stream.name}: JSON.parse(e.data) });
    return () => source.close();
  },`);
        break;
        
      case 'ai':
        const ai = section as AIDecl;
        stateFields.push(`  ${ai.name}: null as any,`);
        actions.push(`  load${capitalize(ai.name)}: async () => {
    const model = await loadModel('${ai.model}');
    set({ ${ai.name}: model });
  },`);
        break;
    }
  }
  
  // Emit all parts
  stateFields.forEach(f => out.push(f));
  computedGetters.forEach(g => out.push(g));
  actions.forEach(a => out.push(a));
  
  out.push(`}));`);
}

function transformStoreActions(body: string): string {
  // Transform `state = value` to `set({ state: value })`
  // This is a simplified transform - real implementation would use AST
  return body.replace(/(\w+)\s*=\s*([^;]+);/g, 'set({ $1: $2 });');
}