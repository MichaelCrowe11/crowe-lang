#!/usr/bin/env node

/**
 * Crowe Language Performance Benchmark Suite
 * Measures compilation speed, memory usage, and output size
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { execSync } = require('child_process');

// Benchmark configurations
const BENCHMARKS = [
  {
    name: 'Simple Component',
    file: 'simple-component.crowe',
    content: `component Button {
  state count: number = 0
  
  action increment {
    count = count + 1
  }
  
  render {
    <button onClick={increment}>
      Count: {count}
    </button>
  }
}`
  },
  {
    name: 'Complex Component with AI',
    file: 'complex-ai.crowe',
    content: `component AIChat {
  state messages: Message[] = []
  state input: string = ""
  state loading: boolean = false
  
  ai assistant {
    model: "gpt-3.5-turbo"
    temperature: 0.7
  }
  
  async action sendMessage {
    loading = true
    const response = await assistant.complete(input)
    messages = [...messages, { text: input, sender: "user" }, { text: response, sender: "ai" }]
    input = ""
    loading = false
  }
  
  computed messageCount = messages.length
  
  effect [messages] {
    console.log("Message count:", messageCount)
  }
  
  render {
    <div className="chat-container">
      <div className="messages">
        {messages.map(msg => (
          <div className={msg.sender}>
            {msg.text}
          </div>
        ))}
      </div>
      <input 
        value={input} 
        onChange={(e) => input = e.target.value}
        disabled={loading}
      />
      <button onClick={sendMessage} disabled={loading}>
        Send
      </button>
    </div>
  }
}`
  },
  {
    name: 'Store with Multiple Components',
    file: 'store-example.crowe',
    content: `store AppStore {
  state user: User | null = null
  state theme: "light" | "dark" = "light"
  state notifications: Notification[] = []
  
  action login(email: string, password: string) {
    user = await api.login(email, password)
  }
  
  action toggleTheme {
    theme = theme === "light" ? "dark" : "light"
  }
  
  computed isLoggedIn = user !== null
  computed notificationCount = notifications.length
}

component Header {
  use store = AppStore
  
  render {
    <header className={store.theme}>
      {store.isLoggedIn ? (
        <span>Welcome, {store.user.name}</span>
      ) : (
        <button>Login</button>
      )}
      <span>Notifications: {store.notificationCount}</span>
    </header>
  }
}

component ThemeToggle {
  use store = AppStore
  
  render {
    <button onClick={store.toggleTheme}>
      Current theme: {store.theme}
    </button>
  }
}`
  },
  {
    name: 'Large Component (100 states)',
    file: 'large-component.crowe',
    content: generateLargeComponent(100)
  },
  {
    name: 'Deep Nesting (10 levels)',
    file: 'deep-nesting.crowe',
    content: generateDeepNesting(10)
  }
];

function generateLargeComponent(stateCount) {
  let content = 'component LargeComponent {\n';
  
  // Generate states
  for (let i = 0; i < stateCount; i++) {
    content += `  state value${i}: number = ${i}\n`;
  }
  
  // Generate computed values
  content += '\n';
  for (let i = 0; i < 10; i++) {
    content += `  computed sum${i} = value${i * 10} + value${i * 10 + 1}\n`;
  }
  
  // Generate render
  content += '\n  render {\n    <div>\n';
  for (let i = 0; i < 20; i++) {
    content += `      <span>Value ${i}: {value${i}}</span>\n`;
  }
  content += '    </div>\n  }\n}';
  
  return content;
}

function generateDeepNesting(depth) {
  let content = 'component DeepNested {\n';
  content += '  state value: number = 0\n\n';
  content += '  render {\n';
  
  // Generate opening tags
  for (let i = 0; i < depth; i++) {
    content += '  '.repeat(i + 2) + `<div className="level-${i}">\n`;
  }
  
  // Center content
  content += '  '.repeat(depth + 2) + '<span>{value}</span>\n';
  
  // Generate closing tags
  for (let i = depth - 1; i >= 0; i--) {
    content += '  '.repeat(i + 2) + '</div>\n';
  }
  
  content += '  }\n}';
  return content;
}

// Benchmark runner
class BenchmarkRunner {
  constructor() {
    this.results = [];
    this.tempDir = path.join(__dirname, '..', 'benchmark-temp');
    
    // Create temp directory
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }
  
  async runBenchmark(benchmark) {
    const filePath = path.join(this.tempDir, benchmark.file);
    const outputPath = filePath.replace('.crowe', '.tsx');
    
    // Write test file
    fs.writeFileSync(filePath, benchmark.content);
    
    // Measure compilation
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      // Run compiler
      execSync(`node ${path.join(__dirname, '..', 'dist', 'crowe-cli', 'src', 'index.js')} compile ${filePath}`, {
        cwd: this.tempDir,
        stdio: 'pipe'
      });
      
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      // Get output size
      const outputSize = fs.statSync(outputPath).size;
      const inputSize = Buffer.byteLength(benchmark.content);
      
      // Calculate metrics
      const compilationTime = endTime - startTime;
      const memoryUsed = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024; // MB
      const sizeRatio = outputSize / inputSize;
      
      return {
        name: benchmark.name,
        success: true,
        metrics: {
          compilationTime: Math.round(compilationTime * 100) / 100,
          memoryUsed: Math.round(memoryUsed * 100) / 100,
          inputSize,
          outputSize,
          sizeRatio: Math.round(sizeRatio * 100) / 100,
          linesPerSecond: Math.round((benchmark.content.split('\n').length / (compilationTime / 1000)) * 100) / 100
        }
      };
    } catch (error) {
      return {
        name: benchmark.name,
        success: false,
        error: error.message
      };
    } finally {
      // Cleanup
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
  }
  
  async runAll() {
    console.log('🚀 Running Crowe Language Benchmarks...\n');
    
    for (const benchmark of BENCHMARKS) {
      process.stdout.write(`Running "${benchmark.name}"... `);
      const result = await this.runBenchmark(benchmark);
      this.results.push(result);
      
      if (result.success) {
        console.log(`✅ ${result.metrics.compilationTime}ms`);
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    }
    
    this.printSummary();
    this.saveResults();
  }
  
  printSummary() {
    console.log('\n📊 Benchmark Summary\n');
    console.log('═'.repeat(80));
    
    const successful = this.results.filter(r => r.success);
    
    if (successful.length === 0) {
      console.log('No successful benchmarks');
      return;
    }
    
    // Create table
    console.log('Name'.padEnd(30) + 
                'Time (ms)'.padEnd(12) + 
                'Memory (MB)'.padEnd(12) + 
                'Size Ratio'.padEnd(12) + 
                'Lines/sec');
    console.log('-'.repeat(80));
    
    for (const result of successful) {
      const m = result.metrics;
      console.log(
        result.name.padEnd(30) +
        m.compilationTime.toString().padEnd(12) +
        m.memoryUsed.toFixed(2).padEnd(12) +
        m.sizeRatio.toFixed(2).padEnd(12) +
        m.linesPerSecond.toFixed(0)
      );
    }
    
    console.log('═'.repeat(80));
    
    // Calculate averages
    const avgTime = successful.reduce((sum, r) => sum + r.metrics.compilationTime, 0) / successful.length;
    const avgMemory = successful.reduce((sum, r) => sum + r.metrics.memoryUsed, 0) / successful.length;
    const avgRatio = successful.reduce((sum, r) => sum + r.metrics.sizeRatio, 0) / successful.length;
    
    console.log('\n📈 Averages:');
    console.log(`  Compilation Time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Memory Usage: ${avgMemory.toFixed(2)}MB`);
    console.log(`  Output/Input Ratio: ${avgRatio.toFixed(2)}x`);
    
    // Performance rating
    const rating = this.calculateRating(avgTime);
    console.log(`\n🏆 Performance Rating: ${rating}`);
  }
  
  calculateRating(avgTime) {
    if (avgTime < 50) return '⚡ Excellent (< 50ms)';
    if (avgTime < 100) return '✅ Good (< 100ms)';
    if (avgTime < 200) return '⚠️ Fair (< 200ms)';
    return '❌ Needs Improvement (> 200ms)';
  }
  
  saveResults() {
    const outputPath = path.join(__dirname, '..', 'benchmark-results.json');
    const data = {
      timestamp: new Date().toISOString(),
      version: require('../package.json').version,
      platform: process.platform,
      nodeVersion: process.version,
      results: this.results
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\n💾 Results saved to: benchmark-results.json`);
  }
  
  cleanup() {
    // Remove temp directory
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }
}

// Main execution
async function main() {
  const runner = new BenchmarkRunner();
  
  try {
    await runner.runAll();
  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  } finally {
    runner.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { BenchmarkRunner, BENCHMARKS };