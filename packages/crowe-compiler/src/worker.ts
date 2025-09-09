import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { compileCroweToReactTSXWithStats, CompileOptions } from './index';

export interface WorkerTask {
  id: string;
  filePath: string;
  source: string;
  options: CompileOptions;
}

export interface WorkerResult {
  id: string;
  success: boolean;
  output?: string;
  sourceMap?: string;
  stats?: any;
  error?: string;
}

// Worker thread implementation
if (!isMainThread && parentPort) {
  parentPort.on('message', async (task: WorkerTask) => {
    try {
      const result = compileCroweToReactTSXWithStats(task.source, {
        ...task.options,
        filename: task.filePath
      });

      const response: WorkerResult = {
        id: task.id,
        success: true,
        output: result.output,
        sourceMap: result.sourceMap,
        stats: result.stats
      };

      parentPort!.postMessage(response);
    } catch (error) {
      const response: WorkerResult = {
        id: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      parentPort!.postMessage(response);
    }
  });
}

// Main thread pool management
export class CompilerWorkerPool {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private pendingTasks = new Map<string, {
    resolve: (result: WorkerResult) => void;
    reject: (error: Error) => void;
  }>();
  private taskIdCounter = 0;

  constructor(private poolSize: number = require('os').cpus().length) {
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(__filename);
      
      worker.on('message', (result: WorkerResult) => {
        const pending = this.pendingTasks.get(result.id);
        if (pending) {
          this.pendingTasks.delete(result.id);
          if (result.success) {
            pending.resolve(result);
          } else {
            pending.reject(new Error(result.error || 'Unknown compilation error'));
          }
        }
        
        // Process next task in queue
        this.processNext();
      });

      worker.on('error', (error) => {
        console.error('Worker error:', error);
        // Restart worker
        this.restartWorker(i);
      });

      this.workers.push(worker);
    }
  }

  private restartWorker(index: number): void {
    const oldWorker = this.workers[index];
    oldWorker.terminate();
    
    const newWorker = new Worker(__filename);
    this.workers[index] = newWorker;
    
    // Re-setup event listeners
    newWorker.on('message', (result: WorkerResult) => {
      const pending = this.pendingTasks.get(result.id);
      if (pending) {
        this.pendingTasks.delete(result.id);
        if (result.success) {
          pending.resolve(result);
        } else {
          pending.reject(new Error(result.error || 'Unknown compilation error'));
        }
      }
      this.processNext();
    });

    newWorker.on('error', (error) => {
      console.error('Worker error:', error);
      this.restartWorker(index);
    });
  }

  private getAvailableWorker(): Worker | null {
    // Simple round-robin selection
    // In a more sophisticated implementation, we'd track worker availability
    return this.workers[Math.floor(Math.random() * this.workers.length)];
  }

  private processNext(): void {
    if (this.taskQueue.length === 0) return;
    
    const worker = this.getAvailableWorker();
    if (!worker) return;
    
    const task = this.taskQueue.shift()!;
    worker.postMessage(task);
  }

  compile(filePath: string, source: string, options: CompileOptions = {}): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      const id = `task-${++this.taskIdCounter}`;
      
      const task: WorkerTask = {
        id,
        filePath,
        source,
        options
      };

      this.pendingTasks.set(id, { resolve, reject });
      
      const worker = this.getAvailableWorker();
      if (worker) {
        worker.postMessage(task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  async compileMultiple(
    files: Array<{ filePath: string; source: string; options?: CompileOptions }>
  ): Promise<WorkerResult[]> {
    const promises = files.map(({ filePath, source, options = {} }) =>
      this.compile(filePath, source, options)
    );

    return Promise.all(promises);
  }

  async terminate(): Promise<void> {
    await Promise.all(this.workers.map(worker => worker.terminate()));
  }

  get stats(): { poolSize: number; pendingTasks: number; queuedTasks: number } {
    return {
      poolSize: this.workers.length,
      pendingTasks: this.pendingTasks.size,
      queuedTasks: this.taskQueue.length
    };
  }
}

let globalWorkerPool: CompilerWorkerPool | null = null;

export function getWorkerPool(): CompilerWorkerPool {
  if (!globalWorkerPool) {
    globalWorkerPool = new CompilerWorkerPool();
  }
  return globalWorkerPool;
}

export async function compileWithWorkers(
  filePath: string, 
  source: string, 
  options: CompileOptions = {}
): Promise<WorkerResult> {
  const pool = getWorkerPool();
  return pool.compile(filePath, source, options);
}

export async function compileMultipleWithWorkers(
  files: Array<{ filePath: string; source: string; options?: CompileOptions }>
): Promise<WorkerResult[]> {
  const pool = getWorkerPool();
  return pool.compileMultiple(files);
}