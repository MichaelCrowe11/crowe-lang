// CroweLang Backtest Engine - Core execution runtime
import { EventEmitter } from 'events';
import { 
  Bar, Tick, Order, Fill, Position, Portfolio,
  BacktestConfig, BacktestResults, TradeRecord,
  EquityCurvePoint, OrderType, OrderStatus, Side
} from './types';
import { DataFeed } from './data-feed';
import { OrderManager } from './order-manager';
import { PortfolioManager } from './portfolio-manager';
import { RiskManager } from './risk-manager';
import { PerformanceAnalyzer } from './performance-analyzer';
import { BaseStrategy } from './base-strategy';

export class BacktestEngine extends EventEmitter {
  private config: BacktestConfig;
  private dataFeed: DataFeed;
  private orderManager: OrderManager;
  private portfolioManager: PortfolioManager;
  private riskManager: RiskManager;
  private performanceAnalyzer: PerformanceAnalyzer;
  private strategies: Map<string, BaseStrategy> = new Map();
  
  private currentTime: Date;
  private equityCurve: EquityCurvePoint[] = [];
  private tradeLog: TradeRecord[] = [];
  private isRunning: boolean = false;

  constructor(config: BacktestConfig) {
    super();
    this.config = config;
    this.currentTime = new Date(config.start_date);
    
    // Initialize components
    this.dataFeed = new DataFeed(config);
    this.orderManager = new OrderManager(this);
    this.portfolioManager = new PortfolioManager(config.initial_capital);
    this.riskManager = new RiskManager(config);
    this.performanceAnalyzer = new PerformanceAnalyzer();
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Order events
    this.orderManager.on('fill', (fill: Fill) => this.onFill(fill));
    this.orderManager.on('reject', (order: Order, reason: string) => 
      this.onReject(order, reason));
    
    // Risk events
    this.riskManager.on('risk_breach', (limit: string, value: number) => 
      this.onRiskBreach(limit, value));
    
    // Data events
    this.dataFeed.on('bar', (bar: Bar) => this.onBar(bar));
    this.dataFeed.on('tick', (tick: Tick) => this.onTick(tick));
  }

  public addStrategy(name: string, strategy: BaseStrategy): void {
    strategy.initialize(this);
    this.strategies.set(name, strategy);
  }

  public async run(): Promise<BacktestResults> {
    console.log(`Starting backtest from ${this.config.start_date} to ${this.config.end_date}`);
    this.isRunning = true;
    
    // Initialize strategies
    for (const [name, strategy] of this.strategies) {
      await strategy.onStart();
    }
    
    // Main backtest loop
    await this.dataFeed.initialize();
    
    while (this.currentTime <= new Date(this.config.end_date) && this.isRunning) {
      // Fetch data for current timestamp
      const bars = await this.dataFeed.getBars(this.currentTime);
      
      for (const bar of bars) {
        await this.processBar(bar);
      }
      
      // Update portfolio metrics
      this.updatePortfolioMetrics();
      
      // Record equity curve point
      this.recordEquityPoint();
      
      // Advance time
      this.currentTime = this.getNextTimestamp();
    }
    
    // Finalize strategies
    for (const [name, strategy] of this.strategies) {
      await strategy.onStop();
    }
    
    // Calculate final metrics
    return this.performanceAnalyzer.calculateResults(
      this.equityCurve,
      this.tradeLog,
      this.config
    );
  }

  private async processBar(bar: Bar): Promise<void> {
    // Update portfolio with latest prices
    this.portfolioManager.updatePrice(bar.symbol, bar.close);
    
    // Check risk limits
    const riskCheck = await this.riskManager.checkLimits(
      this.portfolioManager.getPortfolio()
    );
    
    if (!riskCheck.passed) {
      this.emit('risk_violation', riskCheck.violations);
      // Potentially halt trading or reduce positions
    }
    
    // Process bar in each strategy
    for (const [name, strategy] of this.strategies) {
      try {
        await strategy.onBar(bar);
      } catch (error) {
        console.error(`Strategy ${name} error:`, error);
        this.emit('strategy_error', { strategy: name, error });
      }
    }
    
    // Process pending orders
    await this.orderManager.processOrders(bar);
  }

  private async onBar(bar: Bar): Promise<void> {
    this.emit('bar', bar);
    
    // Update indicators
    for (const [name, strategy] of this.strategies) {
      strategy.updateIndicators(bar);
    }
  }

  private async onTick(tick: Tick): Promise<void> {
    this.emit('tick', tick);
    
    // High-frequency strategies can react to ticks
    for (const [name, strategy] of this.strategies) {
      if (strategy.config.use_ticks) {
        await strategy.onTick(tick);
      }
    }
  }

  private onFill(fill: Fill): void {
    // Update portfolio
    this.portfolioManager.processFill(fill);
    
    // Record trade
    const trade = this.createTradeRecord(fill);
    if (trade) {
      this.tradeLog.push(trade);
    }
    
    // Notify strategies
    for (const [name, strategy] of this.strategies) {
      strategy.onFill(fill);
    }
    
    this.emit('fill', fill);
  }

  private onReject(order: Order, reason: string): void {
    console.warn(`Order rejected: ${reason}`, order);
    
    // Notify strategies
    for (const [name, strategy] of this.strategies) {
      strategy.onReject(order, reason);
    }
    
    this.emit('reject', { order, reason });
  }

  private onRiskBreach(limit: string, value: number): void {
    console.error(`Risk limit breached: ${limit} = ${value}`);
    
    // Emergency actions
    if (this.config.halt_on_risk_breach) {
      this.stop();
    }
    
    // Notify strategies to reduce risk
    for (const [name, strategy] of this.strategies) {
      strategy.onRiskBreach(limit, value);
    }
  }

  private createTradeRecord(fill: Fill): TradeRecord | null {
    const position = this.portfolioManager.getPosition(fill.symbol);
    if (!position) return null;
    
    // Check if this fill closes a position
    if (position.closed_at) {
      return {
        entry_time: position.opened_at,
        exit_time: position.closed_at,
        symbol: fill.symbol,
        side: position.side as "LONG" | "SHORT",
        quantity: Math.abs(position.quantity),
        entry_price: position.avg_entry_price,
        exit_price: position.avg_exit_price || fill.price,
        pnl: position.realized_pnl,
        return_pct: position.realized_pnl / (position.avg_entry_price * Math.abs(position.quantity)),
        commission: position.total_commission,
        duration: (position.closed_at.getTime() - position.opened_at.getTime()) / 1000,
        mae: position.max_adverse_excursion || 0,
        mfe: position.max_favorable_excursion || 0
      };
    }
    
    return null;
  }

  private updatePortfolioMetrics(): void {
    const portfolio = this.portfolioManager.getPortfolio();
    
    // Update risk metrics
    this.riskManager.updateMetrics(portfolio);
    
    // Update performance metrics
    this.performanceAnalyzer.updateMetrics(portfolio, this.currentTime);
  }

  private recordEquityPoint(): void {
    const portfolio = this.portfolioManager.getPortfolio();
    const equity = portfolio.equity;
    const peak = Math.max(...this.equityCurve.map(p => p.equity), equity);
    const drawdown = (peak - equity) / peak;
    
    this.equityCurve.push({
      timestamp: {
        unix: this.currentTime.getTime(),
        iso: this.currentTime.toISOString()
      },
      equity,
      drawdown,
      positions: portfolio.positions.size
    });
  }

  private getNextTimestamp(): Date {
    const next = new Date(this.currentTime);
    
    switch (this.config.timeframe) {
      case 'MINUTE':
        next.setMinutes(next.getMinutes() + 1);
        break;
      case 'HOUR':
        next.setHours(next.getHours() + 1);
        break;
      case 'DAY':
        next.setDate(next.getDate() + 1);
        break;
      default:
        next.setMinutes(next.getMinutes() + 1);
    }
    
    return next;
  }

  // Public API for strategies
  public buy(symbol: string, quantity: number, orderType: OrderType = 'MARKET', price?: number): string {
    const order: Order = {
      id: this.generateOrderId(),
      client_order_id: `${symbol}_${Date.now()}`,
      symbol,
      side: Side.BUY,
      type: orderType,
      quantity,
      price,
      time_in_force: 'DAY',
      status: OrderStatus.PENDING,
      created_at: {
        unix: this.currentTime.getTime(),
        iso: this.currentTime.toISOString()
      },
      updated_at: {
        unix: this.currentTime.getTime(),
        iso: this.currentTime.toISOString()
      },
      filled_quantity: 0
    };
    
    return this.orderManager.submitOrder(order);
  }

  public sell(symbol: string, quantity: number, orderType: OrderType = 'MARKET', price?: number): string {
    const order: Order = {
      id: this.generateOrderId(),
      client_order_id: `${symbol}_${Date.now()}`,
      symbol,
      side: Side.SELL,
      type: orderType,
      quantity,
      price,
      time_in_force: 'DAY',
      status: OrderStatus.PENDING,
      created_at: {
        unix: this.currentTime.getTime(),
        iso: this.currentTime.toISOString()
      },
      updated_at: {
        unix: this.currentTime.getTime(),
        iso: this.currentTime.toISOString()
      },
      filled_quantity: 0
    };
    
    return this.orderManager.submitOrder(order);
  }

  public short(symbol: string, quantity: number, orderType: OrderType = 'MARKET', price?: number): string {
    const order: Order = {
      id: this.generateOrderId(),
      client_order_id: `${symbol}_${Date.now()}`,
      symbol,
      side: Side.SHORT,
      type: orderType,
      quantity,
      price,
      time_in_force: 'DAY',
      status: OrderStatus.PENDING,
      created_at: {
        unix: this.currentTime.getTime(),
        iso: this.currentTime.toISOString()
      },
      updated_at: {
        unix: this.currentTime.getTime(),
        iso: this.currentTime.toISOString()
      },
      filled_quantity: 0
    };
    
    return this.orderManager.submitOrder(order);
  }

  public cancelOrder(orderId: string): boolean {
    return this.orderManager.cancelOrder(orderId);
  }

  public cancelAllOrders(symbol?: string): number {
    return this.orderManager.cancelAllOrders(symbol);
  }

  public getPosition(symbol: string): Position | null {
    return this.portfolioManager.getPosition(symbol);
  }

  public getPortfolio(): Portfolio {
    return this.portfolioManager.getPortfolio();
  }

  public getCurrentTime(): Date {
    return new Date(this.currentTime);
  }

  public stop(): void {
    this.isRunning = false;
    this.emit('stop');
  }

  private generateOrderId(): string {
    return `ORD_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}