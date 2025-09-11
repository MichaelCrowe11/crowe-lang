import { createToken, Lexer, IToken } from 'chevrotain';

// ============= Whitespace & Comments =============
export const WhiteSpace = createToken({ 
  name: 'WhiteSpace', 
  pattern: /[ \t\r\n]+/, 
  group: Lexer.SKIPPED 
});

export const LineComment = createToken({
  name: 'LineComment',
  pattern: /\/\/[^\n\r]*/,
  group: Lexer.SKIPPED
});

export const BlockComment = createToken({
  name: 'BlockComment',
  pattern: /\/\*([^*]|\*(?!\/))*\*\//,
  group: Lexer.SKIPPED
});

// ============= Literals =============
export const NumberLiteral = createToken({ 
  name: 'NumberLiteral', 
  pattern: /\d+(\.\d+)?([eE][+-]?\d+)?/ 
});

export const StringLiteral = createToken({ 
  name: 'StringLiteral', 
  pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ 
});

export const DateLiteral = createToken({
  name: 'DateLiteral',
  pattern: /\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?/
});

export const Identifier = createToken({ 
  name: 'Identifier', 
  pattern: /[A-Za-z_][A-Za-z0-9_]*/ 
});

// ============= Trading Keywords =============
const createKeyword = (name: string) => 
  createToken({ 
    name, 
    pattern: new RegExp(name), 
    longer_alt: Identifier 
  });

// Strategy keywords
export const Strategy = createKeyword('strategy');
export const Indicator = createKeyword('indicator');
export const Signal = createKeyword('signal');
export const Rule = createKeyword('rule');
export const When = createKeyword('when');
export const Params = createKeyword('params');
export const Indicators = createKeyword('indicators');
export const Signals = createKeyword('signals');
export const Rules = createKeyword('rules');
export const Risk = createKeyword('risk');

// Trading actions
export const Buy = createKeyword('buy');
export const Sell = createKeyword('sell');
export const Short = createKeyword('short');
export const Cover = createKeyword('cover');
export const Close = createKeyword('close');
export const Cancel = createKeyword('cancel');

// Order types
export const Order = createKeyword('order');
export const Market = createKeyword('market');
export const Limit = createKeyword('limit');
export const Stop = createKeyword('stop');
export const StopLimit = createKeyword('stop_limit');
export const MarketOrder = createKeyword('MarketOrder');
export const LimitOrder = createKeyword('LimitOrder');
export const StopOrder = createKeyword('StopOrder');

// Data types
export const Data = createKeyword('data');
export const Bar = createKeyword('Bar');
export const Tick = createKeyword('Tick');
export const OrderBook = createKeyword('OrderBook');
export const Level = createKeyword('Level');
export const Position = createKeyword('Position');

// Portfolio & Risk
export const Portfolio = createKeyword('portfolio');
export const Backtest = createKeyword('backtest');
export const Metrics = createKeyword('metrics');
export const Constraints = createKeyword('constraints');
export const Costs = createKeyword('costs');
export const Output = createKeyword('output');

// Events
export const Event = createKeyword('event');
export const On = createKeyword('on');
export const OnBar = createKeyword('on_bar');
export const OnTick = createKeyword('on_tick');
export const OnBook = createKeyword('on_book');
export const OnFill = createKeyword('on_fill');
export const OnReject = createKeyword('on_reject');

// Microstructure
export const Microstructure = createKeyword('microstructure');
export const Detect = createKeyword('detect');
export const Quote = createKeyword('quote');
export const Hedging = createKeyword('hedging');

// Types
export const Int = createKeyword('int');
export const Float = createKeyword('float');
export const String = createKeyword('string');
export const Boolean = createKeyword('boolean');
export const Datetime = createKeyword('datetime');
export const Void = createKeyword('void');
export const Array = createKeyword('Array');
export const Map = createKeyword('Map');
export const Enum = createKeyword('enum');

// Enums
export const Side = createKeyword('Side');
export const TimeInForce = createKeyword('TimeInForce');
export const OrderStatus = createKeyword('OrderStatus');
export const Frequency = createKeyword('Frequency');

// Time frequencies
export const Minute = createKeyword('MINUTE');
export const Hour = createKeyword('HOUR');
export const Day = createKeyword('DAY');
export const Week = createKeyword('WEEK');

// Standard library functions
export const SMA = createKeyword('SMA');
export const EMA = createKeyword('EMA');
export const RSI = createKeyword('RSI');
export const MACD = createKeyword('MACD');
export const BollingerBands = createKeyword('BollingerBands');
export const VWAP = createKeyword('VWAP');
export const StdDev = createKeyword('StdDev');
export const Sum = createKeyword('sum');
export const Avg = createKeyword('avg');
export const Min = createKeyword('min');
export const Max = createKeyword('max');
export const Abs = createKeyword('abs');
export const Log = createKeyword('log');
export const Sqrt = createKeyword('sqrt');

// Control flow
export const If = createKeyword('if');
export const Else = createKeyword('else');
export const ElseIf = createKeyword('elif');
export const For = createKeyword('for');
export const While = createKeyword('while');
export const In = createKeyword('in');
export const Break = createKeyword('break');
export const Continue = createKeyword('continue');
export const Return = createKeyword('return');

// Boolean literals
export const True = createKeyword('true');
export const False = createKeyword('false');
export const Null = createKeyword('null');

// Logical operators
export const And = createKeyword('and');
export const Or = createKeyword('or');
export const Not = createKeyword('not');

// Import/Export
export const Import = createKeyword('import');
export const From = createKeyword('from');
export const As = createKeyword('as');
export const Export = createKeyword('export');

// ============= Operators =============
export const Arrow = createToken({ name: 'Arrow', pattern: /->/ });
export const FatArrow = createToken({ name: 'FatArrow', pattern: /=>/ });
export const Ellipsis = createToken({ name: 'Ellipsis', pattern: /\.\.\./ });
export const DotDot = createToken({ name: 'DotDot', pattern: /\.\./ });
export const Dot = createToken({ name: 'Dot', pattern: /\./ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });
export const Question = createToken({ name: 'Question', pattern: /\?/ });
export const Bang = createToken({ name: 'Bang', pattern: /!/ });
export const At = createToken({ name: 'At', pattern: /@/ });

// Assignment operators
export const PlusAssign = createToken({ name: 'PlusAssign', pattern: /\+=/ });
export const MinusAssign = createToken({ name: 'MinusAssign', pattern: /-=/ });
export const MultiplyAssign = createToken({ name: 'MultiplyAssign', pattern: /\*=/ });
export const DivideAssign = createToken({ name: 'DivideAssign', pattern: /\/=/ });
export const ModuloAssign = createToken({ name: 'ModuloAssign', pattern: /%=/ });
export const Assign = createToken({ name: 'Assign', pattern: /=/ });

// Comparison operators
export const Equal = createToken({ name: 'Equal', pattern: /==/ });
export const NotEqual = createToken({ name: 'NotEqual', pattern: /!=/ });
export const LessThanOrEqual = createToken({ name: 'LessThanOrEqual', pattern: /<=/ });
export const GreaterThanOrEqual = createToken({ name: 'GreaterThanOrEqual', pattern: />=/ });
export const LessThan = createToken({ name: 'LessThan', pattern: /</ });
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ });

// Logical operators (symbolic)
export const LogicalAnd = createToken({ name: 'LogicalAnd', pattern: /&&/ });
export const LogicalOr = createToken({ name: 'LogicalOr', pattern: /\|\|/ });

// Arithmetic operators
export const Power = createToken({ name: 'Power', pattern: /\*\*/ });
export const Plus = createToken({ name: 'Plus', pattern: /\+/ });
export const Minus = createToken({ name: 'Minus', pattern: /-/ });
export const Multiply = createToken({ name: 'Multiply', pattern: /\*/ });
export const Divide = createToken({ name: 'Divide', pattern: /\// });
export const Modulo = createToken({ name: 'Modulo', pattern: /%/ });

// Bitwise operators
export const BitwiseAnd = createToken({ name: 'BitwiseAnd', pattern: /&/ });
export const BitwiseOr = createToken({ name: 'BitwiseOr', pattern: /\|/ });
export const BitwiseXor = createToken({ name: 'BitwiseXor', pattern: /\^/ });
export const BitwiseNot = createToken({ name: 'BitwiseNot', pattern: /~/ });
export const LeftShift = createToken({ name: 'LeftShift', pattern: /<</ });
export const RightShift = createToken({ name: 'RightShift', pattern: />>/ });

// Brackets and braces
export const LeftParen = createToken({ name: 'LeftParen', pattern: /\(/ });
export const RightParen = createToken({ name: 'RightParen', pattern: /\)/ });
export const LeftBrace = createToken({ name: 'LeftBrace', pattern: /\{/ });
export const RightBrace = createToken({ name: 'RightBrace', pattern: /\}/ });
export const LeftBracket = createToken({ name: 'LeftBracket', pattern: /\[/ });
export const RightBracket = createToken({ name: 'RightBracket', pattern: /\]/ });

// Token order matters! More specific patterns must come before more general ones
export const allTokens = [
  // Comments and whitespace
  WhiteSpace,
  LineComment,
  BlockComment,
  
  // Multi-character operators (must come before single-character versions)
  FatArrow,
  Arrow,
  Ellipsis,
  DotDot,
  Equal,
  NotEqual,
  LessThanOrEqual,
  GreaterThanOrEqual,
  LogicalAnd,
  LogicalOr,
  PlusAssign,
  MinusAssign,
  MultiplyAssign,
  DivideAssign,
  ModuloAssign,
  Power,
  LeftShift,
  RightShift,
  
  // Keywords (must come before Identifier)
  // Strategy keywords
  Strategy,
  Indicator,
  Signal,
  Rule,
  When,
  Params,
  Indicators,
  Signals,
  Rules,
  Risk,
  
  // Trading actions
  Buy,
  Sell,
  Short,
  Cover,
  Close,
  Cancel,
  
  // Order types
  Order,
  Market,
  Limit,
  Stop,
  StopLimit,
  MarketOrder,
  LimitOrder,
  StopOrder,
  
  // Data types
  Data,
  Bar,
  Tick,
  OrderBook,
  Level,
  Position,
  
  // Portfolio & Risk
  Portfolio,
  Backtest,
  Metrics,
  Constraints,
  Costs,
  Output,
  
  // Events
  Event,
  On,
  OnBar,
  OnTick,
  OnBook,
  OnFill,
  OnReject,
  
  // Microstructure
  Microstructure,
  Detect,
  Quote,
  Hedging,
  
  // Types
  Int,
  Float,
  String,
  Boolean,
  Datetime,
  Void,
  Array,
  Map,
  Enum,
  
  // Enums
  Side,
  TimeInForce,
  OrderStatus,
  Frequency,
  
  // Time frequencies
  Minute,
  Hour,
  Day,
  Week,
  
  // Standard library functions
  SMA,
  EMA,
  RSI,
  MACD,
  BollingerBands,
  VWAP,
  StdDev,
  Sum,
  Avg,
  Min,
  Max,
  Abs,
  Log,
  Sqrt,
  
  // Control flow
  If,
  Else,
  ElseIf,
  For,
  While,
  In,
  Break,
  Continue,
  Return,
  
  // Boolean literals
  True,
  False,
  Null,
  
  // Logical operators
  And,
  Or,
  Not,
  
  // Import/Export
  Import,
  From,
  As,
  Export,
  
  // Literals (must come after keywords)
  DateLiteral,
  NumberLiteral,
  StringLiteral,
  Identifier,
  
  // Single-character operators
  LessThan,
  GreaterThan,
  Assign,
  Plus,
  Minus,
  Multiply,
  Divide,
  Modulo,
  BitwiseAnd,
  BitwiseOr,
  BitwiseXor,
  BitwiseNot,
  Bang,
  
  // Punctuation
  Dot,
  Comma,
  Colon,
  Semicolon,
  Question,
  At,
  
  // Brackets
  LeftParen,
  RightParen,
  LeftBrace,
  RightBrace,
  LeftBracket,
  RightBracket
];

export const CroweLangLexer = new Lexer(allTokens);