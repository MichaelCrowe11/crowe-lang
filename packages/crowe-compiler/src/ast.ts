export interface CroweFile { components: Component[]; }

export interface Component {
  name: string;
  params?: string; // verbatim TS param list (e.g., "props: { a: number }")
  sections: Section[];
}

export type Section = StateDecl | ComputedDecl | EffectDecl | ActionDecl | RenderBlock;

export interface StateDecl {
  kind: 'state';
  name: string;
  type?: string; // optional, verbatim
  init: string;  // expression, verbatim
}

export interface ComputedDecl {
  kind: 'computed';
  name: string;
  type?: string;
  deps?: string[]; // if given, useMemo
  body: string;    // JS/TS block body without outer braces
}

export interface EffectDecl {
  kind: 'effect';
  name: string;        // 'onMount' or identifier
  deps?: string[];     // [] if onMount
  body: string;        // block body
}

export interface ActionDecl {
  kind: 'action';
  name: string;
  params: string; // verbatim params
  isAsync: boolean;
  body: string;   // block body
}

export interface RenderBlock {
  kind: 'render';
  jsx: string; // JSX body without outer braces
}