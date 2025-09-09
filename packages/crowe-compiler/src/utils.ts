export function stripComments(src: string): string {
  // Remove // line comments and /* */ block comments while preserving strings.
  let out = '';
  let i = 0;
  let inSL = false, inML = false;
  let inSQ = false, inDQ = false, inBQ = false; // ', ", `

  while (i < src.length) {
    const c = src[i], n = src[i + 1];

    if (!inSL && !inML) {
      if (!inSQ && !inDQ && !inBQ && c === '/' && n === '/') { inSL = true; i += 2; continue; }
      if (!inSQ && !inDQ && !inBQ && c === '/' && n === '*') { inML = true; i += 2; continue; }
      if (!inDQ && !inBQ && c === '\'' && src[i - 1] !== '\\') inSQ = !inSQ;
      else if (!inSQ && !inBQ && c === '"' && src[i - 1] !== '\\') inDQ = !inDQ;
      else if (!inSQ && !inDQ && c === '`' && src[i - 1] !== '\\') inBQ = !inBQ;
      out += c; i++; continue;
    }

    if (inSL) { if (c === '\n') { inSL = false; out += c; } i++; continue; }
    if (inML) { if (c === '*' && n === '/') { inML = false; i += 2; } else { i++; } continue; }
  }
  return out;
}

export function readBalanced(src: string, startIndex: number, open = '{', close = '}'): { content: string; end: number; } {
  // Assumes src[startIndex] is the opening brace. Returns content between braces and index after closing brace.
  if (src[startIndex] !== open) throw new Error(`Expected '${open}' at ${startIndex}`);
  let i = startIndex + 1;
  let depth = 1;
  let inSQ = false, inDQ = false, inBQ = false;
  while (i < src.length) {
    const c = src[i], p = src[i - 1];
    if (!inSQ && !inDQ && !inBQ) {
      if (c === open) depth++;
      else if (c === close) depth--;
      if (depth === 0) return { content: src.slice(startIndex + 1, i), end: i + 1 };
      if (c === '\'' && p !== '\\') inSQ = true;
      else if (c === '"' && p !== '\\') inDQ = true;
      else if (c === '`' && p !== '\\') inBQ = true;
      i++; continue;
    }
    // inside a string literal
    if (inSQ && c === '\'' && p !== '\\') inSQ = false;
    else if (inDQ && c === '"' && p !== '\\') inDQ = false;
    else if (inBQ && c === '`' && p !== '\\') inBQ = false;
    i++;
  }
  throw new Error('Unbalanced braces');
}

export function trimSemicolon(s: string): string {
  return s.trim().replace(/;\s*$/, '');
}