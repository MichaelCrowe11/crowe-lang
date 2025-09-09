import { CroweFile, Component, Store, Section, StoreSection, StateDecl, ComputedDecl, EffectDecl, ActionDecl, RenderBlock, StreamDecl, AIDecl } from './ast';
import { stripComments, readBalanced, trimSemicolon } from './utils';

export function parseCrowe(src: string): CroweFile {
  const code = stripComments(src);
  const stores: Store[] = [];
  const components: Component[] = [];
  
  // Parse stores first
  const storeRE = /store\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g;
  let m: RegExpExecArray | null;
  
  while ((m = storeRE.exec(code))) {
    const name = m[1];
    const braceIndex = storeRE.lastIndex - 1;
    const { content, end } = readBalanced(code, braceIndex);
    
    const sections = parseStoreSections(content);
    stores.push({ name, sections });
    
    storeRE.lastIndex = end;
  }
  
  // Then parse components
  const compRE = /component\s+([A-Za-z_][A-Za-z0-9_]*)\s*(\(([^)]*)\))?\s*\{/g;

  while ((m = compRE.exec(code))) {
    const name = m[1];
    const params = (m[3] ?? '').trim() || undefined;
    const braceIndex = compRE.lastIndex - 1; // at '{'
    const { content, end } = readBalanced(code, braceIndex);

    const sections: Section[] = parseSections(content);
    components.push({ name, params, sections });

    compRE.lastIndex = end; // continue scanning after this component
  }

  return { stores: stores.length > 0 ? stores : undefined, components };
}

function parseSections(body: string): Section[] {
  const sections: Section[] = [];
  let i = 0;
  const src = body;

  while (i < src.length) {
    // skip whitespace
    if (/\s/.test(src[i])) { i++; continue; }

    // state
    let mm = matchFrom(/^state\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^=;{]+))?\s*=\s*/, src, i);
    if (mm) {
      const name = mm[1];
      const type = mm[2]?.trim();
      i = mm.index! + mm[0].length;
      // read expression until semicolon (aware of braces/parens/strings)
      const { expr, next } = readExpressionUntilSemicolon(src, i);
      i = next;
      const st: StateDecl = { kind: 'state', name, type, init: expr };
      sections.push(st);
      continue;
    }

    // computed (optional deps)
    mm = matchFrom(/^computed\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^({]+))?\s*(?:\(\s*deps\s*:\s*\[([^\]]*)\]\s*\))?\s*\{/, src, i);
    if (mm) {
      const name = mm[1];
      const type = mm[2]?.trim();
      const deps = (mm[3]?.split(',').map(s => s.trim()).filter(Boolean)) || undefined;
      const brace = mm.index! + mm[0].length - 1;
      const { content, end } = readBalanced(src, brace);
      const cm: ComputedDecl = { kind: 'computed', name, type, deps, body: content.trim() };
      sections.push(cm);
      i = end; continue;
    }

    // effect onMount / effect name(deps: [...])
    mm = matchFrom(/^effect\s+(onMount|[A-Za-z_][A-Za-z0-9_]*)\s*(?:\(\s*deps\s*:\s*\[([^\]]*)\]\s*\))?\s*\{/, src, i);
    if (mm) {
      const name = mm[1];
      const deps = name === 'onMount' ? [] : (mm[2]?.split(',').map(s => s.trim()).filter(Boolean));
      const brace = mm.index! + mm[0].length - 1;
      const { content, end } = readBalanced(src, brace);
      const ef: EffectDecl = { kind: 'effect', name, deps, body: content.trim() };
      sections.push(ef);
      i = end; continue;
    }

    // action IDENT(params) [async] { ... }
    mm = matchFrom(/^action\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(async)?\s*\{/, src, i);
    if (mm) {
      const name = mm[1];
      const params = (mm[2] ?? '').trim();
      const isAsync = !!mm[3];
      const brace = mm.index! + mm[0].length - 1;
      const { content, end } = readBalanced(src, brace);
      const ac: ActionDecl = { kind: 'action', name, params, isAsync, body: content.trim() };
      sections.push(ac);
      i = end; continue;
    }

    // render { ... }
    mm = matchFrom(/^render\s*\{/, src, i);
    if (mm) {
      const brace = mm.index! + mm[0].length - 1;
      const { content, end } = readBalanced(src, brace);
      const rb: RenderBlock = { kind: 'render', jsx: content.trim() };
      sections.push(rb);
      i = end; continue;
    }

    // stream name: type = source
    mm = matchFrom(/^stream\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^=]+))?\s*=\s*/, src, i);
    if (mm) {
      const name = mm[1];
      const type = mm[2]?.trim();
      i = mm.index! + mm[0].length;
      const { expr, next } = readExpressionUntilSemicolon(src, i);
      i = next;
      const st: StreamDecl = { kind: 'stream', name, type, source: expr };
      sections.push(st);
      continue;
    }

    // ai name: type = model("model-name")
    mm = matchFrom(/^ai\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^=]+))?\s*=\s*(?:model|loadModel)\s*\(\s*["']([^"']+)["']\s*\)\s*;?/, src, i);
    if (mm) {
      const name = mm[1];
      const type = mm[2]?.trim();
      const model = mm[3];
      i = mm.index! + mm[0].length;
      // Skip optional semicolon
      if (src[i] === ';') i++;
      const ai: AIDecl = { kind: 'ai', name, model, type };
      sections.push(ai);
      continue;
    }

    // unknown token; try to recover by moving to next line
    const nextNL = src.indexOf('\n', i);
    if (nextNL === -1) throw new Error(`Unexpected token near: ${src.slice(i, i+50)}`);
    i = nextNL + 1;
  }

  return sections;
}

function parseStoreSections(body: string): StoreSection[] {
  const sections: StoreSection[] = [];
  let i = 0;
  const src = body;

  while (i < src.length) {
    // skip whitespace
    if (/\s/.test(src[i])) { i++; continue; }

    // state
    let mm = matchFrom(/^state\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^=;{]+))?\s*=\s*/, src, i);
    if (mm) {
      const name = mm[1];
      const type = mm[2]?.trim();
      i = mm.index! + mm[0].length;
      const { expr, next } = readExpressionUntilSemicolon(src, i);
      i = next;
      const st: StateDecl = { kind: 'state', name, type, init: expr };
      sections.push(st);
      continue;
    }

    // computed
    mm = matchFrom(/^computed\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^({]+))?\s*(?:\(\s*deps\s*:\s*\[([^\]]*)\]\s*\))?\s*\{/, src, i);
    if (mm) {
      const name = mm[1];
      const type = mm[2]?.trim();
      const deps = (mm[3]?.split(',').map(s => s.trim()).filter(Boolean)) || undefined;
      const brace = mm.index! + mm[0].length - 1;
      const { content, end } = readBalanced(src, brace);
      const cm: ComputedDecl = { kind: 'computed', name, type, deps, body: content.trim() };
      sections.push(cm);
      i = end; continue;
    }

    // action
    mm = matchFrom(/^action\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(async)?\s*\{/, src, i);
    if (mm) {
      const name = mm[1];
      const params = (mm[2] ?? '').trim();
      const isAsync = !!mm[3];
      const brace = mm.index! + mm[0].length - 1;
      const { content, end } = readBalanced(src, brace);
      const ac: ActionDecl = { kind: 'action', name, params, isAsync, body: content.trim() };
      sections.push(ac);
      i = end; continue;
    }

    // stream
    mm = matchFrom(/^stream\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^=]+))?\s*=\s*/, src, i);
    if (mm) {
      const name = mm[1];
      const type = mm[2]?.trim();
      i = mm.index! + mm[0].length;
      const { expr, next } = readExpressionUntilSemicolon(src, i);
      i = next;
      const st: StreamDecl = { kind: 'stream', name, type, source: expr };
      sections.push(st);
      continue;
    }

    // ai
    mm = matchFrom(/^ai\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^=]+))?\s*=\s*(?:model|loadModel)\s*\(\s*["']([^"']+)["']\s*\)\s*;?/, src, i);
    if (mm) {
      const name = mm[1];
      const type = mm[2]?.trim();
      const model = mm[3];
      i = mm.index! + mm[0].length;
      if (src[i] === ';') i++;
      const ai: AIDecl = { kind: 'ai', name, model, type };
      sections.push(ai);
      continue;
    }

    const nextNL = src.indexOf('\n', i);
    if (nextNL === -1) break;
    i = nextNL + 1;
  }

  return sections;
}

function matchFrom(re: RegExp, src: string, index: number): RegExpExecArray | null {
  const slice = src.slice(index);
  const m = re.exec(slice);
  if (m && m.index === 0) {
    m.index = index; // Fix the absolute index
    return m;
  }
  return null;
}

function readExpressionUntilSemicolon(src: string, start: number): { expr: string; next: number } {
  let i = start;
  let depthParen = 0, depthBrace = 0, depthBracket = 0;
  let inSQ = false, inDQ = false, inBQ = false;
  while (i < src.length) {
    const c = src[i], p = src[i - 1];
    if (!inSQ && !inDQ && !inBQ) {
      if (c === '(') depthParen++; else if (c === ')') depthParen--;
      else if (c === '{') depthBrace++; else if (c === '}') depthBrace--;
      else if (c === '[') depthBracket++; else if (c === ']') depthBracket--;
      else if (c === ';' && depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
        const raw = src.slice(start, i);
        return { expr: trimSemicolon(raw), next: i + 1 };
      }
      if (c === '\'' && p !== '\\') inSQ = true;
      else if (c === '"' && p !== '\\') inDQ = true;
      else if (c === '`' && p !== '\\') inBQ = true;
      i++; continue;
    }
    if (inSQ && c === '\'' && p !== '\\') inSQ = false;
    else if (inDQ && c === '"' && p !== '\\') inDQ = false;
    else if (inBQ && c === '`' && p !== '\\') inBQ = false;
    i++;
  }
  throw new Error('Unterminated expression (missing ;)');
}