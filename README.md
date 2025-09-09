# crowe-lang — React-Native Computing Language (v0.2)

A powerful React-based computing language that transpiles to TypeScript/JSX with component-first syntax, cross-component state management, AI-native operations, and real-time data streams.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Compile a crowe file
npm run compile examples/hello.crowe

# Or compile directly with ts-node
npx ts-node packages/crowe-cli/src/index.ts examples/hello.crowe > output.tsx
```

## ✨ Language Features

### Core Features
- **Components**: Component-first syntax with TypeScript params
- **State**: Reactive state with automatic setter generation  
- **Computed**: IIFE or useMemo-based computed values
- **Effects**: useEffect with dependency management
- **Actions**: Functions with automatic state assignment transformation
- **Render**: JSX render blocks

### Advanced Features (v0.2)
- **Stores**: Cross-component state management (compiles to Zustand)
- **AI Operations**: Native AI model integration (`ai` declarations)
- **Streams**: Real-time data with WebSocket/SSE support
- **Type Safety**: Full TypeScript type inference

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

### Store with AI (`examples/dashboard.crowe`)

```crowe
store AnalyticsStore {
  state metrics: any[] = [];
  stream liveData: any = "/api/metrics/stream";
  ai insightModel: TextGenerator = model("gpt-3.5-turbo");
  
  computed filteredMetrics: any[] {
    return metrics.filter(m => m.active);
  }
  
  action async generateInsight(metric: any) {
    return await insightModel.generate(prompt);
  }
}

component Dashboard() {
  computed store: any { return useAnalyticsStore(); }
  
  effect onMount {
    store.connectLiveData();
  }
  
  render {
    <div className="dashboard">
      {store.filteredMetrics.map(metric => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  }
}
```

## 🛠️ Project Structure

```
packages/
  crowe-compiler/src/    # Core compiler (parser, AST, codegen)
  crowe-cli/src/         # CLI tool
examples/                # Example .crowe files
  hello.crowe           # Basic counter example
  dashboard.crowe       # Analytics with AI & streams
  chat-app.crowe        # Real-time chat with sentiment analysis
vscode-extension/        # VS Code syntax highlighting
```

## 📦 Installation & Usage

### As a CLI tool

```bash
# Install globally (coming soon)
npm install -g crowe-lang

# Compile files
crowe compile app.crowe -o app.tsx
```

### VS Code Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Crowe Language Support"
4. Install for syntax highlighting

## 🔧 Compilation Targets

Crowe compiles to clean, idiomatic React code:

| Crowe Feature | React Output |
|--------------|--------------|
| `state` | `useState` hook |
| `computed` | `useMemo` or IIFE |
| `effect` | `useEffect` |
| `action` | Function with state transforms |
| `store` | Zustand store |
| `stream` | EventSource/WebSocket |
| `ai` | Model loading wrapper |

## 🚧 Roadmap

- [x] Basic component compilation
- [x] State management (stores)
- [x] AI operation bindings
- [x] Stream primitives
- [x] VS Code extension
- [ ] Error handling & diagnostics
- [ ] Unit tests & CI/CD
- [ ] Package manager (npm publishing)
- [ ] Language server protocol (LSP)
- [ ] Hot module replacement
- [ ] Source maps
- [ ] Production optimizations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License — do whatever you like, no warranty.