import { createToken, Lexer, IToken } from 'chevrotain';

// Whitespace and comments
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

// Literals
export const NumberLiteral = createToken({ 
  name: 'NumberLiteral', 
  pattern: /\d+(\.\d+)?([eE][+-]?\d+)?/ 
});

export const StringLiteral = createToken({ 
  name: 'StringLiteral', 
  pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/ 
});

export const Identifier = createToken({ 
  name: 'Identifier', 
  pattern: /[A-Za-z_$][A-Za-z0-9_$]*/ 
});

// Keywords (must be defined before Identifier to take precedence)
const createKeyword = (name: string) => 
  createToken({ 
    name, 
    pattern: new RegExp(name), 
    longer_alt: Identifier 
  });

export const Import = createKeyword('import');
export const Export = createKeyword('export');
export const From = createKeyword('from');
export const As = createKeyword('as');
export const Store = createKeyword('store');
export const Component = createKeyword('component');
export const State = createKeyword('state');
export const Computed = createKeyword('computed');
export const Effect = createKeyword('effect');
export const Action = createKeyword('action');
export const View = createKeyword('view');
export const Let = createKeyword('let');
export const Const = createKeyword('const');
export const If = createKeyword('if');
export const Else = createKeyword('else');
export const For = createKeyword('for');
export const While = createKeyword('while');
export const Return = createKeyword('return');
export const True = createKeyword('true');
export const False = createKeyword('false');
export const Null = createKeyword('null');
export const Undefined = createKeyword('undefined');
export const Async = createKeyword('async');
export const Await = createKeyword('await');
export const Stream = createKeyword('stream');
export const AI = createKeyword('ai');

// Type keywords
export const TypeNumber = createKeyword('number');
export const TypeString = createKeyword('string');
export const TypeBoolean = createKeyword('boolean');
export const TypeVoid = createKeyword('void');
export const TypeAny = createKeyword('any');
export const TypeNever = createKeyword('never');

// Operators
export const Arrow = createToken({ name: 'Arrow', pattern: /=>/ });
export const FatArrow = createToken({ name: 'FatArrow', pattern: /->/ });
export const Ellipsis = createToken({ name: 'Ellipsis', pattern: /\.\.\./ });
export const Dot = createToken({ name: 'Dot', pattern: /\./ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });
export const Question = createToken({ name: 'Question', pattern: /\?/ });
export const Bang = createToken({ name: 'Bang', pattern: /!/ });

// Assignment operators
export const PlusAssign = createToken({ name: 'PlusAssign', pattern: /\+=/ });
export const MinusAssign = createToken({ name: 'MinusAssign', pattern: /-=/ });
export const MultiplyAssign = createToken({ name: 'MultiplyAssign', pattern: /\*=/ });
export const DivideAssign = createToken({ name: 'DivideAssign', pattern: /\/=/ });
export const Assign = createToken({ name: 'Assign', pattern: /=/ });

// Comparison operators
export const StrictEqual = createToken({ name: 'StrictEqual', pattern: /===/ });
export const StrictNotEqual = createToken({ name: 'StrictNotEqual', pattern: /!==/ });
export const Equal = createToken({ name: 'Equal', pattern: /==/ });
export const NotEqual = createToken({ name: 'NotEqual', pattern: /!=/ });
export const LessThanOrEqual = createToken({ name: 'LessThanOrEqual', pattern: /<=/ });
export const GreaterThanOrEqual = createToken({ name: 'GreaterThanOrEqual', pattern: />=/ });
export const LessThan = createToken({ name: 'LessThan', pattern: /</ });
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ });

// Logical operators
export const LogicalAnd = createToken({ name: 'LogicalAnd', pattern: /&&/ });
export const LogicalOr = createToken({ name: 'LogicalOr', pattern: /\|\|/ });
export const NullishCoalescing = createToken({ name: 'NullishCoalescing', pattern: /\?\?/ });

// Arithmetic operators
export const Plus = createToken({ name: 'Plus', pattern: /\+/ });
export const Minus = createToken({ name: 'Minus', pattern: /-/ });
export const Multiply = createToken({ name: 'Multiply', pattern: /\*/ });
export const Divide = createToken({ name: 'Divide', pattern: /\// });
export const Modulo = createToken({ name: 'Modulo', pattern: /%/ });
export const Power = createToken({ name: 'Power', pattern: /\*\*/ });

// Bitwise operators
export const BitwiseAnd = createToken({ name: 'BitwiseAnd', pattern: /&/ });
export const BitwiseOr = createToken({ name: 'BitwiseOr', pattern: /\|/ });
export const BitwiseXor = createToken({ name: 'BitwiseXor', pattern: /\^/ });
export const BitwiseNot = createToken({ name: 'BitwiseNot', pattern: /~/ });
export const LeftShift = createToken({ name: 'LeftShift', pattern: /<</ });
export const RightShift = createToken({ name: 'RightShift', pattern: />>/ });
export const UnsignedRightShift = createToken({ name: 'UnsignedRightShift', pattern: />>>/ });

// Brackets and braces
export const LeftParen = createToken({ name: 'LeftParen', pattern: /\(/ });
export const RightParen = createToken({ name: 'RightParen', pattern: /\)/ });
export const LeftBrace = createToken({ name: 'LeftBrace', pattern: /\{/ });
export const RightBrace = createToken({ name: 'RightBrace', pattern: /\}/ });
export const LeftBracket = createToken({ name: 'LeftBracket', pattern: /\[/ });
export const RightBracket = createToken({ name: 'RightBracket', pattern: /\]/ });

// JSX specific tokens
export const JSXText = createToken({
  name: 'JSXText',
  pattern: /[^<>{}\s]+/
});

// Token order matters! More specific patterns must come before more general ones
export const allTokens = [
  // Comments and whitespace
  WhiteSpace,
  LineComment,
  BlockComment,
  
  // Multi-character operators (must come before single-character versions)
  Arrow,
  FatArrow,
  Ellipsis,
  StrictEqual,
  StrictNotEqual,
  Equal,
  NotEqual,
  LessThanOrEqual,
  GreaterThanOrEqual,
  LogicalAnd,
  LogicalOr,
  NullishCoalescing,
  PlusAssign,
  MinusAssign,
  MultiplyAssign,
  DivideAssign,
  Power,
  LeftShift,
  UnsignedRightShift,
  RightShift,
  
  // Keywords (must come before Identifier)
  Import,
  Export,
  From,
  As,
  Store,
  Component,
  State,
  Computed,
  Effect,
  Action,
  View,
  Let,
  Const,
  If,
  Else,
  For,
  While,
  Return,
  True,
  False,
  Null,
  Undefined,
  Async,
  Await,
  Stream,
  AI,
  TypeNumber,
  TypeString,
  TypeBoolean,
  TypeVoid,
  TypeAny,
  TypeNever,
  
  // Literals
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
  
  // Brackets
  LeftParen,
  RightParen,
  LeftBrace,
  RightBrace,
  LeftBracket,
  RightBracket
];

export const CroweLexer = new Lexer(allTokens);