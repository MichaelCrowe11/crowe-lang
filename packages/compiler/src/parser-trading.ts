import { CstParser, IToken } from 'chevrotain';
import * as tokens from './lexer-trading';

export class CroweLangParser extends CstParser {
  constructor() {
    super(tokens.allTokens, {
      maxLookahead: 4,
      recoveryEnabled: true
    });
    this.performSelfAnalysis();
  }

  // ============= Program =============
  public program = this.RULE('program', () => {
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.importDecl) },
        { ALT: () => this.SUBRULE(this.strategyDecl) },
        { ALT: () => this.SUBRULE(this.indicatorDecl) },
        { ALT: () => this.SUBRULE(this.dataDecl) },
        { ALT: () => this.SUBRULE(this.orderDecl) },
        { ALT: () => this.SUBRULE(this.eventDecl) },
        { ALT: () => this.SUBRULE(this.portfolioDecl) },
        { ALT: () => this.SUBRULE(this.backtestDecl) },
        { ALT: () => this.SUBRULE(this.microstructureDecl) }
      ]);
    });
  });

  // ============= Import Declaration =============
  private importDecl = this.RULE('importDecl', () => {
    this.CONSUME(tokens.Import);
    this.OR([
      {
        ALT: () => {
          this.CONSUME(tokens.LeftBrace);
          this.CONSUME(tokens.Identifier);
          this.MANY(() => {
            this.CONSUME(tokens.Comma);
            this.CONSUME2(tokens.Identifier);
          });
          this.CONSUME(tokens.RightBrace);
          this.CONSUME(tokens.From);
          this.CONSUME(tokens.StringLiteral);
        }
      },
      {
        ALT: () => {
          this.CONSUME3(tokens.Identifier);
          this.CONSUME2(tokens.From);
          this.CONSUME2(tokens.StringLiteral);
        }
      },
      {
        ALT: () => {
          this.CONSUME3(tokens.StringLiteral);
          this.OPTION(() => {
            this.CONSUME(tokens.As);
            this.CONSUME4(tokens.Identifier);
          });
        }
      }
    ]);
    this.CONSUME(tokens.Semicolon);
  });

  // ============= Strategy Declaration =============
  private strategyDecl = this.RULE('strategyDecl', () => {
    this.CONSUME(tokens.Strategy);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.paramsBlock) },
        { ALT: () => this.SUBRULE(this.indicatorsBlock) },
        { ALT: () => this.SUBRULE(this.signalsBlock) },
        { ALT: () => this.SUBRULE(this.rulesBlock) },
        { ALT: () => this.SUBRULE(this.riskBlock) },
        { ALT: () => this.SUBRULE(this.eventHandlers) }
      ]);
    });
    this.CONSUME(tokens.RightBrace);
  });

  private paramsBlock = this.RULE('paramsBlock', () => {
    this.CONSUME(tokens.Params);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.strategyParam));
    this.CONSUME(tokens.RightBrace);
  });

  private strategyParam = this.RULE('strategyParam', () => {
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Colon);
    this.SUBRULE(this.typeExpr);
    this.OPTION(() => {
      this.CONSUME(tokens.Assign);
      this.SUBRULE(this.expression);
    });
    this.CONSUME(tokens.Semicolon);
  });

  private indicatorsBlock = this.RULE('indicatorsBlock', () => {
    this.CONSUME(tokens.Indicators);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.indicatorBinding));
    this.CONSUME(tokens.RightBrace);
  });

  private indicatorBinding = this.RULE('indicatorBinding', () => {
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Assign);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  private signalsBlock = this.RULE('signalsBlock', () => {
    this.CONSUME(tokens.Signals);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.signalBinding));
    this.CONSUME(tokens.RightBrace);
  });

  private signalBinding = this.RULE('signalBinding', () => {
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Assign);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  private rulesBlock = this.RULE('rulesBlock', () => {
    this.CONSUME(tokens.Rules);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.tradingRule));
    this.CONSUME(tokens.RightBrace);
  });

  private tradingRule = this.RULE('tradingRule', () => {
    this.CONSUME(tokens.When);
    this.CONSUME(tokens.LeftParen);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.RightParen);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.tradingAction));
    this.CONSUME(tokens.RightBrace);
  });

  private tradingAction = this.RULE('tradingAction', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(tokens.Buy);
          this.CONSUME(tokens.LeftParen);
          this.SUBRULE(this.expression);
          this.OPTION(() => {
            this.CONSUME(tokens.Comma);
            this.SUBRULE2(this.expression);
          });
          this.CONSUME(tokens.RightParen);
        }
      },
      {
        ALT: () => {
          this.CONSUME(tokens.Sell);
          this.CONSUME2(tokens.LeftParen);
          this.SUBRULE3(this.expression);
          this.OPTION2(() => {
            this.CONSUME2(tokens.Comma);
            this.SUBRULE4(this.expression);
          });
          this.CONSUME2(tokens.RightParen);
        }
      },
      {
        ALT: () => {
          this.CONSUME(tokens.Short);
          this.CONSUME3(tokens.LeftParen);
          this.SUBRULE5(this.expression);
          this.OPTION3(() => {
            this.CONSUME3(tokens.Comma);
            this.SUBRULE6(this.expression);
          });
          this.CONSUME3(tokens.RightParen);
        }
      },
      {
        ALT: () => {
          this.CONSUME(tokens.Cover);
          this.CONSUME4(tokens.LeftParen);
          this.SUBRULE7(this.expression);
          this.OPTION4(() => {
            this.CONSUME4(tokens.Comma);
            this.SUBRULE8(this.expression);
          });
          this.CONSUME4(tokens.RightParen);
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.callExpression);
        }
      }
    ]);
    this.CONSUME(tokens.Semicolon);
  });

  private riskBlock = this.RULE('riskBlock', () => {
    this.CONSUME(tokens.Risk);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.riskLimit));
    this.CONSUME(tokens.RightBrace);
  });

  private riskLimit = this.RULE('riskLimit', () => {
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Assign);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  private eventHandlers = this.RULE('eventHandlers', () => {
    this.CONSUME(tokens.Event);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.eventHandler));
    this.CONSUME(tokens.RightBrace);
  });

  private eventHandler = this.RULE('eventHandler', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.OnBar) },
      { ALT: () => this.CONSUME(tokens.OnTick) },
      { ALT: () => this.CONSUME(tokens.OnBook) },
      { ALT: () => this.CONSUME(tokens.OnFill) },
      { ALT: () => this.CONSUME(tokens.OnReject) },
      { ALT: () => this.CONSUME(tokens.Identifier) }
    ]);
    this.CONSUME(tokens.LeftParen);
    this.OPTION(() => this.SUBRULE(this.parameterList));
    this.CONSUME(tokens.RightParen);
    this.SUBRULE(this.block);
  });

  // ============= Indicator Declaration =============
  private indicatorDecl = this.RULE('indicatorDecl', () => {
    this.CONSUME(tokens.Indicator);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftParen);
    this.OPTION(() => this.SUBRULE(this.parameterList));
    this.CONSUME(tokens.RightParen);
    this.OPTION2(() => {
      this.CONSUME(tokens.Arrow);
      this.SUBRULE(this.typeExpr);
    });
    this.OR([
      { ALT: () => this.SUBRULE(this.block) },
      {
        ALT: () => {
          this.CONSUME(tokens.Assign);
          this.SUBRULE(this.expression);
          this.CONSUME(tokens.Semicolon);
        }
      }
    ]);
  });

  // ============= Data Declaration =============
  private dataDecl = this.RULE('dataDecl', () => {
    this.CONSUME(tokens.Data);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.dataField));
    this.OPTION(() => {
      this.CONSUME(tokens.Metrics);
      this.CONSUME2(tokens.LeftBrace);
      this.MANY2(() => this.SUBRULE(this.computedField));
      this.CONSUME2(tokens.RightBrace);
    });
    this.CONSUME(tokens.RightBrace);
  });

  private dataField = this.RULE('dataField', () => {
    this.CONSUME(tokens.Identifier);
    this.OPTION(() => this.CONSUME(tokens.Question));
    this.CONSUME(tokens.Colon);
    this.SUBRULE(this.typeExpr);
    this.OPTION2(() => {
      this.CONSUME(tokens.Assign);
      this.SUBRULE(this.expression);
    });
    this.CONSUME(tokens.Semicolon);
  });

  private computedField = this.RULE('computedField', () => {
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Colon);
    this.SUBRULE(this.typeExpr);
    this.CONSUME(tokens.Assign);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  // ============= Order Declaration =============
  private orderDecl = this.RULE('orderDecl', () => {
    this.CONSUME(tokens.Order);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.dataField));
    this.CONSUME(tokens.RightBrace);
  });

  // ============= Event Declaration =============
  private eventDecl = this.RULE('eventDecl', () => {
    this.CONSUME(tokens.Event);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.eventHandler));
    this.CONSUME(tokens.RightBrace);
  });

  // ============= Portfolio Declaration =============
  private portfolioDecl = this.RULE('portfolioDecl', () => {
    this.CONSUME(tokens.Portfolio);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.dataField));
    this.OPTION(() => {
      this.CONSUME(tokens.Metrics);
      this.CONSUME2(tokens.LeftBrace);
      this.MANY2(() => this.SUBRULE(this.computedField));
      this.CONSUME2(tokens.RightBrace);
    });
    this.OPTION2(() => {
      this.CONSUME(tokens.Constraints);
      this.CONSUME3(tokens.LeftBrace);
      this.MANY3(() => this.SUBRULE(this.constraintDef));
      this.CONSUME3(tokens.RightBrace);
    });
    this.CONSUME(tokens.RightBrace);
  });

  private constraintDef = this.RULE('constraintDef', () => {
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Assign);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  // ============= Backtest Declaration =============
  private backtestDecl = this.RULE('backtestDecl', () => {
    this.CONSUME(tokens.Backtest);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.backtestConfig));
    this.OPTION(() => {
      this.CONSUME(tokens.Costs);
      this.CONSUME2(tokens.LeftBrace);
      this.MANY2(() => this.SUBRULE2(this.backtestConfig));
      this.CONSUME2(tokens.RightBrace);
    });
    this.OPTION2(() => {
      this.CONSUME(tokens.Output);
      this.CONSUME3(tokens.LeftBrace);
      this.MANY3(() => this.SUBRULE3(this.backtestConfig));
      this.CONSUME3(tokens.RightBrace);
    });
    this.CONSUME(tokens.RightBrace);
  });

  private backtestConfig = this.RULE('backtestConfig', () => {
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Assign);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  // ============= Microstructure Declaration =============
  private microstructureDecl = this.RULE('microstructureDecl', () => {
    this.CONSUME(tokens.Microstructure);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.dataField) },
        { ALT: () => this.SUBRULE(this.detectBlock) },
        { ALT: () => this.SUBRULE(this.quoteBlock) },
        { ALT: () => this.SUBRULE(this.hedgingBlock) }
      ]);
    });
    this.CONSUME(tokens.RightBrace);
  });

  private detectBlock = this.RULE('detectBlock', () => {
    this.CONSUME(tokens.Detect);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.detection));
    this.CONSUME(tokens.RightBrace);
  });

  private detection = this.RULE('detection', () => {
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Assign);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  private quoteBlock = this.RULE('quoteBlock', () => {
    this.CONSUME(tokens.Quote);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.quoteDef));
    this.CONSUME(tokens.RightBrace);
  });

  private quoteDef = this.RULE('quoteDef', () => {
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Assign);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  private hedgingBlock = this.RULE('hedgingBlock', () => {
    this.CONSUME(tokens.Hedging);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.hedgingRule));
    this.CONSUME(tokens.RightBrace);
  });

  private hedgingRule = this.RULE('hedgingRule', () => {
    this.CONSUME(tokens.When);
    this.CONSUME(tokens.LeftParen);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.RightParen);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.statement));
    this.CONSUME(tokens.RightBrace);
  });

  // ============= Type Expressions =============
  private typeExpr = this.RULE('typeExpr', () => {
    this.SUBRULE(this.unionType);
  });

  private unionType = this.RULE('unionType', () => {
    this.SUBRULE(this.primaryType);
    this.MANY(() => {
      this.CONSUME(tokens.BitwiseOr);
      this.SUBRULE2(this.primaryType);
    });
  });

  private primaryType = this.RULE('primaryType', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.Int) },
      { ALT: () => this.CONSUME(tokens.Float) },
      { ALT: () => this.CONSUME(tokens.String) },
      { ALT: () => this.CONSUME(tokens.Boolean) },
      { ALT: () => this.CONSUME(tokens.Datetime) },
      { ALT: () => this.CONSUME(tokens.Void) },
      {
        ALT: () => {
          this.SUBRULE(this.arrayType);
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.mapType);
        }
      },
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
      }
    ]);
    this.OPTION2(() => this.CONSUME(tokens.Question));
  });

  private arrayType = this.RULE('arrayType', () => {
    this.CONSUME(tokens.Array);
    this.CONSUME(tokens.LessThan);
    this.SUBRULE(this.typeExpr);
    this.CONSUME(tokens.GreaterThan);
  });

  private mapType = this.RULE('mapType', () => {
    this.CONSUME(tokens.Map);
    this.CONSUME(tokens.LessThan);
    this.SUBRULE(this.typeExpr);
    this.CONSUME(tokens.Comma);
    this.SUBRULE2(this.typeExpr);
    this.CONSUME(tokens.GreaterThan);
  });

  // ============= Expressions =============
  private expression = this.RULE('expression', () => {
    this.SUBRULE(this.assignmentExpression);
  });

  private assignmentExpression = this.RULE('assignmentExpression', () => {
    this.SUBRULE(this.conditionalExpression);
    this.OPTION(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.Assign) },
        { ALT: () => this.CONSUME(tokens.PlusAssign) },
        { ALT: () => this.CONSUME(tokens.MinusAssign) },
        { ALT: () => this.CONSUME(tokens.MultiplyAssign) },
        { ALT: () => this.CONSUME(tokens.DivideAssign) },
        { ALT: () => this.CONSUME(tokens.ModuloAssign) }
      ]);
      this.SUBRULE2(this.assignmentExpression);
    });
  });

  private conditionalExpression = this.RULE('conditionalExpression', () => {
    this.SUBRULE(this.logicalOrExpression);
    this.OPTION(() => {
      this.CONSUME(tokens.Question);
      this.SUBRULE2(this.logicalOrExpression);
      this.CONSUME(tokens.Colon);
      this.SUBRULE3(this.logicalOrExpression);
    });
  });

  private logicalOrExpression = this.RULE('logicalOrExpression', () => {
    this.SUBRULE(this.logicalAndExpression);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.LogicalOr) },
        { ALT: () => this.CONSUME(tokens.Or) }
      ]);
      this.SUBRULE2(this.logicalAndExpression);
    });
  });

  private logicalAndExpression = this.RULE('logicalAndExpression', () => {
    this.SUBRULE(this.inExpression);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.LogicalAnd) },
        { ALT: () => this.CONSUME(tokens.And) }
      ]);
      this.SUBRULE2(this.inExpression);
    });
  });

  private inExpression = this.RULE('inExpression', () => {
    this.SUBRULE(this.equalityExpression);
    this.OPTION(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.In) },
        {
          ALT: () => {
            this.CONSUME(tokens.Not);
            this.CONSUME2(tokens.In);
          }
        }
      ]);
      this.SUBRULE2(this.equalityExpression);
    });
  });

  private equalityExpression = this.RULE('equalityExpression', () => {
    this.SUBRULE(this.relationalExpression);
    this.MANY(() => {
      this.OR([
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
    this.SUBRULE(this.powerExpression);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.Multiply) },
        { ALT: () => this.CONSUME(tokens.Divide) },
        { ALT: () => this.CONSUME(tokens.Modulo) }
      ]);
      this.SUBRULE2(this.powerExpression);
    });
  });

  private powerExpression = this.RULE('powerExpression', () => {
    this.SUBRULE(this.unaryExpression);
    this.OPTION(() => {
      this.CONSUME(tokens.Power);
      this.SUBRULE2(this.powerExpression);
    });
  });

  private unaryExpression = this.RULE('unaryExpression', () => {
    this.OR([
      {
        ALT: () => {
          this.OR2([
            { ALT: () => this.CONSUME(tokens.Plus) },
            { ALT: () => this.CONSUME(tokens.Minus) },
            { ALT: () => this.CONSUME(tokens.Bang) },
            { ALT: () => this.CONSUME(tokens.Not) },
            { ALT: () => this.CONSUME(tokens.BitwiseNot) }
          ]);
          this.SUBRULE(this.unaryExpression);
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
            this.OR2([
              {
                ALT: () => {
                  this.OPTION(() => this.SUBRULE(this.expression));
                  this.CONSUME(tokens.Colon);
                  this.OPTION2(() => this.SUBRULE2(this.expression));
                  this.OPTION3(() => {
                    this.CONSUME2(tokens.Colon);
                    this.SUBRULE3(this.expression);
                  });
                }
              },
              {
                ALT: () => {
                  this.SUBRULE4(this.expression);
                }
              }
            ]);
            this.CONSUME(tokens.RightBracket);
          }
        },
        {
          ALT: () => {
            this.CONSUME(tokens.LeftParen);
            this.OPTION4(() => this.SUBRULE(this.argumentList));
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
      { ALT: () => this.CONSUME(tokens.DateLiteral) },
      { ALT: () => this.CONSUME(tokens.True) },
      { ALT: () => this.CONSUME(tokens.False) },
      { ALT: () => this.CONSUME(tokens.Null) },
      { ALT: () => this.CONSUME(tokens.Identifier) },
      { ALT: () => this.SUBRULE(this.arrayLiteral) },
      { ALT: () => this.SUBRULE(this.objectLiteral) },
      { ALT: () => this.SUBRULE(this.comprehension) },
      {
        ALT: () => {
          this.CONSUME(tokens.LeftParen);
          this.SUBRULE(this.expression);
          this.CONSUME(tokens.RightParen);
        }
      }
    ]);
  });

  private callExpression = this.RULE('callExpression', () => {
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftParen);
    this.OPTION(() => this.SUBRULE(this.argumentList));
    this.CONSUME(tokens.RightParen);
  });

  private argumentList = this.RULE('argumentList', () => {
    this.SUBRULE(this.expression);
    this.MANY(() => {
      this.CONSUME(tokens.Comma);
      this.SUBRULE2(this.expression);
    });
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
          this.CONSUME2(tokens.Identifier);
        }
      }
    ]);
  });

  private comprehension = this.RULE('comprehension', () => {
    this.CONSUME(tokens.LeftBracket);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.For);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.In);
    this.SUBRULE2(this.expression);
    this.OPTION(() => {
      this.CONSUME(tokens.If);
      this.SUBRULE3(this.expression);
    });
    this.CONSUME(tokens.RightBracket);
  });

  // ============= Statements =============
  private block = this.RULE('block', () => {
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.statement));
    this.CONSUME(tokens.RightBrace);
  });

  private statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.expressionStatement) },
      { ALT: () => this.SUBRULE(this.variableDeclaration) },
      { ALT: () => this.SUBRULE(this.ifStatement) },
      { ALT: () => this.SUBRULE(this.whileStatement) },
      { ALT: () => this.SUBRULE(this.forStatement) },
      { ALT: () => this.SUBRULE(this.returnStatement) },
      { ALT: () => this.SUBRULE(this.breakStatement) },
      { ALT: () => this.SUBRULE(this.continueStatement) },
      { ALT: () => this.SUBRULE(this.whenStatement) }
    ]);
  });

  private expressionStatement = this.RULE('expressionStatement', () => {
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  private variableDeclaration = this.RULE('variableDeclaration', () => {
    this.CONSUME(tokens.Identifier);
    this.OPTION(() => {
      this.CONSUME(tokens.Colon);
      this.SUBRULE(this.typeExpr);
    });
    this.CONSUME(tokens.Assign);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
  });

  private ifStatement = this.RULE('ifStatement', () => {
    this.CONSUME(tokens.If);
    this.CONSUME(tokens.LeftParen);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.RightParen);
    this.SUBRULE(this.block);
    this.MANY(() => {
      this.CONSUME(tokens.ElseIf);
      this.CONSUME2(tokens.LeftParen);
      this.SUBRULE2(this.expression);
      this.CONSUME2(tokens.RightParen);
      this.SUBRULE2(this.block);
    });
    this.OPTION(() => {
      this.CONSUME(tokens.Else);
      this.SUBRULE3(this.block);
    });
  });

  private whileStatement = this.RULE('whileStatement', () => {
    this.CONSUME(tokens.While);
    this.CONSUME(tokens.LeftParen);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.RightParen);
    this.SUBRULE(this.block);
  });

  private forStatement = this.RULE('forStatement', () => {
    this.CONSUME(tokens.For);
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.In);
    this.SUBRULE(this.expression);
    this.SUBRULE(this.block);
  });

  private returnStatement = this.RULE('returnStatement', () => {
    this.CONSUME(tokens.Return);
    this.OPTION(() => this.SUBRULE(this.expression));
    this.CONSUME(tokens.Semicolon);
  });

  private breakStatement = this.RULE('breakStatement', () => {
    this.CONSUME(tokens.Break);
    this.CONSUME(tokens.Semicolon);
  });

  private continueStatement = this.RULE('continueStatement', () => {
    this.CONSUME(tokens.Continue);
    this.CONSUME(tokens.Semicolon);
  });

  private whenStatement = this.RULE('whenStatement', () => {
    this.CONSUME(tokens.When);
    this.CONSUME(tokens.LeftParen);
    this.SUBRULE(this.expression);
    this.CONSUME(tokens.RightParen);
    this.SUBRULE(this.block);
  });

  // ============= Parameters =============
  private parameterList = this.RULE('parameterList', () => {
    this.SUBRULE(this.parameter);
    this.MANY(() => {
      this.CONSUME(tokens.Comma);
      this.SUBRULE2(this.parameter);
    });
  });

  private parameter = this.RULE('parameter', () => {
    this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Colon);
    this.SUBRULE(this.typeExpr);
    this.OPTION(() => {
      this.CONSUME(tokens.Assign);
      this.SUBRULE(this.expression);
    });
  });
}

export const croweLangParser = new CroweLangParser();