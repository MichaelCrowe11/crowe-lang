// AST type definitions for crowe-lang v0.2.2
export type Program = {
  kind: 'Program';
  imports: ImportDecl[];
  stores: StoreDecl[];
  components: ComponentDecl[];
};

export type ImportDecl = { 
  kind: 'ImportDecl'; 
  source: string; 
  alias?: string; 
  loc: Loc 
};

export type StoreDecl = { 
  kind: 'StoreDecl'; 
  name: Id; 
  fields: (StoreState | StoreAction)[]; 
  loc: Loc 
};

export type StoreState = { 
  kind: 'StoreState'; 
  name: Id; 
  ty: TypeNode; 
  init?: Expr; 
  loc: Loc 
};

export type StoreAction = { 
  kind: 'StoreAction'; 
  name: Id; 
  params: Param[]; 
  body: Block; 
  loc: Loc 
};

export type ComponentDecl = {
  kind: 'ComponentDecl'; 
  name: Id; 
  typeParams?: Id[]; 
  props?: Param[]; 
  body: Block; 
  loc: Loc
};

export type Block = { 
  kind: 'Block'; 
  stmts: Stmt[]; 
  loc: Loc 
};

export type Stmt = 
  | VarDecl 
  | StateDecl 
  | ComputedDecl 
  | EffectDecl 
  | ActionDecl 
  | ViewDecl 
  | ExprStmt;

export type ExprStmt = { 
  kind: 'ExprStmt'; 
  expr: Expr; 
  loc: Loc 
};

export type VarDecl = { 
  kind: 'VarDecl'; 
  name: Id; 
  ty?: TypeNode; 
  init?: Expr; 
  loc: Loc 
};

export type StateDecl = { 
  kind: 'StateDecl'; 
  name: Id; 
  ty: TypeNode; 
  init?: Expr; 
  loc: Loc 
};

export type ComputedDecl = { 
  kind: 'ComputedDecl'; 
  name: Id; 
  params: Param[]; 
  ret?: TypeNode; 
  expr: Expr; 
  loc: Loc 
};

export type EffectDecl = { 
  kind: 'EffectDecl'; 
  deps?: Expr; 
  body: Block; 
  loc: Loc 
};

export type ActionDecl = { 
  kind: 'ActionDecl'; 
  name: Id; 
  params: Param[]; 
  body: Block; 
  loc: Loc 
};

export type ViewDecl = { 
  kind: 'ViewDecl'; 
  jsx: JSXNode; 
  loc: Loc 
};

export type Param = { 
  name: Id; 
  ty: TypeNode; 
  loc?: Loc 
};

export type Id = { 
  text: string; 
  loc: Loc 
};

export type Loc = { 
  start: number; 
  end: number; 
  line: number; 
  col: number 
};

// Expressions
export type Expr = 
  | Lit 
  | IdExpr 
  | CallExpr 
  | MemberExpr 
  | BinaryExpr 
  | UnaryExpr
  | ArrayLit 
  | ObjectLit 
  | ParenExpr
  | AssignExpr
  | AwaitExpr;

export type IdExpr = { 
  kind: 'IdExpr'; 
  id: Id 
};

export type Lit = { 
  kind: 'Lit'; 
  value: number | string | boolean | null; 
  raw: string; 
  loc: Loc 
};

export type ParenExpr = { 
  kind: 'ParenExpr'; 
  inner: Expr; 
  loc: Loc 
};

export type CallExpr = { 
  kind: 'CallExpr'; 
  callee: Expr; 
  args: Expr[]; 
  loc: Loc 
};

export type MemberExpr = { 
  kind: 'MemberExpr'; 
  target: Expr; 
  prop: Id; 
  loc: Loc 
};

export type BinaryExpr = { 
  kind: 'BinaryExpr'; 
  op: BinaryOp; 
  left: Expr; 
  right: Expr; 
  loc: Loc 
};

export type UnaryExpr = {
  kind: 'UnaryExpr';
  op: UnaryOp;
  arg: Expr;
  loc: Loc;
};

export type AssignExpr = {
  kind: 'AssignExpr';
  left: Expr;
  right: Expr;
  loc: Loc;
};

export type AwaitExpr = {
  kind: 'AwaitExpr';
  arg: Expr;
  loc: Loc;
};

export type ArrayLit = { 
  kind: 'ArrayLit'; 
  elems: Expr[]; 
  loc: Loc 
};

export type ObjectLit = { 
  kind: 'ObjectLit'; 
  fields: ObjectField[]; 
  loc: Loc 
};

export type ObjectField = {
  key: Id | Lit;
  value: Expr;
  computed?: boolean;
};

export type BinaryOp = 
  | '&&' | '||' 
  | '==' | '!=' | '===' | '!=='
  | '<' | '<=' | '>' | '>='
  | '+' | '-' | '*' | '/' | '%';

export type UnaryOp = '!' | '-' | '+' | '~' | 'typeof' | 'void';

// JSX
export type JSXNode = 
  | JSXElem 
  | JSXSelfClosing 
  | JSXText 
  | JSXExpr
  | JSXFragment;

export type JSXElem = { 
  kind: 'JSXElem'; 
  name: Id; 
  attrs: JSXAttr[]; 
  children: JSXNode[]; 
  loc: Loc 
};

export type JSXSelfClosing = { 
  kind: 'JSXSelfClosing'; 
  name: Id; 
  attrs: JSXAttr[]; 
  loc: Loc 
};

export type JSXFragment = {
  kind: 'JSXFragment';
  children: JSXNode[];
  loc: Loc;
};

export type JSXText = { 
  kind: 'JSXText'; 
  text: string; 
  loc: Loc 
};

export type JSXExpr = { 
  kind: 'JSXExpr'; 
  expr: Expr; 
  loc: Loc 
};

export type JSXAttr = { 
  name: Id; 
  value: Expr | string; 
  loc: Loc 
};

// Types
export type TypeNode =
  | TPrim
  | TRef
  | TArray
  | TRecord
  | TFunction
  | TUnion
  | TOptional;

export type TPrim = {
  kind: 'TPrim';
  name: 'number' | 'string' | 'boolean' | 'void' | 'any' | 'never';
};

export type TRef = {
  kind: 'TRef';
  name: Id;
  args?: TypeNode[];
};

export type TArray = {
  kind: 'TArray';
  elem: TypeNode;
};

export type TRecord = {
  kind: 'TRecord';
  fields: TypeField[];
};

export type TypeField = {
  name: Id;
  ty: TypeNode;
  optional?: boolean;
};

export type TFunction = {
  kind: 'TFunction';
  params: TypeNode[];
  ret: TypeNode;
};

export type TUnion = {
  kind: 'TUnion';
  types: TypeNode[];
};

export type TOptional = {
  kind: 'TOptional';
  ty: TypeNode;
};