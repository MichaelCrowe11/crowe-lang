# Crowe Language Support

Official VS Code extension for the Crowe programming language - a React-native computing language with AI operations, state management, and real-time streams.

![Crowe Logo](https://raw.githubusercontent.com/MichaelCrowe11/crowe-lang/master/docs/crowe-logo.png)

## Features

- **Syntax Highlighting** - Full syntax highlighting for Crowe language constructs
- **IntelliSense** - Auto-completion for components, state, computed values, actions, stores, streams, and AI operations
- **Error Diagnostics** - Real-time error checking and validation
- **Code Compilation** - Compile `.crowe` files to React TSX with context menu actions
- **Watch Mode** - Automatically recompile on file changes
- **Language Server** - Full LSP support with hover information and diagnostics

## Language Features

✅ **Components** - React function components with hooks  
✅ **State** - Reactive state with useState  
✅ **Computed** - Memoized values with useMemo  
✅ **Effects** - Side effects with useEffect  
✅ **Actions** - Event handlers and async functions  
✅ **Stores** - Cross-component state with Zustand  
✅ **Streams** - Real-time data with WebSockets  
✅ **AI Operations** - ML model integration  

## Quick Start

1. **Install the Extension**
   - Search for "Crowe Language Support" in VS Code extensions
   - Or install from the command line: `code --install-extension crowe-lang.crowe-lang`

2. **Install Crowe CLI**
   ```bash
   npm install -g crowe-lang
   ```

3. **Create a Crowe File**
   - Create a new file with `.crowe` extension
   - Start writing your component:

   ```crowe
   component HelloWorld() {
     state message: string = "Hello, Crowe!";
     state count: number = 0;
     
     action increment() {
       count = count + 1;
     }
     
     render {
       <div style={{ padding: 20, fontFamily: 'system-ui' }}>
         <h1>{message}</h1>
         <p>Count: {count}</p>
         <button onClick={() => increment()}>
           Click me!
         </button>
       </div>
     }
   }
   ```

4. **Compile Your Code**
   - Right-click in the editor and select "Compile Current File"
   - Or use Ctrl+Shift+P and run "Crowe: Compile Current File"

## Commands

- **Crowe: Compile Current File** - Compile the current `.crowe` file
- **Crowe: Compile and Watch Current File** - Compile and watch for changes
- **Crowe: Show Compiled Output** - Open the compiled `.tsx` file

## Configuration

Configure the extension in VS Code settings:

```json
{
  "crowe.enableDiagnostics": true,
  "crowe.enableAutoCompletion": true,
  "crowe.compilerPath": "crowe",
  "crowe.autoCompileOnSave": false
}
```

## Language Examples

### Basic Component
```crowe
component Button() {
  state clicked: boolean = false;
  
  action handleClick() {
    clicked = !clicked;
  }
  
  render {
    <button 
      onClick={() => handleClick()}
      style={{ background: clicked ? 'blue' : 'gray' }}
    >
      {clicked ? 'Clicked!' : 'Click me'}
    </button>
  }
}
```

### Store Management
```crowe
store AppStore {
  state user: User | null = null;
  state theme: string = 'light';
  
  action login(userData: User) {
    user = userData;
  }
  
  action toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
  }
}

component App() {
  computed store: any { return useAppStore(); }
  
  render {
    <div className={`app theme-${store.theme}`}>
      {store.user ? (
        <h1>Welcome, {store.user.name}!</h1>
      ) : (
        <button onClick={() => store.login({ name: 'User' })}>
          Login
        </button>
      )}
    </div>
  }
}
```

### AI Operations
```crowe
component ChatBot() {
  state messages: Message[] = [];
  state input: string = "";
  ai model: ChatModel = model("gpt-3.5-turbo");
  
  action async sendMessage() {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    messages = [...messages, userMsg];
    
    const response = await model.complete(messages);
    messages = [...messages, response];
    input = "";
  }
  
  render {
    <div className="chat">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="input">
        <input 
          value={input}
          onChange={(e) => input = e.target.value}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={() => sendMessage()}>Send</button>
      </div>
    </div>
  }
}
```

### Real-Time Streams
```crowe
component LiveData() {
  state data: any[] = [];
  stream connection: any = "wss://api.example.com/live";
  
  effect onConnect {
    connection.onMessage((msg) => {
      data = [...data, JSON.parse(msg.data)];
    });
  }
  
  render {
    <div className="live-data">
      <h2>Live Data Stream</h2>
      {data.map(item => (
        <div key={item.id} className="data-item">
          {item.timestamp}: {item.value}
        </div>
      ))}
    </div>
  }
}
```

## Requirements

- VS Code 1.74.0 or higher
- Node.js 14+ (for Crowe CLI)
- Crowe CLI (`npm install -g crowe-lang`)

## Links

- [Crowe Language Documentation](https://github.com/MichaelCrowe11/crowe-lang)
- [GitHub Repository](https://github.com/MichaelCrowe11/crowe-lang)
- [NPM Package](https://npmjs.com/package/crowe-lang)
- [Issue Tracker](https://github.com/MichaelCrowe11/crowe-lang/issues)

## Release Notes

### 0.2.0
- Added full language server protocol (LSP) support
- Improved syntax highlighting and error diagnostics
- Added compilation commands and watch mode
- Enhanced auto-completion for all language constructs

### 0.1.0
- Initial release with basic syntax highlighting
- Support for component, state, computed, effects, actions
- Basic compilation support

## License

MIT License - see [LICENSE](https://github.com/MichaelCrowe11/crowe-lang/blob/master/LICENSE) for details.

---

**Enjoy coding with Crowe! 🚀**