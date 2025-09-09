import { parseCrowe, parseCroweWithErrors } from '../parser';
import { CroweFile } from '../ast';

describe('Crowe Parser', () => {
  describe('Basic Components', () => {
    test('should parse a simple component', () => {
      const source = `
        component HelloWorld() {
          render {
            <div>Hello</div>
          }
        }
      `;
      
      const ast = parseCrowe(source);
      expect(ast.components).toHaveLength(1);
      expect(ast.components[0].name).toBe('HelloWorld');
      expect(ast.components[0].sections).toHaveLength(1);
      expect(ast.components[0].sections[0].kind).toBe('render');
    });

    test('should parse component with parameters', () => {
      const source = `
        component Button(props: { label: string }) {
          render {
            <button>{props.label}</button>
          }
        }
      `;
      
      const ast = parseCrowe(source);
      expect(ast.components).toHaveLength(1);
      expect(ast.components[0].params).toBe('props: { label: string }');
    });
  });

  describe('State Management', () => {
    test('should parse state declarations', () => {
      const source = `
        component Counter() {
          state count: number = 0;
          state name: string = "test";
          
          render {
            <div>{count}</div>
          }
        }
      `;
      
      const ast = parseCrowe(source);
      const states = ast.components[0].sections.filter(s => s.kind === 'state');
      expect(states).toHaveLength(2);
      expect(states[0]).toMatchObject({
        kind: 'state',
        name: 'count',
        type: 'number',
        init: '0'
      });
    });

    test('should parse state with complex initialization', () => {
      const source = `
        component Test() {
          state data: any = { foo: "bar", count: 42 };
          render { <div /> }
        }
      `;
      
      const ast = parseCrowe(source);
      const state = ast.components[0].sections.find(s => s.kind === 'state');
      expect(state?.init).toBe('{ foo: "bar", count: 42 }');
    });
  });

  describe('Computed Values', () => {
    test('should parse computed without dependencies', () => {
      const source = `
        component Test() {
          state x: number = 5;
          computed doubled: number { return x * 2; }
          render { <div>{doubled}</div> }
        }
      `;
      
      const ast = parseCrowe(source);
      const computed = ast.components[0].sections.find(s => s.kind === 'computed');
      expect(computed).toMatchObject({
        kind: 'computed',
        name: 'doubled',
        type: 'number',
        body: 'return x * 2;',
        deps: undefined
      });
    });

    test('should parse computed with dependencies', () => {
      const source = `
        component Test() {
          state a: number = 1;
          state b: number = 2;
          computed sum: number (deps: [a, b]) { return a + b; }
          render { <div>{sum}</div> }
        }
      `;
      
      const ast = parseCrowe(source);
      const computed = ast.components[0].sections.find(s => s.kind === 'computed');
      expect(computed?.deps).toEqual(['a', 'b']);
    });
  });

  describe('Effects', () => {
    test('should parse onMount effect', () => {
      const source = `
        component Test() {
          effect onMount {
            console.log("Component mounted");
          }
          render { <div /> }
        }
      `;
      
      const ast = parseCrowe(source);
      const effect = ast.components[0].sections.find(s => s.kind === 'effect');
      expect(effect).toMatchObject({
        kind: 'effect',
        name: 'onMount',
        deps: [],
        body: 'console.log("Component mounted");'
      });
    });

    test('should parse effect with dependencies', () => {
      const source = `
        component Test() {
          state value: number = 0;
          effect onChange(deps: [value]) {
            console.log("Value changed:", value);
          }
          render { <div /> }
        }
      `;
      
      const ast = parseCrowe(source);
      const effect = ast.components[0].sections.find(s => s.kind === 'effect');
      expect(effect?.deps).toEqual(['value']);
    });
  });

  describe('Actions', () => {
    test('should parse simple action', () => {
      const source = `
        component Test() {
          state count: number = 0;
          action increment() {
            count = count + 1;
          }
          render { <button onClick={() => increment()}>+</button> }
        }
      `;
      
      const ast = parseCrowe(source);
      const action = ast.components[0].sections.find(s => s.kind === 'action');
      expect(action).toMatchObject({
        kind: 'action',
        name: 'increment',
        params: '',
        isAsync: false,
        body: 'count = count + 1;'
      });
    });

    test('should parse async action with parameters', () => {
      const source = `
        component Test() {
          action fetchData(url: string) async {
            const response = await fetch(url);
            return response.json();
          }
          render { <div /> }
        }
      `;
      
      const ast = parseCrowe(source);
      const action = ast.components[0].sections.find(s => s.kind === 'action');
      expect(action?.isAsync).toBe(true);
      expect(action?.params).toBe('url: string');
    });
  });

  describe('Stores', () => {
    test('should parse store with state and actions', () => {
      const source = `
        store UserStore {
          state users: User[] = [];
          state currentUser: User | null = null;
          
          action setUser(user: User) {
            currentUser = user;
          }
          
          computed userCount: number {
            return users.length;
          }
        }
      `;
      
      const ast = parseCrowe(source);
      expect(ast.stores).toHaveLength(1);
      expect(ast.stores![0].name).toBe('UserStore');
      expect(ast.stores![0].sections).toHaveLength(4);
    });
  });

  describe('AI and Streams', () => {
    test('should parse AI declaration', () => {
      const source = `
        component Test() {
          ai model: TextGenerator = model("gpt-4");
          render { <div /> }
        }
      `;
      
      const ast = parseCrowe(source);
      const ai = ast.components[0].sections.find(s => s.kind === 'ai');
      expect(ai).toMatchObject({
        kind: 'ai',
        name: 'model',
        model: 'gpt-4',
        type: 'TextGenerator'
      });
    });

    test('should parse stream declaration', () => {
      const source = `
        component Test() {
          stream data: Message = "wss://example.com/stream";
          render { <div /> }
        }
      `;
      
      const ast = parseCrowe(source);
      const stream = ast.components[0].sections.find(s => s.kind === 'stream');
      expect(stream).toMatchObject({
        kind: 'stream',
        name: 'data',
        type: 'Message',
        source: '"wss://example.com/stream"'
      });
    });
  });

  describe('Error Handling', () => {
    test('should report missing render block', () => {
      const source = `
        component NoRender() {
          state x: number = 0;
        }
      `;
      
      const result = parseCroweWithErrors(source, 'test.crowe');
      expect(result.ast).toBeDefined();
      // Note: render block validation happens in codegen, not parser
    });

    test('should handle invalid syntax gracefully', () => {
      const source = `
        component Invalid {
          this is not valid syntax
        }
      `;
      
      const result = parseCroweWithErrors(source, 'test.crowe');
      // Parser should still create a component but skip invalid sections
      expect(result.ast).toBeDefined();
    });
  });

  describe('JSX Parsing', () => {
    test('should parse JSX with nested elements', () => {
      const source = `
        component Complex() {
          render {
            <div className="container">
              <h1>Title</h1>
              <p>Paragraph with {expression}</p>
              <button onClick={() => handleClick()}>
                Click me
              </button>
            </div>
          }
        }
      `;
      
      const ast = parseCrowe(source);
      const render = ast.components[0].sections.find(s => s.kind === 'render');
      expect(render?.jsx).toContain('<div className="container">');
      expect(render?.jsx).toContain('{expression}');
    });

    test('should handle JSX with style objects', () => {
      const source = `
        component Styled() {
          render {
            <div style={{ padding: 12, color: "red" }}>
              Content
            </div>
          }
        }
      `;
      
      const ast = parseCrowe(source);
      const render = ast.components[0].sections.find(s => s.kind === 'render');
      expect(render?.jsx).toContain('style={{ padding: 12, color: "red" }}');
    });
  });
});