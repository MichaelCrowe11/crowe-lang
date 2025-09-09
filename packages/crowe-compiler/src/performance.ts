export class PerformanceTimer {
  private timers = new Map<string, number>();
  private results = new Map<string, number[]>();

  start(name: string): void {
    this.timers.set(name, performance.now());
  }

  end(name: string): number {
    const start = this.timers.get(name);
    if (!start) {
      throw new Error(`Timer '${name}' was not started`);
    }
    
    const duration = performance.now() - start;
    this.timers.delete(name);
    
    if (!this.results.has(name)) {
      this.results.set(name, []);
    }
    this.results.get(name)!.push(duration);
    
    return duration;
  }

  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const times = this.results.get(name);
    if (!times || times.length === 0) return null;

    return {
      avg: times.reduce((a, b) => a + b) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length
    };
  }

  getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, any> = {};
    for (const name of this.results.keys()) {
      const stat = this.getStats(name);
      if (stat) {
        stats[name] = stat;
      }
    }
    return stats;
  }

  clear(): void {
    this.timers.clear();
    this.results.clear();
  }
}

export const globalTimer = new PerformanceTimer();

export function measure<T>(name: string, fn: () => T): T {
  globalTimer.start(name);
  try {
    return fn();
  } finally {
    globalTimer.end(name);
  }
}

export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  globalTimer.start(name);
  try {
    return await fn();
  } finally {
    globalTimer.end(name);
  }
}

export function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export class MemoryTracker {
  private snapshots: Array<{ name: string; memory: NodeJS.MemoryUsage; time: number }> = [];

  snapshot(name: string): void {
    this.snapshots.push({
      name,
      memory: process.memoryUsage(),
      time: Date.now()
    });
  }

  getDiff(fromName: string, toName: string): NodeJS.MemoryUsage | null {
    const from = this.snapshots.find(s => s.name === fromName);
    const to = this.snapshots.find(s => s.name === toName);
    
    if (!from || !to) return null;

    return {
      rss: to.memory.rss - from.memory.rss,
      heapTotal: to.memory.heapTotal - from.memory.heapTotal,
      heapUsed: to.memory.heapUsed - from.memory.heapUsed,
      external: to.memory.external - from.memory.external,
      arrayBuffers: to.memory.arrayBuffers - from.memory.arrayBuffers
    };
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    const sign = bytes < 0 ? '-' : '';
    return `${sign}${parseFloat((Math.abs(bytes) / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  clear(): void {
    this.snapshots = [];
  }
}

export const globalMemory = new MemoryTracker();