import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface CacheEntry {
  source: string;
  sourceHash: string;
  compiledOutput: string;
  sourceMap?: string;
  timestamp: number;
  dependencies: string[];
}

export class CompilerCache {
  private cacheDir: string;
  private cache = new Map<string, CacheEntry>();

  constructor(cacheDir: string = '.crowe-cache') {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
    this.loadCache();
  }

  private ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private loadCache() {
    try {
      const cacheFile = path.join(this.cacheDir, 'cache.json');
      if (fs.existsSync(cacheFile)) {
        const data = fs.readFileSync(cacheFile, 'utf-8');
        const entries = JSON.parse(data) as Record<string, CacheEntry>;
        this.cache = new Map(Object.entries(entries));
      }
    } catch (error) {
      // Ignore cache loading errors, start fresh
    }
  }

  private saveCache() {
    try {
      const cacheFile = path.join(this.cacheDir, 'cache.json');
      const entries = Object.fromEntries(this.cache.entries());
      fs.writeFileSync(cacheFile, JSON.stringify(entries, null, 2));
    } catch (error) {
      // Ignore save errors
    }
  }

  private getFileHash(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch {
      return '';
    }
  }

  private getSourceHash(source: string): string {
    return crypto.createHash('md5').update(source).digest('hex');
  }

  isValid(filePath: string, source: string, dependencies: string[] = []): boolean {
    const entry = this.cache.get(filePath);
    if (!entry) return false;

    // Check if source has changed
    const currentHash = this.getSourceHash(source);
    if (entry.sourceHash !== currentHash) return false;

    // Check if dependencies have changed
    for (const dep of dependencies) {
      const depHash = this.getFileHash(dep);
      if (!entry.dependencies.includes(dep) || !depHash) {
        return false;
      }
    }

    return true;
  }

  get(filePath: string): CacheEntry | undefined {
    return this.cache.get(filePath);
  }

  set(
    filePath: string, 
    source: string, 
    compiledOutput: string, 
    sourceMap?: string,
    dependencies: string[] = []
  ): void {
    const entry: CacheEntry = {
      source,
      sourceHash: this.getSourceHash(source),
      compiledOutput,
      sourceMap,
      timestamp: Date.now(),
      dependencies
    };

    this.cache.set(filePath, entry);
    this.saveCache();
  }

  clear(): void {
    this.cache.clear();
    try {
      const cacheFile = path.join(this.cacheDir, 'cache.json');
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
      }
    } catch {
      // Ignore errors
    }
  }

  stats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size
    };
  }
}