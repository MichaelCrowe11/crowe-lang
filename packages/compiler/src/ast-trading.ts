// CroweLang Trading DSL - AST Definitions
// Core AST for quantitative trading strategies

export type Program = {
  kind: 'Program';
  imports: ImportDecl[];
  strategies: StrategyDecl[];
  indicators: IndicatorDecl[];
  data: DataDecl[];
  orders: OrderDecl[];
  events: EventDecl[];
  portfolios: PortfolioDecl[];
  backtests: BacktestDecl[];
};

// ============= Core Declarations =============

export type StrategyDecl = {
  kind: 'StrategyDecl';
  name: Id;
  params?: ParamsBlock;
  indicators?: IndicatorsBlock;
  signals?: SignalsBlock;
  rules?: RulesBlock;
  risk?: RiskBlock;
  events?: EventHandlers;
  loc: Loc;
};

export type IndicatorDecl = {
  kind: 'IndicatorDecl';
  name: Id;
  params: Param[];
  returnType: TypeNode;
  body: Block | Expr;
  loc: Loc;
};

export type DataDecl = {
  kind: 'DataDecl';
  name: Id;
  fields: DataField[];
  computed?: ComputedField[];
  loc: Loc;
};

export type OrderDecl = {
  kind: 'OrderDecl';
  orderType: 'order' | 'market' | 'limit' | 'stop';
  name: Id;
  fields: DataField[];
  loc: Loc;
};

export type EventDecl = {
  kind: 'EventDecl';
  name: Id;
  handlers: EventHandler[];
  loc: Loc;
};

export type PortfolioDecl = {
  kind: 'PortfolioDecl';
  name: Id;
  fields: DataField[];
  metrics?: MetricsBlock;
  constraints?: ConstraintsBlock;
  loc: Loc;
};

export type BacktestDecl = {
  kind: 'BacktestDecl';
  name: Id;
  config: BacktestConfig;
  loc: Loc;
};

// ============= Strategy Components =============

export type ParamsBlock = {
  kind: 'ParamsBlock';
  params: StrategyParam[];
  loc: Loc;
};

export type StrategyParam = {
  name: Id;
  type: TypeNode;
  defaultValue?: Expr;
  constraints?: ParamConstraint[];
};

export type ParamConstraint = {
  kind: 'min' | 'max' | 'in' | 'step';
  value: Expr;
};

export type IndicatorsBlock = {
  kind: 'IndicatorsBlock';
  indicators: IndicatorBinding[];
  loc: Loc;
};

export type IndicatorBinding = {
  name: Id;
  value: IndicatorCall | Expr;
  loc: Loc;
};

export type IndicatorCall = {
  kind: 'IndicatorCall';
  indicator: Id;
  args: Expr[];
  loc: Loc;
};

export type SignalsBlock = {
  kind: 'SignalsBlock';
  signals: SignalBinding[];
  loc: Loc;
};

export type SignalBinding = {
  name: Id;
  condition: Expr;
  loc: Loc;
};

export type RulesBlock = {
  kind: 'RulesBlock';
  rules: TradingRule[];
  loc: Loc;
};

export type TradingRule = {
  kind: 'TradingRule';
  condition: Expr;
  actions: TradingAction[];
  loc: Loc;
};

export type TradingAction = 
  | BuyAction
  | SellAction
  | ShortAction
  | CoverAction
  | CustomAction;

export type BuyAction = {
  kind: 'BuyAction';
  quantity: Expr;
  orderType?: OrderType;
  price?: Expr;
  loc: Loc;
};

export type SellAction = {
  kind: 'SellAction';
  quantity: Expr;
  orderType?: OrderType;
  price?: Expr;
  loc: Loc;
};

export type ShortAction = {
  kind: 'ShortAction';
  quantity: Expr;
  orderType?: OrderType;
  price?: Expr;
  loc: Loc;
};

export type CoverAction = {
  kind: 'CoverAction';
  quantity: Expr;
  orderType?: OrderType;
  price?: Expr;
  loc: Loc;
};

export type CustomAction = {
  kind: 'CustomAction';
  function: Id;
  args: Expr[];
  loc: Loc;
};

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

export type RiskBlock = {
  kind: 'RiskBlock';
  limits: RiskLimit[];
  loc: Loc;
};

export type RiskLimit = {
  name: Id;
  value: Expr;
  loc: Loc;
};

// ============= Data Types =============

export type DataField = {
  name: Id;
  type: TypeNode;
  optional?: boolean;
  defaultValue?: Expr;
  loc: Loc;
};

export type ComputedField = {
  name: Id;
  type: TypeNode;
  computation: Expr;
  loc: Loc;
};

// ============= Events =============

export type EventHandlers = {
  kind: 'EventHandlers';
  handlers: EventHandler[];
  loc: Loc;
};

export type EventHandler = {
  name: Id;
  params: Param[];
  body: Block;
  loc: Loc;
};

// ============= Portfolio & Metrics =============

export type MetricsBlock = {
  kind: 'MetricsBlock';
  metrics: MetricDef[];
  loc: Loc;
};

export type MetricDef = {
  name: Id;
  computation: Expr;
  loc: Loc;
};

export type ConstraintsBlock = {
  kind: 'ConstraintsBlock';
  constraints: ConstraintDef[];
  loc: Loc;
};

export type ConstraintDef = {
  name: Id;
  value: Expr;
  loc: Loc;
};

// ============= Backtesting =============

export type BacktestConfig = {
  dataSource?: Expr;
  startDate?: Expr;
  endDate?: Expr;
  initialCapital?: Expr;
  universe?: Expr;
  frequency?: Expr;
  costs?: CostsConfig;
  output?: OutputConfig;
  loc: Loc;
};

export type CostsConfig = {
  commission?: Expr;
  slippage?: Expr;
  borrowRate?: Expr;
  loc: Loc;
};

export type OutputConfig = {
  metrics?: boolean;
  trades?: boolean;
  equityCurve?: boolean;
  riskReport?: boolean;
  loc: Loc;
};

// ============= Microstructure =============

export type MicrostructureDecl = {
  kind: 'MicrostructureDecl';
  name: Id;
  fields: DataField[];
  detect?: DetectBlock;
  quote?: QuoteBlock;
  hedging?: HedgingBlock;
  loc: Loc;
};

export type DetectBlock = {
  kind: 'DetectBlock';
  detections: Detection[];
  loc: Loc;
};

export type Detection = {
  name: Id;
  condition: Expr;
  loc: Loc;
};

export type QuoteBlock = {
  kind: 'QuoteBlock';
  quotes: QuoteDef[];
  loc: Loc;
};

export type QuoteDef = {
  side: 'bid' | 'ask';
  price: Expr;
  size: Expr;
  loc: Loc;
};

export type HedgingBlock = {
  kind: 'HedgingBlock';
  rules: HedgingRule[];
  loc: Loc;
};

export type HedgingRule = {
  condition: Expr;
  action: Expr;
  loc: Loc;
};

// ============= Imports =============

export type ImportDecl = {
  kind: 'ImportDecl';
  source: string;
  items?: ImportItem[];
  alias?: string;
  loc: Loc;
};

export type ImportItem = {
  name: string;
  alias?: string;
};

// ============= Expressions =============

export type Expr = 
  | Lit
  | IdExpr
  | BinaryExpr
  | UnaryExpr
  | CallExpr
  | MemberExpr
  | IndexExpr
  | ArrayLit
  | ObjectLit
  | ConditionalExpr
  | AssignExpr
  | UpdateExpr
  | AwaitExpr
  | ParenExpr
  | SliceExpr
  | ComprehensionExpr;

export type IdExpr = { kind: 'IdExpr'; id: Id };

export type Lit = {
  kind: 'Lit';
  value: number | string | boolean | null;
  raw: string;
  loc: Loc;
};

export type BinaryExpr = {
  kind: 'BinaryExpr';
  op: BinaryOp;
  left: Expr;
  right: Expr;
  loc: Loc;
};

export type UnaryExpr = {
  kind: 'UnaryExpr';
  op: UnaryOp;
  arg: Expr;
  loc: Loc;
};

export type CallExpr = {
  kind: 'CallExpr';
  callee: Expr;
  args: Expr[];
  loc: Loc;
};

export type MemberExpr = {
  kind: 'MemberExpr';
  object: Expr;
  property: Id;
  computed?: boolean;
  loc: Loc;
};

export type IndexExpr = {
  kind: 'IndexExpr';
  object: Expr;
  index: Expr;
  loc: Loc;
};

export type ArrayLit = {
  kind: 'ArrayLit';
  elements: Expr[];
  loc: Loc;
};

export type ObjectLit = {
  kind: 'ObjectLit';
  properties: Property[];
  loc: Loc;
};

export type Property = {
  key: Id | Lit;
  value: Expr;
  shorthand?: boolean;
  loc: Loc;
};

export type ConditionalExpr = {
  kind: 'ConditionalExpr';
  test: Expr;
  consequent: Expr;
  alternate: Expr;
  loc: Loc;
};

export type AssignExpr = {
  kind: 'AssignExpr';
  left: Expr;
  operator: AssignOp;
  right: Expr;
  loc: Loc;
};

export type UpdateExpr = {
  kind: 'UpdateExpr';
  operator: '++' | '--';
  argument: Expr;
  prefix: boolean;
  loc: Loc;
};

export type AwaitExpr = {
  kind: 'AwaitExpr';
  argument: Expr;
  loc: Loc;
};

export type ParenExpr = {
  kind: 'ParenExpr';
  expression: Expr;
  loc: Loc;
};

export type SliceExpr = {
  kind: 'SliceExpr';
  object: Expr;
  start?: Expr;
  end?: Expr;
  step?: Expr;
  loc: Loc;
};

export type ComprehensionExpr = {
  kind: 'ComprehensionExpr';
  element: Expr;
  loops: ComprehensionLoop[];
  filter?: Expr;
  loc: Loc;
};

export type ComprehensionLoop = {
  variable: Id;
  iterable: Expr;
};

// ============= Statements =============

export type Stmt = 
  | ExprStmt
  | VarDecl
  | Block
  | IfStmt
  | WhileStmt
  | ForStmt
  | ReturnStmt
  | BreakStmt
  | ContinueStmt
  | WhenStmt;

export type ExprStmt = {
  kind: 'ExprStmt';
  expression: Expr;
  loc: Loc;
};

export type VarDecl = {
  kind: 'VarDecl';
  declarations: VarDeclarator[];
  loc: Loc;
};

export type VarDeclarator = {
  id: Id;
  type?: TypeNode;
  init?: Expr;
  loc: Loc;
};

export type Block = {
  kind: 'Block';
  body: Stmt[];
  loc: Loc;
};

export type IfStmt = {
  kind: 'IfStmt';
  test: Expr;
  consequent: Stmt;
  alternate?: Stmt;
  loc: Loc;
};

export type WhileStmt = {
  kind: 'WhileStmt';
  test: Expr;
  body: Stmt;
  loc: Loc;
};

export type ForStmt = {
  kind: 'ForStmt';
  init?: VarDecl | Expr;
  test?: Expr;
  update?: Expr;
  body: Stmt;
  loc: Loc;
};

export type ReturnStmt = {
  kind: 'ReturnStmt';
  argument?: Expr;
  loc: Loc;
};

export type BreakStmt = {
  kind: 'BreakStmt';
  loc: Loc;
};

export type ContinueStmt = {
  kind: 'ContinueStmt';
  loc: Loc;
};

export type WhenStmt = {
  kind: 'WhenStmt';
  condition: Expr;
  body: Block;
  loc: Loc;
};

// ============= Types =============

export type TypeNode = 
  | PrimitiveType
  | ArrayType
  | MapType
  | RefType
  | FunctionType
  | UnionType
  | OptionalType;

export type PrimitiveType = {
  kind: 'PrimitiveType';
  name: 'int' | 'float' | 'string' | 'boolean' | 'datetime' | 'void';
};

export type ArrayType = {
  kind: 'ArrayType';
  elementType: TypeNode;
};

export type MapType = {
  kind: 'MapType';
  keyType: TypeNode;
  valueType: TypeNode;
};

export type RefType = {
  kind: 'RefType';
  name: Id;
  typeArgs?: TypeNode[];
};

export type FunctionType = {
  kind: 'FunctionType';
  params: TypeNode[];
  returnType: TypeNode;
};

export type UnionType = {
  kind: 'UnionType';
  types: TypeNode[];
};

export type OptionalType = {
  kind: 'OptionalType';
  type: TypeNode;
};

// ============= Operators =============

export type BinaryOp = 
  | '+' | '-' | '*' | '/' | '%' | '**'
  | '==' | '!=' | '<' | '<=' | '>' | '>='
  | '&&' | '||' | 'and' | 'or'
  | '&' | '|' | '^' | '<<' | '>>'
  | 'in' | 'not in';

export type UnaryOp = 
  | '-' | '+' | '!' | '~' | 'not' | 'typeof';

export type AssignOp = 
  | '=' | '+=' | '-=' | '*=' | '/=' | '%='
  | '&=' | '|=' | '^=' | '<<=' | '>>=';

// ============= Common =============

export type Param = {
  name: Id;
  type?: TypeNode;
  defaultValue?: Expr;
  loc: Loc;
};

export type Id = {
  name: string;
  loc: Loc;
};

export type Loc = {
  start: { line: number; column: number; offset: number };
  end: { line: number; column: number; offset: number };
  filename?: string;
};