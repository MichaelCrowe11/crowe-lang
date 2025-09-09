# crowe-lang — MVP compiler & transpiler (v0.1)

A minimal, working subset of **crowe-lang** that transpiles to React + TypeScript (TSX). This is designed to be a clean foundation you can extend toward the fuller design.

## Quick Start

```bash
# Install dependencies
npm install

# Compile a crowe file
npm run compile examples/hello.crowe

# Or compile directly with ts-node
npx ts-node packages/crowe-cli/src/index.ts examples/hello.crowe > output.tsx
```

## Language Features (MVP subset)

- **Components**: Component-first syntax with params
- **State**: Reactive state with automatic setter generation  
- **Computed**: IIFE or useMemo-based computed values
- **Effects**: useEffect with dependency management
- **Actions**: Functions with automatic state assignment transformation
- **Render**: JSX render blocks

## Examples

### Hello World (`examples/hello.crowe`)

```crowe
component HelloWorld(props: { initial?: number }) {
  state count: number = props.initial ?? 0;

  computed doubled: number { return count * 2; }
  computed memoTripled: number (deps: [count]) { return count * 3; }

  effect onMount { console.log('mounted'); }

  action increment() { count = count + 1; }
  action add(delta: number) { count = count + delta; }

  render {
    <div style={{ padding: 12 }}>
      <h1>Hello crowe‑lang</h1>
      <p>count: {count}</p>
      <p>doubled (IIFE): {doubled}</p>
      <p>tripled (memo): {memoTripled}</p>
      <button onClick={() => increment()}>+1</button>
      <button onClick={() => add(5)}>+5</button>
    </div>
  }
}
```

Compiles to clean React TSX with hooks and state management.

## Project Structure

```
packages/
  crowe-compiler/src/    # Core compiler
  crowe-cli/src/         # CLI tool
examples/                # Example .crowe files
```

## License

MIT License — do whatever you like, no warranty.