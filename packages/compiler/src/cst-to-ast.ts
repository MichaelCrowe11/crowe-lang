import { CstNode, CstChildrenDictionary, IToken } from 'chevrotain';
import * as AST from './ast';

export class CstToAstTransformer {
  private currentLine = 1;
  private currentCol = 1;
  private currentPos = 0;

  transform(cst: CstNode): AST.Program {
    const imports: AST.ImportDecl[] = [];
    const stores: AST.StoreDecl[] = [];
    const components: AST.ComponentDecl[] = [];

    const children = cst.children as any;
    
    if (children.importDecl) {
      imports.push(...children.importDecl.map((n: CstNode) => this.transformImport(n)));
    }
    
    if (children.storeDecl) {
      stores.push(...children.storeDecl.map((n: CstNode) => this.transformStore(n)));
    }
    
    if (children.componentDecl) {
      components.push(...children.componentDecl.map((n: CstNode) => this.transformComponent(n)));
    }

    return {
      kind: 'Program',
      imports,
      stores,
      components
    };
  }

  private transformImport(node: CstNode): AST.ImportDecl {
    const children = node.children as any;
    const source = this.tokenValue(children.StringLiteral[0]);
    const alias = children.Identifier ? this.tokenValue(children.Identifier[0]) : undefined;
    
    return {
      kind: 'ImportDecl',
      source,
      alias,
      loc: this.getLoc(node)
    };
  }

  private transformStore(node: CstNode): AST.StoreDecl {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const fields: (AST.StoreState | AST.StoreAction)[] = [];

    if (children.storeStateField) {
      fields.push(...children.storeStateField.map((n: CstNode) => this.transformStoreState(n)));
    }
    
    if (children.storeActionField) {
      fields.push(...children.storeActionField.map((n: CstNode) => this.transformStoreAction(n)));
    }

    return {
      kind: 'StoreDecl',
      name,
      fields,
      loc: this.getLoc(node)
    };
  }

  private transformStoreState(node: CstNode): AST.StoreState {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const ty = this.transformType(children.typeExpr[0]);
    const init = children.expression ? this.transformExpression(children.expression[0]) : undefined;

    return {
      kind: 'StoreState',
      name,
      ty,
      init,
      loc: this.getLoc(node)
    };
  }

  private transformStoreAction(node: CstNode): AST.StoreAction {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const params = this.transformParams(children.paramList[0]);
    const body = this.transformBlock(children.block[0]);

    return {
      kind: 'StoreAction',
      name,
      params,
      body,
      loc: this.getLoc(node)
    };
  }

  private transformComponent(node: CstNode): AST.ComponentDecl {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const typeParams = children.typeParams ? this.transformTypeParams(children.typeParams[0]) : undefined;
    const props = children.paramList ? this.transformParams(children.paramList[0]) : undefined;
    const body = this.transformBlock(children.block[0]);

    return {
      kind: 'ComponentDecl',
      name,
      typeParams,
      props,
      body,
      loc: this.getLoc(node)
    };
  }

  private transformTypeParams(node: CstNode): AST.Id[] {
    const children = node.children as any;
    if (!children.Identifier) return [];
    return children.Identifier.map((tok: IToken) => this.transformId(tok));
  }

  private transformParams(node: CstNode): AST.Param[] {
    const children = node.children as any;
    if (!children.param) return [];
    return children.param.map((n: CstNode) => this.transformParam(n));
  }

  private transformParam(node: CstNode): AST.Param {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const ty = this.transformType(children.typeExpr[0]);
    
    return {
      name,
      ty,
      loc: this.getLoc(node)
    };
  }

  private transformBlock(node: CstNode): AST.Block {
    const children = node.children as any;
    const stmts = children.statement ? children.statement.map((n: CstNode) => this.transformStatement(n)) : [];
    
    return {
      kind: 'Block',
      stmts,
      loc: this.getLoc(node)
    };
  }

  private transformStatement(node: CstNode): AST.Stmt {
    const children = node.children as any;
    
    if (children.varDecl) {
      return this.transformVarDecl(children.varDecl[0]);
    }
    if (children.stateDecl) {
      return this.transformStateDecl(children.stateDecl[0]);
    }
    if (children.computedDecl) {
      return this.transformComputedDecl(children.computedDecl[0]);
    }
    if (children.effectDecl) {
      return this.transformEffectDecl(children.effectDecl[0]);
    }
    if (children.actionDecl) {
      return this.transformActionDecl(children.actionDecl[0]);
    }
    if (children.viewDecl) {
      return this.transformViewDecl(children.viewDecl[0]);
    }
    if (children.expressionStatement) {
      return this.transformExpressionStatement(children.expressionStatement[0]);
    }
    
    throw new Error('Unknown statement type');
  }

  private transformVarDecl(node: CstNode): AST.VarDecl {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const ty = children.typeExpr ? this.transformType(children.typeExpr[0]) : undefined;
    const init = children.expression ? this.transformExpression(children.expression[0]) : undefined;

    return {
      kind: 'VarDecl',
      name,
      ty,
      init,
      loc: this.getLoc(node)
    };
  }

  private transformStateDecl(node: CstNode): AST.StateDecl {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const ty = this.transformType(children.typeExpr[0]);
    const init = children.expression ? this.transformExpression(children.expression[0]) : undefined;

    return {
      kind: 'StateDecl',
      name,
      ty,
      init,
      loc: this.getLoc(node)
    };
  }

  private transformComputedDecl(node: CstNode): AST.ComputedDecl {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const params = this.transformParams(children.paramList[0]);
    const ret = children.typeExpr ? this.transformType(children.typeExpr[0]) : undefined;
    const expr = this.transformExpression(children.expression[0]);

    return {
      kind: 'ComputedDecl',
      name,
      params,
      ret,
      expr,
      loc: this.getLoc(node)
    };
  }

  private transformEffectDecl(node: CstNode): AST.EffectDecl {
    const children = node.children as any;
    const deps = children.expression ? this.transformExpression(children.expression[0]) : undefined;
    const body = this.transformBlock(children.block[0]);

    return {
      kind: 'EffectDecl',
      deps,
      body,
      loc: this.getLoc(node)
    };
  }

  private transformActionDecl(node: CstNode): AST.ActionDecl {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const params = this.transformParams(children.paramList[0]);
    const body = this.transformBlock(children.block[0]);

    return {
      kind: 'ActionDecl',
      name,
      params,
      body,
      loc: this.getLoc(node)
    };
  }

  private transformViewDecl(node: CstNode): AST.ViewDecl {
    const children = node.children as any;
    const jsx = this.transformJSX(children.jsxElement[0]);

    return {
      kind: 'ViewDecl',
      jsx,
      loc: this.getLoc(node)
    };
  }

  private transformExpressionStatement(node: CstNode): AST.ExprStmt {
    const children = node.children as any;
    const expr = this.transformExpression(children.expression[0]);

    return {
      kind: 'ExprStmt',
      expr,
      loc: this.getLoc(node)
    };
  }

  private transformExpression(node: CstNode): AST.Expr {
    const children = node.children as any;
    
    // Handle literals
    if (children.NumberLiteral) {
      const tok = children.NumberLiteral[0];
      return {
        kind: 'Lit',
        value: Number(tok.image),
        raw: tok.image,
        loc: this.getTokenLoc(tok)
      };
    }
    
    if (children.StringLiteral) {
      const tok = children.StringLiteral[0];
      return {
        kind: 'Lit',
        value: this.tokenValue(tok),
        raw: tok.image,
        loc: this.getTokenLoc(tok)
      };
    }
    
    if (children.True) {
      const tok = children.True[0];
      return {
        kind: 'Lit',
        value: true,
        raw: 'true',
        loc: this.getTokenLoc(tok)
      };
    }
    
    if (children.False) {
      const tok = children.False[0];
      return {
        kind: 'Lit',
        value: false,
        raw: 'false',
        loc: this.getTokenLoc(tok)
      };
    }
    
    if (children.Null) {
      const tok = children.Null[0];
      return {
        kind: 'Lit',
        value: null,
        raw: 'null',
        loc: this.getTokenLoc(tok)
      };
    }
    
    if (children.Identifier && !children.LeftParen) {
      return {
        kind: 'IdExpr',
        id: this.transformId(children.Identifier[0])
      };
    }
    
    // Handle nested expressions
    if (children.assignmentExpression) {
      return this.transformAssignmentExpression(children.assignmentExpression[0]);
    }
    
    if (children.expression) {
      return this.transformExpression(children.expression[0]);
    }
    
    if (children.arrayLiteral) {
      return this.transformArrayLiteral(children.arrayLiteral[0]);
    }
    
    if (children.objectLiteral) {
      return this.transformObjectLiteral(children.objectLiteral[0]);
    }
    
    // Default case
    return {
      kind: 'IdExpr',
      id: { text: 'unknown', loc: this.getLoc(node) }
    };
  }

  private transformAssignmentExpression(node: CstNode): AST.Expr {
    const children = node.children as any;
    
    if (children.logicalOrExpression && !children.Assign && !children.PlusAssign && !children.MinusAssign) {
      return this.transformLogicalOrExpression(children.logicalOrExpression[0]);
    }
    
    const left = this.transformLogicalOrExpression(children.logicalOrExpression[0]);
    const right = this.transformAssignmentExpression(children.assignmentExpression[0]);
    
    return {
      kind: 'AssignExpr',
      left,
      right,
      loc: this.getLoc(node)
    };
  }

  private transformLogicalOrExpression(node: CstNode): AST.Expr {
    const children = node.children as any;
    
    if (!children.logicalAndExpression || children.logicalAndExpression.length === 1) {
      return this.transformLogicalAndExpression(children.logicalAndExpression[0]);
    }
    
    let left = this.transformLogicalAndExpression(children.logicalAndExpression[0]);
    
    for (let i = 1; i < children.logicalAndExpression.length; i++) {
      const op = children.LogicalOr ? '||' : '||';
      const right = this.transformLogicalAndExpression(children.logicalAndExpression[i]);
      left = {
        kind: 'BinaryExpr',
        op: op as AST.BinaryOp,
        left,
        right,
        loc: this.getLoc(node)
      };
    }
    
    return left;
  }

  private transformLogicalAndExpression(node: CstNode): AST.Expr {
    const children = node.children as any;
    
    if (!children.equalityExpression || children.equalityExpression.length === 1) {
      return this.transformEqualityExpression(children.equalityExpression[0]);
    }
    
    let left = this.transformEqualityExpression(children.equalityExpression[0]);
    
    for (let i = 1; i < children.equalityExpression.length; i++) {
      const right = this.transformEqualityExpression(children.equalityExpression[i]);
      left = {
        kind: 'BinaryExpr',
        op: '&&',
        left,
        right,
        loc: this.getLoc(node)
      };
    }
    
    return left;
  }

  private transformEqualityExpression(node: CstNode): AST.Expr {
    const children = node.children as any;
    
    if (!children.relationalExpression || children.relationalExpression.length === 1) {
      return this.transformRelationalExpression(children.relationalExpression[0]);
    }
    
    let left = this.transformRelationalExpression(children.relationalExpression[0]);
    
    for (let i = 1; i < children.relationalExpression.length; i++) {
      let op: AST.BinaryOp = '==';
      if (children.StrictEqual) op = '===';
      else if (children.StrictNotEqual) op = '!==';
      else if (children.Equal) op = '==';
      else if (children.NotEqual) op = '!=';
      
      const right = this.transformRelationalExpression(children.relationalExpression[i]);
      left = {
        kind: 'BinaryExpr',
        op,
        left,
        right,
        loc: this.getLoc(node)
      };
    }
    
    return left;
  }

  private transformRelationalExpression(node: CstNode): AST.Expr {
    const children = node.children as any;
    
    if (!children.additiveExpression || children.additiveExpression.length === 1) {
      return this.transformAdditiveExpression(children.additiveExpression[0]);
    }
    
    let left = this.transformAdditiveExpression(children.additiveExpression[0]);
    
    for (let i = 1; i < children.additiveExpression.length; i++) {
      let op: AST.BinaryOp = '<';
      if (children.LessThan) op = '<';
      else if (children.LessThanOrEqual) op = '<=';
      else if (children.GreaterThan) op = '>';
      else if (children.GreaterThanOrEqual) op = '>=';
      
      const right = this.transformAdditiveExpression(children.additiveExpression[i]);
      left = {
        kind: 'BinaryExpr',
        op,
        left,
        right,
        loc: this.getLoc(node)
      };
    }
    
    return left;
  }

  private transformAdditiveExpression(node: CstNode): AST.Expr {
    const children = node.children as any;
    
    if (!children.multiplicativeExpression || children.multiplicativeExpression.length === 1) {
      return this.transformMultiplicativeExpression(children.multiplicativeExpression[0]);
    }
    
    let left = this.transformMultiplicativeExpression(children.multiplicativeExpression[0]);
    
    for (let i = 1; i < children.multiplicativeExpression.length; i++) {
      const op = children.Plus ? '+' : '-';
      const right = this.transformMultiplicativeExpression(children.multiplicativeExpression[i]);
      left = {
        kind: 'BinaryExpr',
        op: op as AST.BinaryOp,
        left,
        right,
        loc: this.getLoc(node)
      };
    }
    
    return left;
  }

  private transformMultiplicativeExpression(node: CstNode): AST.Expr {
    const children = node.children as any;
    
    if (!children.unaryExpression || children.unaryExpression.length === 1) {
      return this.transformUnaryExpression(children.unaryExpression[0]);
    }
    
    let left = this.transformUnaryExpression(children.unaryExpression[0]);
    
    for (let i = 1; i < children.unaryExpression.length; i++) {
      let op: AST.BinaryOp = '*';
      if (children.Multiply) op = '*';
      else if (children.Divide) op = '/';
      else if (children.Modulo) op = '%';
      
      const right = this.transformUnaryExpression(children.unaryExpression[i]);
      left = {
        kind: 'BinaryExpr',
        op,
        left,
        right,
        loc: this.getLoc(node)
      };
    }
    
    return left;
  }

  private transformUnaryExpression(node: CstNode): AST.Expr {
    const children = node.children as any;
    
    if (children.Await) {
      const arg = this.transformUnaryExpression(children.unaryExpression[0]);
      return {
        kind: 'AwaitExpr',
        arg,
        loc: this.getLoc(node)
      };
    }
    
    if (children.Bang || children.Minus || children.Plus || children.BitwiseNot) {
      let op: AST.UnaryOp = '!';
      if (children.Bang) op = '!';
      else if (children.Minus) op = '-';
      else if (children.Plus) op = '+';
      else if (children.BitwiseNot) op = '~';
      
      const arg = this.transformUnaryExpression(children.unaryExpression[0]);
      return {
        kind: 'UnaryExpr',
        op,
        arg,
        loc: this.getLoc(node)
      };
    }
    
    return this.transformPostfixExpression(children.postfixExpression[0]);
  }

  private transformPostfixExpression(node: CstNode): AST.Expr {
    const children = node.children as any;
    let expr = this.transformPrimaryExpression(children.primaryExpression[0]);
    
    // Handle member access, calls, and indexing
    if (children.Dot) {
      for (let i = 0; i < children.Dot.length; i++) {
        expr = {
          kind: 'MemberExpr',
          target: expr,
          prop: this.transformId(children.Identifier[i]),
          loc: this.getLoc(node)
        };
      }
    }
    
    if (children.LeftParen) {
      const args: AST.Expr[] = [];
      if (children.expression) {
        args.push(...children.expression.map((e: CstNode) => this.transformExpression(e)));
      }
      expr = {
        kind: 'CallExpr',
        callee: expr,
        args,
        loc: this.getLoc(node)
      };
    }
    
    return expr;
  }

  private transformPrimaryExpression(node: CstNode): AST.Expr {
    const children = node.children as any;
    
    if (children.NumberLiteral) {
      const tok = children.NumberLiteral[0];
      return {
        kind: 'Lit',
        value: Number(tok.image),
        raw: tok.image,
        loc: this.getTokenLoc(tok)
      };
    }
    
    if (children.StringLiteral) {
      const tok = children.StringLiteral[0];
      return {
        kind: 'Lit',
        value: this.tokenValue(tok),
        raw: tok.image,
        loc: this.getTokenLoc(tok)
      };
    }
    
    if (children.True || children.False || children.Null || children.Undefined) {
      const tok = children.True?.[0] || children.False?.[0] || children.Null?.[0] || children.Undefined?.[0];
      const value = children.True ? true : children.False ? false : null;
      return {
        kind: 'Lit',
        value,
        raw: tok.image,
        loc: this.getTokenLoc(tok)
      };
    }
    
    if (children.Identifier) {
      return {
        kind: 'IdExpr',
        id: this.transformId(children.Identifier[0])
      };
    }
    
    if (children.arrayLiteral) {
      return this.transformArrayLiteral(children.arrayLiteral[0]);
    }
    
    if (children.objectLiteral) {
      return this.transformObjectLiteral(children.objectLiteral[0]);
    }
    
    if (children.expression) {
      return this.transformExpression(children.expression[0]);
    }
    
    throw new Error('Unknown primary expression');
  }

  private transformArrayLiteral(node: CstNode): AST.ArrayLit {
    const children = node.children as any;
    const elems = children.expression ? children.expression.map((e: CstNode) => this.transformExpression(e)) : [];
    
    return {
      kind: 'ArrayLit',
      elems,
      loc: this.getLoc(node)
    };
  }

  private transformObjectLiteral(node: CstNode): AST.ObjectLit {
    const children = node.children as any;
    const fields: AST.ObjectField[] = [];
    
    if (children.objectProperty) {
      for (const prop of children.objectProperty) {
        fields.push(this.transformObjectProperty(prop));
      }
    }
    
    return {
      kind: 'ObjectLit',
      fields,
      loc: this.getLoc(node)
    };
  }

  private transformObjectProperty(node: CstNode): AST.ObjectField {
    const children = node.children as any;
    
    if (children.Identifier && children.expression) {
      return {
        key: this.transformId(children.Identifier[0]),
        value: this.transformExpression(children.expression[0])
      };
    }
    
    if (children.StringLiteral && children.expression) {
      return {
        key: {
          kind: 'Lit',
          value: this.tokenValue(children.StringLiteral[0]),
          raw: children.StringLiteral[0].image,
          loc: this.getTokenLoc(children.StringLiteral[0])
        },
        value: this.transformExpression(children.expression[0])
      };
    }
    
    // Shorthand property
    if (children.Identifier && !children.expression) {
      const id = this.transformId(children.Identifier[0]);
      return {
        key: id,
        value: { kind: 'IdExpr', id }
      };
    }
    
    throw new Error('Unknown object property type');
  }

  private transformJSX(node: CstNode): AST.JSXNode {
    const children = node.children as any;
    
    if (children.jsxSelfClosing) {
      return this.transformJSXSelfClosing(children.jsxSelfClosing[0]);
    }
    
    if (children.jsxNormalElement) {
      return this.transformJSXNormalElement(children.jsxNormalElement[0]);
    }
    
    if (children.jsxFragment) {
      return this.transformJSXFragment(children.jsxFragment[0]);
    }
    
    throw new Error('Unknown JSX element type');
  }

  private transformJSXSelfClosing(node: CstNode): AST.JSXSelfClosing {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const attrs = children.jsxAttribute ? children.jsxAttribute.map((a: CstNode) => this.transformJSXAttribute(a)) : [];
    
    return {
      kind: 'JSXSelfClosing',
      name,
      attrs,
      loc: this.getLoc(node)
    };
  }

  private transformJSXNormalElement(node: CstNode): AST.JSXElem {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const attrs = children.jsxAttribute ? children.jsxAttribute.map((a: CstNode) => this.transformJSXAttribute(a)) : [];
    const jsxChildren = children.jsxChild ? children.jsxChild.map((c: CstNode) => this.transformJSXChild(c)) : [];
    
    return {
      kind: 'JSXElem',
      name,
      attrs,
      children: jsxChildren,
      loc: this.getLoc(node)
    };
  }

  private transformJSXFragment(node: CstNode): AST.JSXFragment {
    const children = node.children as any;
    const jsxChildren = children.jsxChild ? children.jsxChild.map((c: CstNode) => this.transformJSXChild(c)) : [];
    
    return {
      kind: 'JSXFragment',
      children: jsxChildren,
      loc: this.getLoc(node)
    };
  }

  private transformJSXAttribute(node: CstNode): AST.JSXAttr {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    let value: AST.Expr | string = '';
    
    if (children.StringLiteral) {
      value = this.tokenValue(children.StringLiteral[0]);
    } else if (children.expression) {
      value = this.transformExpression(children.expression[0]);
    }
    
    return {
      name,
      value,
      loc: this.getLoc(node)
    };
  }

  private transformJSXChild(node: CstNode): AST.JSXNode {
    const children = node.children as any;
    
    if (children.jsxElement) {
      return this.transformJSX(children.jsxElement[0]);
    }
    
    if (children.expression) {
      return {
        kind: 'JSXExpr',
        expr: this.transformExpression(children.expression[0]),
        loc: this.getLoc(node)
      };
    }
    
    // Text node
    return {
      kind: 'JSXText',
      text: '',
      loc: this.getLoc(node)
    };
  }

  private transformType(node: CstNode): AST.TypeNode {
    const children = node.children as any;
    
    if (children.typeUnion) {
      return this.transformTypeUnion(children.typeUnion[0]);
    }
    
    // Default to any
    return { kind: 'TPrim', name: 'any' };
  }

  private transformTypeUnion(node: CstNode): AST.TypeNode {
    const children = node.children as any;
    
    if (children.typeIntersection && children.typeIntersection.length === 1) {
      return this.transformTypeIntersection(children.typeIntersection[0]);
    }
    
    const types = children.typeIntersection.map((t: CstNode) => this.transformTypeIntersection(t));
    return { kind: 'TUnion', types };
  }

  private transformTypeIntersection(node: CstNode): AST.TypeNode {
    const children = node.children as any;
    
    if (children.typePostfix) {
      return this.transformTypePostfix(children.typePostfix[0]);
    }
    
    return { kind: 'TPrim', name: 'any' };
  }

  private transformTypePostfix(node: CstNode): AST.TypeNode {
    const children = node.children as any;
    let ty = this.transformTypePrimary(children.typePrimary[0]);
    
    if (children.LeftBracket) {
      ty = { kind: 'TArray', elem: ty };
    }
    
    if (children.Question) {
      ty = { kind: 'TOptional', ty };
    }
    
    return ty;
  }

  private transformTypePrimary(node: CstNode): AST.TypeNode {
    const children = node.children as any;
    
    if (children.TypeNumber) return { kind: 'TPrim', name: 'number' };
    if (children.TypeString) return { kind: 'TPrim', name: 'string' };
    if (children.TypeBoolean) return { kind: 'TPrim', name: 'boolean' };
    if (children.TypeVoid) return { kind: 'TPrim', name: 'void' };
    if (children.TypeAny) return { kind: 'TPrim', name: 'any' };
    if (children.TypeNever) return { kind: 'TPrim', name: 'never' };
    
    if (children.Identifier) {
      const name = this.transformId(children.Identifier[0]);
      const args = children.typeExpr ? children.typeExpr.map((t: CstNode) => this.transformType(t)) : undefined;
      return { kind: 'TRef', name, args };
    }
    
    if (children.typeField) {
      const fields = children.typeField.map((f: CstNode) => this.transformTypeField(f));
      return { kind: 'TRecord', fields };
    }
    
    return { kind: 'TPrim', name: 'any' };
  }

  private transformTypeField(node: CstNode): AST.TypeField {
    const children = node.children as any;
    const name = this.transformId(children.Identifier[0]);
    const ty = this.transformType(children.typeExpr[0]);
    const optional = !!children.Question;
    
    return { name, ty, optional };
  }

  private transformId(token: IToken): AST.Id {
    return {
      text: token.image,
      loc: this.getTokenLoc(token)
    };
  }

  private tokenValue(token: IToken): string {
    const img = token.image;
    if (img.startsWith('"') || img.startsWith("'") || img.startsWith('`')) {
      return img.slice(1, -1);
    }
    return img;
  }

  private getLoc(node: CstNode): AST.Loc {
    return {
      start: this.currentPos,
      end: this.currentPos + 1,
      line: this.currentLine,
      col: this.currentCol
    };
  }

  private getTokenLoc(token: IToken): AST.Loc {
    return {
      start: token.startOffset,
      end: token.endOffset || token.startOffset + token.image.length,
      line: token.startLine || 1,
      col: token.startColumn || 1
    };
  }
}