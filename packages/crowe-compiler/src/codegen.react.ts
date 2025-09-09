import { CroweFile, Component, Section, StateDecl, ComputedDecl, EffectDecl, ActionDecl, RenderBlock } from './ast';

export function generateReactTSX(ast: CroweFile): string {
  const lines: string[] = [];
  lines.push(`import * as React from 'react';`);
  lines.push('');

  for (const comp of ast.components) {
    emitComponent(comp, lines);
    lines.push('');
  }
  return lines.join('\n');
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