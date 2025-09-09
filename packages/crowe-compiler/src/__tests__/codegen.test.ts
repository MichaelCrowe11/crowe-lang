import { generateReactTSX } from '../codegen.react';
import { parseCrowe } from '../parser';

describe('React Code Generation', () => {
  describe('Component Generation', () => {
    test('should generate basic React component', () => {
      const source = `
        component Hello() {
          render {
            <div>Hello World</div>
          }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('import * as React from \'react\';');
      expect(output).toContain('export function Hello()');
      expect(output).toContain('return ( <div>Hello World</div> );');
    });

    test('should generate component with props', () => {
      const source = `
        component Greeting(props: { name: string }) {
          render {
            <div>Hello {props.name}</div>
          }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('export function Greeting(props: { name: string })');
    });
  });

  describe('State Generation', () => {
    test('should generate useState hooks', () => {
      const source = `
        component Counter() {
          state count: number = 0;
          state name: string = "test";
          render { <div>{count}</div> }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('const [count, setCount] = React.useState<number>(0);');
      expect(output).toContain('const [name, setName] = React.useState<string>("test");');
    });

    test('should transform state assignments in actions', () => {
      const source = `
        component Test() {
          state value: number = 0;
          action update() {
            value = value + 1;
          }
          render { <div /> }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('setValue(value + 1);');
    });
  });

  describe('Computed Generation', () => {
    test('should generate IIFE for computed without deps', () => {
      const source = `
        component Test() {
          state x: number = 5;
          computed doubled: number { return x * 2; }
          render { <div>{doubled}</div> }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('const doubled = (() => { return x * 2; })();');
    });

    test('should generate useMemo for computed with deps', () => {
      const source = `
        component Test() {
          state a: number = 1;
          computed sum: number (deps: [a]) { return a + 10; }
          render { <div>{sum}</div> }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('const sum = React.useMemo(() => { return a + 10; }, [a]);');
    });
  });

  describe('Effect Generation', () => {
    test('should generate useEffect for onMount', () => {
      const source = `
        component Test() {
          effect onMount {
            console.log("mounted");
          }
          render { <div /> }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('React.useEffect(() => { console.log("mounted"); }, []);');
    });

    test('should generate useEffect with dependencies', () => {
      const source = `
        component Test() {
          state value: number = 0;
          effect onChange(deps: [value]) {
            console.log(value);
          }
          render { <div /> }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('React.useEffect(() => { console.log(value); }, [value]);');
    });
  });

  describe('Store Generation', () => {
    test('should generate Zustand store', () => {
      const source = `
        store AppStore {
          state count: number = 0;
          action increment() {
            count = count + 1;
          }
          computed doubled: number {
            return count * 2;
          }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('import { create } from \'zustand\';');
      expect(output).toContain('export const useAppStore = create((set, get) => ({');
      expect(output).toContain('count: 0,');
      expect(output).toContain('get doubled() { return count * 2; },');
      expect(output).toContain('increment: () => { set({ count: count + 1 }); },');
    });
  });

  describe('AI and Stream Generation', () => {
    test('should generate AI model loading', () => {
      const source = `
        component Test() {
          ai model: TextGen = model("gpt-4");
          render { <div /> }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('import { loadModel, inferenceSession } from \'@crowe/ai-runtime\';');
      expect(output).toContain('const [model, setModel] = React.useState(null);');
      expect(output).toContain('loadModel(\'gpt-4\').then(setModel);');
    });

    test('should generate stream connection', () => {
      const source = `
        component Test() {
          stream data: any = "/api/stream";
          render { <div /> }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('const [data, setData] = React.useState<any>(null);');
      expect(output).toContain('const source = new EventSource("/api/stream");');
      expect(output).toContain('source.onmessage = (e) => setData(JSON.parse(e.data));');
    });
  });

  describe('JSX Generation', () => {
    test('should preserve JSX structure', () => {
      const source = `
        component Layout() {
          render {
            <div className="container">
              <header>
                <h1>Title</h1>
              </header>
              <main>
                <p>Content</p>
              </main>
            </div>
          }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('return ( <div className="container">');
      expect(output).toContain('<h1>Title</h1>');
      expect(output).toContain('<p>Content</p>');
    });

    test('should handle JSX expressions', () => {
      const source = `
        component Dynamic() {
          state items: string[] = ["a", "b", "c"];
          render {
            <ul>
              {items.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          }
        }
      `;
      
      const ast = parseCrowe(source);
      const output = generateReactTSX(ast);
      
      expect(output).toContain('{items.map(item => (');
      expect(output).toContain('<li key={item}>{item}</li>');
    });
  });
});