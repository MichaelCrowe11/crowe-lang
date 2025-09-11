// Data feed for providing market data during backtesting
import { EventEmitter } from 'events';
import { Bar, Tick, BacktestConfig, Timeframe } from './types';

export interface DataProvider {
  fetchBars(symbol: string, start: Date, end: Date, timeframe: Timeframe): Promise<Bar[]>;
  fetchTicks?(symbol: string, start: Date, end: Date): Promise<Tick[]>;
}

export class DataFeed extends EventEmitter {
  private config: BacktestConfig;
  private provider: DataProvider;
  private cache: Map<string, Bar[]> = new Map();
  private currentIndex: Map<string, number> = new Map();

  constructor(config: BacktestConfig) {
    super();
    this.config = config;
    this.provider = this.createProvider(config.data_source);
  }

  private createProvider(source: string): DataProvider {
    switch (source) {
      case 'mock':
        return new MockDataProvider();
      case 'csv':
        return new CSVDataProvider();
      default:
        return new MockDataProvider();
    }
  }

  public async initialize(): Promise<void> {
    // Pre-load data for all symbols
    const start = new Date(this.config.start_date);
    const end = new Date(this.config.end_date);
    
    for (const symbol of this.config.symbols) {
      const bars = await this.provider.fetchBars(
        symbol,
        start,
        end,
        this.config.timeframe
      );
      
      this.cache.set(symbol, bars);
      this.currentIndex.set(symbol, 0);
      
      console.log(`Loaded ${bars.length} bars for ${symbol}`);
    }
  }

  public async getBars(timestamp: Date): Promise<Bar[]> {
    const bars: Bar[] = [];
    
    for (const symbol of this.config.symbols) {
      const symbolBars = this.cache.get(symbol);
      const index = this.currentIndex.get(symbol) || 0;
      
      if (symbolBars && index < symbolBars.length) {
        const bar = symbolBars[index];
        
        // Check if bar matches current timestamp
        if (new Date(bar.timestamp.iso).getTime() <= timestamp.getTime()) {
          bars.push(bar);
          this.currentIndex.set(symbol, index + 1);
          this.emit('bar', bar);
        }
      }
    }
    
    return bars;
  }

  public async getTicks(timestamp: Date): Promise<Tick[]> {
    // For tick data support
    if (!this.provider.fetchTicks) {
      return [];
    }
    
    const ticks: Tick[] = [];
    // Implementation for tick data
    return ticks;
  }

  public reset(): void {
    for (const symbol of this.config.symbols) {
      this.currentIndex.set(symbol, 0);
    }
  }
}

// Mock data provider for testing
class MockDataProvider implements DataProvider {
  async fetchBars(
    symbol: string,
    start: Date,
    end: Date,
    timeframe: Timeframe
  ): Promise<Bar[]> {
    const bars: Bar[] = [];
    const current = new Date(start);
    
    // Generate synthetic data
    let price = 100 + Math.random() * 50;
    let volume = 1000000;
    
    while (current <= end) {
      // Random walk with mean reversion
      const change = (Math.random() - 0.5) * 2;
      const meanReversion = (150 - price) * 0.01;
      price = Math.max(1, price + change + meanReversion);
      
      // Add volatility
      const volatility = 0.02;
      const high = price * (1 + volatility * Math.random());
      const low = price * (1 - volatility * Math.random());
      const open = low + (high - low) * Math.random();
      const close = low + (high - low) * Math.random();
      
      // Random volume
      volume = volume * (0.8 + Math.random() * 0.4);
      
      bars.push({
        symbol,
        timestamp: {
          unix: current.getTime(),
          iso: current.toISOString()
        },
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(volume),
        vwap: Number(((high + low + close) / 3).toFixed(2))
      });
      
      // Advance time based on timeframe
      switch (timeframe) {
        case 'MINUTE':
          current.setMinutes(current.getMinutes() + 1);
          break;
        case 'HOUR':
          current.setHours(current.getHours() + 1);
          break;
        case 'DAY':
          current.setDate(current.getDate() + 1);
          // Skip weekends
          if (current.getDay() === 0) current.setDate(current.getDate() + 1);
          if (current.getDay() === 6) current.setDate(current.getDate() + 2);
          break;
      }
    }
    
    return bars;
  }
}

// CSV data provider for loading historical data
class CSVDataProvider implements DataProvider {
  async fetchBars(
    symbol: string,
    start: Date,
    end: Date,
    timeframe: Timeframe
  ): Promise<Bar[]> {
    // TODO: Implement CSV loading
    // For now, fallback to mock data
    return new MockDataProvider().fetchBars(symbol, start, end, timeframe);
  }
}