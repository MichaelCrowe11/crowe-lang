// Base strategy class that all strategies inherit from
import { EventEmitter } from 'events';
import { Bar, Tick, Fill, Order, Position, Portfolio } from './types';
import { BacktestEngine } from './backtest-engine';

export interface StrategyConfig {
  name: string;
  symbols: string[];
  use_ticks?: boolean;
  params?: Record<string, any>;
}

export abstract class BaseStrategy extends EventEmitter {
  protected engine!: BacktestEngine;
  public config: StrategyConfig;
  protected indicators: Map<string, any> = new Map();
  protected signals: Map<string, boolean> = new Map();
  protected position: number = 0;
  protected capital: number = 0;

  constructor(config: StrategyConfig) {
    super();
    this.config = config;
  }

  public initialize(engine: BacktestEngine): void {
    this.engine = engine;
    const portfolio = engine.getPortfolio();
    this.capital = portfolio.cash;
  }

  // Lifecycle methods
  public async onStart(): Promise<void> {
    console.log(`Strategy ${this.config.name} started`);
  }

  public async onStop(): Promise<void> {
    console.log(`Strategy ${this.config.name} stopped`);
  }

  // Market data events
  public abstract onBar(bar: Bar): Promise<void>;
  
  public async onTick(tick: Tick): Promise<void> {
    // Override in tick-based strategies
  }

  // Order events
  public onFill(fill: Fill): void {
    if (fill.side === 'BUY' || fill.side === 'COVER') {
      this.position += fill.quantity;
    } else {
      this.position -= fill.quantity;
    }
    
    console.log(`${this.config.name} filled: ${fill.side} ${fill.quantity} ${fill.symbol} @ ${fill.price}`);
  }

  public onReject(order: Order, reason: string): void {
    console.warn(`${this.config.name} order rejected: ${reason}`);
  }

  // Risk events
  public onRiskBreach(limit: string, value: number): void {
    console.warn(`${this.config.name} risk breach: ${limit} = ${value}`);
    // Default behavior: close all positions
    this.closeAllPositions();
  }

  // Indicator management
  public updateIndicators(bar: Bar): void {
    // Override to update custom indicators
  }

  protected setIndicator(name: string, value: any): void {
    this.indicators.set(name, value);
  }

  protected getIndicator(name: string): any {
    return this.indicators.get(name);
  }

  // Signal management
  protected setSignal(name: string, value: boolean): void {
    this.signals.set(name, value);
  }

  protected getSignal(name: string): boolean {
    return this.signals.get(name) || false;
  }

  // Trading actions
  protected buy(symbol: string, quantity: number, price?: number): string {
    return this.engine.buy(symbol, quantity, price ? 'LIMIT' : 'MARKET', price);
  }

  protected sell(symbol: string, quantity: number, price?: number): string {
    return this.engine.sell(symbol, quantity, price ? 'LIMIT' : 'MARKET', price);
  }

  protected short(symbol: string, quantity: number, price?: number): string {
    return this.engine.short(symbol, quantity, price ? 'LIMIT' : 'MARKET', price);
  }

  protected cancelOrder(orderId: string): boolean {
    return this.engine.cancelOrder(orderId);
  }

  protected cancelAllOrders(symbol?: string): number {
    return this.engine.cancelAllOrders(symbol);
  }

  // Position management
  protected getPosition(symbol: string): Position | null {
    return this.engine.getPosition(symbol);
  }

  protected getPortfolio(): Portfolio {
    return this.engine.getPortfolio();
  }

  protected closePosition(symbol: string): void {
    const position = this.getPosition(symbol);
    if (!position || position.quantity === 0) return;
    
    if (position.quantity > 0) {
      this.sell(symbol, position.quantity);
    } else {
      this.buy(symbol, Math.abs(position.quantity));
    }
  }

  protected closeAllPositions(): void {
    const portfolio = this.getPortfolio();
    for (const [symbol, position] of portfolio.positions) {
      if (position.quantity !== 0) {
        this.closePosition(symbol);
      }
    }
  }

  // Utility methods
  protected calculatePositionSize(riskAmount: number, stopLoss: number): number {
    // Position size = Risk Amount / Stop Loss
    return Math.floor(riskAmount / stopLoss);
  }

  protected getCurrentTime(): Date {
    return this.engine.getCurrentTime();
  }
}