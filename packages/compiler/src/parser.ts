import { CstParser, IToken } from 'chevrotain';
import * as tokens from './lexer';

export class CroweParser extends CstParser {
  constructor() {
    super(tokens.allTokens, {
      maxLookahead: 4,
      recoveryEnabled: true
    });
    this.performSelfAnalysis();
  }

  // Program
  public program = this.RULE('program', () => {
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.importDecl) },
        { ALT: () => this.SUBRULE(this.storeDecl) },
        { ALT: () => this.SUBRULE(this.componentDecl) }
      ]);
    });
  });

  // Import declaration
  private importDecl = this.RULE('importDecl', () => {
    this.CONSUME(tokens.Import);
    const source = this.CONSUME(tokens.StringLiteral);
    let alias;
    this.OPTION(() => {
      this.CONSUME(tokens.As);
      alias = this.CONSUME(tokens.Identifier);
    });
    this.CONSUME(tokens.Semicolon);
  });

  // Store declaration
  private storeDecl = this.RULE('storeDecl', () => {
    this.CONSUME(tokens.Store);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.storeStateField) },
        { ALT: () => this.SUBRULE(this.storeActionField) }
      ]);
    });
    this.CONSUME(tokens.RightBrace);
  });

  private storeStateField = this.RULE('storeStateField', () => {
    this.CONSUME(tokens.State);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Colon);
    this.SUBRULE(this.typeExpr);
    this.OPTION(() => {
      this.CONSUME(tokens.Assign);
      this.SUBRULE(this.expression);
    });
    this.CONSUME(tokens.Semicolon);
  });

  private storeActionField = this.RULE('storeActionField', () => {
    this.CONSUME(tokens.Action);
    this.OPTION(() => this.CONSUME(tokens.Async));
    this.CONSUME(tokens.Identifier);
    this.SUBRULE(this.paramList);
    this.SUBRULE(this.block);
  });

  // Component declaration
  private componentDecl = this.RULE('componentDecl', () => {
    this.CONSUME(tokens.Component);
    const name = this.CONSUME(tokens.Identifier);
    this.OPTION(() => this.SUBRULE(this.typeParams));
    this.OPTION2(() => this.SUBRULE(this.paramList));
    this.SUBRULE(this.block);
  });

  // Type parameters
  private typeParams = this.RULE('typeParams', () => {
    this.CONSUME(tokens.LessThan);
    this.CONSUME(tokens.Identifier);
    this.MANY(() => {
      this.CONSUME(tokens.Comma);
      this.CONSUME2(tokens.Identifier);
    });
    this.CONSUME(tokens.GreaterThan);
  });

  // Parameter list
  private paramList = this.RULE('paramList', () => {
    this.CONSUME(tokens.LeftParen);
    this.OPTION(() => {
      this.SUBRULE(this.param);
      this.MANY(() => {
        this.CONSUME(tokens.Comma);
        this.SUBRULE2(this.param);
      });
    });
    this.CONSUME(tokens.RightParen);
  });

  private param = this.RULE('param', () => {
    this.CONSUME(tokens.Identifier);
    this.OPTION(() => this.CONSUME(tokens.Question));
    this.CONSUME(tokens.Colon);
    this.SUBRULE(this.typeExpr);
  });

  // Block
  private block = this.RULE('block', () => {
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.statement));
    this.CONSUME(tokens.RightBrace);
  });

  // Statements
  private statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.varDecl) },
      { ALT: () => this.SUBRULE(this.stateDecl) },
      { ALT: () => this.SUBRULE(this.computedDecl) },
      { ALT: () => this.SUBRULE(this.effectDecl) },
      { ALT: () => this.SUBRULE(this.actionDecl) },
      { ALT: () => this.SUBRULE(this.viewDecl) },
      { ALT: () => this.SUBRULE(this.ifStatement) },
      { ALT: () => this.SUBRULE(this.returnStatement) },
      { ALT: () => this.SUBRULE(this.expressionStatement) }
    ]);
  });

  private varDecl = this.RULE('varDecl', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.Let) },
      { ALT: () => this.CONSUME(tokens.Const) }
    ]);
    this.CONSUME(tokens.Identifier);
    this.OPTION(() => {
      this.CONSUME(tokens.Colon);
      this.SUBRULE(this.typeExpr);
    });
    this.OPTION2(() => {
      this.CONSUME(tokens.Assign);
      this.SUBRULE(this.expression);
    });
    this.CONSUME(tokens.Semicolon);
  });

  private stateDecl = this.RULE('stateDecl', () => {
    this.CONSUME(tokens.State);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Colon);
    this.SUBRULE(this.typeExpr);
    this.OPTION(() => {
      this.CONSUME(tokens.Assign);
      this.SUBRULE(this.expression);
    });
    this.CONSUME(tokens.Semicolon);
  });

  private computedDecl = this.RULE('computedDecl', () => {
    this.CONSUME(tokens.Computed);
    this.CONSUME(tokens.Identifier);
    this.SUBRULE(this.paramList);
    this.OPTION(() => {
      this.CONSUME(tokens.Colon);
      this.SUBRULE(this.typeExpr);
    });
    this.CONSUME(tokens.Arrow);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  private effectDecl = this.RULE('effectDecl', () => {
    this.CONSUME(tokens.Effect);
    this.CONSUME(tokens.LeftParen);
    this.OPTION(() => this.SUBRULE(this.expression));
    this.CONSUME(tokens.RightParen);
    this.SUBRULE(this.block);
  });

  private actionDecl = this.RULE('actionDecl', () => {
    this.CONSUME(tokens.Action);
    this.OPTION(() => this.CONSUME(tokens.Async));
    this.CONSUME(tokens.Identifier);
    this.SUBRULE(this.paramList);
    this.SUBRULE(this.block);
  });

  private viewDecl = this.RULE('viewDecl', () => {
    this.CONSUME(tokens.View);
    this.CONSUME(tokens.Arrow);
    this.SUBRULE(this.jsxElement);
  });

  private ifStatement = this.RULE('ifStatement', () => {
    this.CONSUME(tokens.If);
    this.CONSUME(tokens.LeftParen);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.RightParen);
    this.SUBRULE(this.block);
    this.OPTION(() => {
      this.CONSUME(tokens.Else);
      this.OR([
        { ALT: () => this.SUBRULE2(this.ifStatement) },
        { ALT: () => this.SUBRULE2(this.block) }
      ]);
    });
  });

  private returnStatement = this.RULE('returnStatement', () => {
    this.CONSUME(tokens.Return);
    this.OPTION(() => this.SUBRULE(this.expression));
    this.CONSUME(tokens.Semicolon);
  });

  private expressionStatement = this.RULE('expressionStatement', () => {
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  // Expressions
  private expression = this.RULE('expression', () => {
    this.SUBRULE(this.assignmentExpression);
  });

  private assignmentExpression = this.RULE('assignmentExpression', () => {
    this.SUBRULE(this.logicalOrExpression);
    this.OPTION(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.Assign) },
        { ALT: () => this.CONSUME(tokens.PlusAssign) },
        { ALT: () => this.CONSUME(tokens.MinusAssign) },
        { ALT: () => this.CONSUME(tokens.MultiplyAssign) },
        { ALT: () => this.CONSUME(tokens.DivideAssign) }
      ]);
      this.SUBRULE2(this.assignmentExpression);
    });
  });

  private logicalOrExpression = this.RULE('logicalOrExpression', () => {
    this.SUBRULE(this.logicalAndExpression);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.LogicalOr) },
        { ALT: () => this.CONSUME(tokens.NullishCoalescing) }
      ]);
      this.SUBRULE2(this.logicalAndExpression);
    });
  });

  private logicalAndExpression = this.RULE('logicalAndExpression', () => {
    this.SUBRULE(this.equalityExpression);
    this.MANY(() => {
      this.CONSUME(tokens.LogicalAnd);
      this.SUBRULE2(this.equalityExpression);
    });
  });

  private equalityExpression = this.RULE('equalityExpression', () => {
    this.SUBRULE(this.relationalExpression);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.StrictEqual) },
        { ALT: () => this.CONSUME(tokens.StrictNotEqual) },
        { ALT: () => this.CONSUME(tokens.Equal) },
        { ALT: () => this.CONSUME(tokens.NotEqual) }
      ]);
      this.SUBRULE2(this.relationalExpression);
    });
  });

  private relationalExpression = this.RULE('relationalExpression', () => {
    this.SUBRULE(this.additiveExpression);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.LessThan) },
        { ALT: () => this.CONSUME(tokens.LessThanOrEqual) },
        { ALT: () => this.CONSUME(tokens.GreaterThan) },
        { ALT: () => this.CONSUME(tokens.GreaterThanOrEqual) }
      ]);
      this.SUBRULE2(this.additiveExpression);
    });
  });

  private additiveExpression = this.RULE('additiveExpression', () => {
    this.SUBRULE(this.multiplicativeExpression);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.Plus) },
        { ALT: () => this.CONSUME(tokens.Minus) }
      ]);
      this.SUBRULE2(this.multiplicativeExpression);
    });
  });

  private multiplicativeExpression = this.RULE('multiplicativeExpression', () => {
    this.SUBRULE(this.unaryExpression);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.Multiply) },
        { ALT: () => this.CONSUME(tokens.Divide) },
        { ALT: () => this.CONSUME(tokens.Modulo) }
      ]);
      this.SUBRULE2(this.unaryExpression);
    });
  });

  private unaryExpression = this.RULE('unaryExpression', () => {
    this.OR([
      {
        ALT: () => {
          this.OR2([
            { ALT: () => this.CONSUME(tokens.Bang) },
            { ALT: () => this.CONSUME(tokens.Minus) },
            { ALT: () => this.CONSUME(tokens.Plus) },
            { ALT: () => this.CONSUME(tokens.BitwiseNot) }
          ]);
          this.SUBRULE(this.unaryExpression);
        }
      },
      {
        ALT: () => {
          this.CONSUME(tokens.Await);
          this.SUBRULE2(this.unaryExpression);
        }
      },
      { ALT: () => this.SUBRULE(this.postfixExpression) }
    ]);
  });

  private postfixExpression = this.RULE('postfixExpression', () => {
    this.SUBRULE(this.primaryExpression);
    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(tokens.Dot);
            this.CONSUME(tokens.Identifier);
          }
        },
        {
          ALT: () => {
            this.CONSUME(tokens.LeftBracket);
            this.SUBRULE(this.expression);
            this.CONSUME(tokens.RightBracket);
          }
        },
        {
          ALT: () => {
            this.CONSUME(tokens.LeftParen);
            this.OPTION(() => {
              this.SUBRULE2(this.expression);
              this.MANY2(() => {
                this.CONSUME(tokens.Comma);
                this.SUBRULE3(this.expression);
              });
            });
            this.CONSUME(tokens.RightParen);
          }
        }
      ]);
    });
  });

  private primaryExpression = this.RULE('primaryExpression', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.NumberLiteral) },
      { ALT: () => this.CONSUME(tokens.StringLiteral) },
      { ALT: () => this.CONSUME(tokens.True) },
      { ALT: () => this.CONSUME(tokens.False) },
      { ALT: () => this.CONSUME(tokens.Null) },
      { ALT: () => this.CONSUME(tokens.Undefined) },
      { ALT: () => this.CONSUME(tokens.Identifier) },
      { ALT: () => this.SUBRULE(this.arrayLiteral) },
      { ALT: () => this.SUBRULE(this.objectLiteral) },
      {
        ALT: () => {
          this.CONSUME(tokens.LeftParen);
          this.SUBRULE(this.expression);
          this.CONSUME(tokens.RightParen);
        }
      }
    ]);
  });

  private arrayLiteral = this.RULE('arrayLiteral', () => {
    this.CONSUME(tokens.LeftBracket);
    this.OPTION(() => {
      this.SUBRULE(this.expression);
      this.MANY(() => {
        this.CONSUME(tokens.Comma);
        this.SUBRULE2(this.expression);
      });
    });
    this.CONSUME(tokens.RightBracket);
  });

  private objectLiteral = this.RULE('objectLiteral', () => {
    this.CONSUME(tokens.LeftBrace);
    this.OPTION(() => {
      this.SUBRULE(this.objectProperty);
      this.MANY(() => {
        this.CONSUME(tokens.Comma);
        this.SUBRULE2(this.objectProperty);
      });
    });
    this.CONSUME(tokens.RightBrace);
  });

  private objectProperty = this.RULE('objectProperty', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(tokens.Identifier);
          this.CONSUME(tokens.Colon);
          this.SUBRULE(this.expression);
        }
      },
      {
        ALT: () => {
          this.CONSUME(tokens.StringLiteral);
          this.CONSUME2(tokens.Colon);
          this.SUBRULE2(this.expression);
        }
      },
      {
        ALT: () => {
          this.CONSUME(tokens.LeftBracket);
          this.SUBRULE3(this.expression);
          this.CONSUME(tokens.RightBracket);
          this.CONSUME3(tokens.Colon);
          this.SUBRULE4(this.expression);
        }
      },
      {
        ALT: () => {
          this.CONSUME2(tokens.Identifier);
        }
      }
    ]);
  });

  // JSX
  private jsxElement = this.RULE('jsxElement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.jsxSelfClosing) },
      { ALT: () => this.SUBRULE(this.jsxNormalElement) },
      { ALT: () => this.SUBRULE(this.jsxFragment) }
    ]);
  });

  private jsxSelfClosing = this.RULE('jsxSelfClosing', () => {
    this.CONSUME(tokens.LessThan);
    this.CONSUME(tokens.Identifier);
    this.MANY(() => this.SUBRULE(this.jsxAttribute));
    this.CONSUME(tokens.Divide);
    this.CONSUME(tokens.GreaterThan);
  });

  private jsxNormalElement = this.RULE('jsxNormalElement', () => {
    this.CONSUME(tokens.LessThan);
    const tagName = this.CONSUME(tokens.Identifier);
    this.MANY(() => this.SUBRULE(this.jsxAttribute));
    this.CONSUME(tokens.GreaterThan);
    this.MANY2(() => this.SUBRULE(this.jsxChild));
    this.CONSUME2(tokens.LessThan);
    this.CONSUME(tokens.Divide);
    this.CONSUME2(tokens.Identifier);
    this.CONSUME2(tokens.GreaterThan);
  });

  private jsxFragment = this.RULE('jsxFragment', () => {
    this.CONSUME(tokens.LessThan);
    this.CONSUME(tokens.GreaterThan);
    this.MANY(() => this.SUBRULE(this.jsxChild));
    this.CONSUME2(tokens.LessThan);
    this.CONSUME(tokens.Divide);
    this.CONSUME2(tokens.GreaterThan);
  });

  private jsxAttribute = this.RULE('jsxAttribute', () => {
    this.CONSUME(tokens.Identifier);
    this.OPTION(() => {
      this.CONSUME(tokens.Assign);
      this.OR([
        { ALT: () => this.CONSUME(tokens.StringLiteral) },
        {
          ALT: () => {
            this.CONSUME(tokens.LeftBrace);
            this.SUBRULE(this.expression);
            this.CONSUME(tokens.RightBrace);
          }
        }
      ]);
    });
  });

  private jsxChild = this.RULE('jsxChild', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.jsxElement) },
      {
        ALT: () => {
          this.CONSUME(tokens.LeftBrace);
          this.SUBRULE(this.expression);
          this.CONSUME(tokens.RightBrace);
        }
      }
      // JSXText needs special handling
    ]);
  });

  // Types
  private typeExpr = this.RULE('typeExpr', () => {
    this.SUBRULE(this.typeUnion);
  });

  private typeUnion = this.RULE('typeUnion', () => {
    this.SUBRULE(this.typeIntersection);
    this.MANY(() => {
      this.CONSUME(tokens.BitwiseOr);
      this.SUBRULE2(this.typeIntersection);
    });
  });

  private typeIntersection = this.RULE('typeIntersection', () => {
    this.SUBRULE(this.typePostfix);
    this.MANY(() => {
      this.CONSUME(tokens.BitwiseAnd);
      this.SUBRULE2(this.typePostfix);
    });
  });

  private typePostfix = this.RULE('typePostfix', () => {
    this.SUBRULE(this.typePrimary);
    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(tokens.LeftBracket);
            this.CONSUME(tokens.RightBracket);
          }
        },
        {
          ALT: () => {
            this.CONSUME(tokens.Question);
          }
        }
      ]);
    });
  });

  private typePrimary = this.RULE('typePrimary', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.TypeNumber) },
      { ALT: () => this.CONSUME(tokens.TypeString) },
      { ALT: () => this.CONSUME(tokens.TypeBoolean) },
      { ALT: () => this.CONSUME(tokens.TypeVoid) },
      { ALT: () => this.CONSUME(tokens.TypeAny) },
      { ALT: () => this.CONSUME(tokens.TypeNever) },
      {
        ALT: () => {
          this.CONSUME(tokens.Identifier);
          this.OPTION(() => {
            this.CONSUME(tokens.LessThan);
            this.SUBRULE(this.typeExpr);
            this.MANY(() => {
              this.CONSUME(tokens.Comma);
              this.SUBRULE2(this.typeExpr);
            });
            this.CONSUME(tokens.GreaterThan);
          });
        }
      },
      {
        ALT: () => {
          this.CONSUME(tokens.LeftBrace);
          this.OPTION2(() => {
            this.SUBRULE(this.typeField);
            this.MANY2(() => {
              this.OR2([
                { ALT: () => this.CONSUME(tokens.Comma) },
                { ALT: () => this.CONSUME(tokens.Semicolon) }
              ]);
              this.SUBRULE2(this.typeField);
            });
          });
          this.CONSUME(tokens.RightBrace);
        }
      },
      {
        ALT: () => {
          this.CONSUME(tokens.LeftParen);
          this.SUBRULE3(this.typeExpr);
          this.CONSUME(tokens.RightParen);
        }
      }
    ]);
  });

  private typeField = this.RULE('typeField', () => {
    this.CONSUME(tokens.Identifier);
    this.OPTION(() => this.CONSUME(tokens.Question));
    this.CONSUME(tokens.Colon);
    this.SUBRULE(this.typeExpr);
  });
}

export const croweParser = new CroweParser();