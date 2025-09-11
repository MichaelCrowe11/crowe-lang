// CroweLang Market Data Types and Interfaces
// Core data structures for trading and market data

export interface Timestamp {
  unix: number;           // Unix timestamp in milliseconds
  iso: string;           // ISO 8601 string
  exchange_time?: string; // Exchange local time
}

// ============= Basic Market Data =============

export interface Bar {
  symbol: string;
  timestamp: Timestamp;
  timeframe: Timeframe;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades?: number;        // Number of trades
  vwap?: number;         // Volume weighted average price
  turnover?: number;     // Total dollar volume
}

export interface Tick {
  symbol: string;
  timestamp: Timestamp;
  price: number;
  size: number;
  side: Side;
  conditions?: string[]; // Trade conditions
  exchange?: string;     // Exchange identifier
  tape?: string;         // Consolidated tape
}

export interface Quote {
  symbol: string;
  timestamp: Timestamp;
  bid_price: number;
  bid_size: number;
  ask_price: number;
  ask_size: number;
  bid_exchange?: string;
  ask_exchange?: string;
}

export interface OrderBook {
  symbol: string;
  timestamp: Timestamp;
  bids: Level[];
  asks: Level[];
  spread?: number;       // Calculated spread
  mid_price?: number;    // Mid price
  imbalance?: number;    // Order imbalance ratio
}

export interface Level {
  price: number;
  size: number;
  orders?: number;       // Number of orders at this level
  exchange?: string;     // Exchange for this level
}

// ============= Enums =============

export enum Side {
  BUY = 'BUY',
  SELL = 'SELL',
  SHORT = 'SHORT',
  COVER = 'COVER'
}

export enum Timeframe {
  TICK = 'TICK',
  SECOND = '1S',
  MINUTE = '1T',
  MINUTE_5 = '5T',
  MINUTE_15 = '15T',
  MINUTE_30 = '30T',
  HOUR = '1H',
  HOUR_4 = '4H',
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M'
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT',
  TRAILING_STOP = 'TRAILING_STOP',
  FILL_OR_KILL = 'FOK',
  IMMEDIATE_OR_CANCEL = 'IOC',
  GOOD_TILL_CANCELED = 'GTC',
  GOOD_TILL_DATE = 'GTD',
  DAY = 'DAY'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  PARTIAL_FILL = 'PARTIAL_FILL',
  FILLED = 'FILLED',
  CANCELED = 'CANCELED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum AssetClass {
  EQUITY = 'EQUITY',
  OPTION = 'OPTION',
  FUTURE = 'FUTURE',
  FOREX = 'FOREX',
  CRYPTO = 'CRYPTO',
  BOND = 'BOND',
  COMMODITY = 'COMMODITY'
}

// ============= Orders & Execution =============

export interface Order {
  id: string;
  client_order_id: string;
  symbol: string;
  side: Side;
  type: OrderType;
  quantity: number;
  price?: number;        // Not required for market orders
  stop_price?: number;   // For stop orders
  time_in_force: OrderType;
  status: OrderStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
  filled_quantity: number;
  avg_fill_price?: number;
  commission?: number;
  fees?: number;
  tags?: Record<string, any>; // Custom tags
}

export interface Fill {
  id: string;
  order_id: string;
  symbol: string;
  side: Side;
  quantity: number;
  price: number;
  timestamp: Timestamp;
  commission?: number;
  fees?: number;
  exchange?: string;
  liquidity?: 'MAKER' | 'TAKER';
}

export interface Position {
  symbol: string;
  quantity: number;       // Positive = long, negative = short
  avg_cost: number;      // Average cost basis
  unrealized_pnl: number;
  realized_pnl: number;
  market_value: number;
  last_price: number;
  updated_at: Timestamp;
  side: 'LONG' | 'SHORT' | 'FLAT';
}

// ============= Portfolio & Risk =============

export interface Portfolio {
  account_id: string;
  positions: Map<string, Position>;
  cash: number;
  equity: number;
  buying_power: number;
  margin_used: number;
  day_trading_buying_power?: number;
  regt_buying_power?: number;
  daytrading_buying_power?: number;
  updated_at: Timestamp;
}

export interface RiskMetrics {
  portfolio_value: number;
  total_pnl: number;
  daily_pnl: number;
  max_drawdown: number;
  var_1d: number;        // 1-day Value at Risk
  var_10d: number;       // 10-day Value at Risk
  beta: number;          // Portfolio beta
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  volatility: number;    // Annualized volatility
}

// ============= Market Data Sources =============

export interface DataSource {
  name: string;
  type: 'REAL_TIME' | 'DELAYED' | 'HISTORICAL';
  assets: AssetClass[];
  timeframes: Timeframe[];
  endpoints: {
    bars?: string;
    ticks?: string;
    quotes?: string;
    orderbook?: string;
  };
}

export interface MarketDataConfig {
  source: DataSource;
  symbols: string[];
  timeframes: Timeframe[];
  start_date?: string;
  end_date?: string;
  include_pre_post?: boolean;
  adjust_splits?: boolean;
  adjust_dividends?: boolean;
}

// ============= Indicators & Signals =============

export interface IndicatorValue {
  timestamp: Timestamp;
  value: number | number[] | Record<string, number>;
  symbol?: string;
}

export interface Signal {
  name: string;
  timestamp: Timestamp;
  symbol: string;
  value: boolean | number;
  strength?: number;     // Signal strength 0-1
  confidence?: number;   // Signal confidence 0-1
  metadata?: Record<string, any>;
}

// ============= Backtesting =============

export interface BacktestConfig {
  start_date: string;
  end_date: string;
  initial_capital: number;
  data_source: string;
  symbols: string[];
  timeframe: Timeframe;
  commission: number;
  slippage: number;
  margin_rate?: number;
  short_rate?: number;
  min_commission?: number;
  market_impact?: MarketImpactModel;
}

export interface MarketImpactModel {
  type: 'LINEAR' | 'SQUARE_ROOT' | 'CONSTANT';
  coefficient: number;
  max_impact?: number;
}

export interface BacktestResults {
  total_return: number;
  annual_return: number;
  volatility: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  calmar_ratio: number;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  avg_trade: number;
  avg_win: number;
  avg_loss: number;
  largest_win: number;
  largest_loss: number;
  equity_curve: EquityCurvePoint[];
  trade_log: TradeRecord[];
  monthly_returns: MonthlyReturn[];
}

export interface EquityCurvePoint {
  timestamp: Timestamp;
  equity: number;
  drawdown: number;
  positions: number;
}

export interface TradeRecord {
  entry_time: Timestamp;
  exit_time: Timestamp;
  symbol: string;
  side: Side;
  quantity: number;
  entry_price: number;
  exit_price: number;
  pnl: number;
  return_pct: number;
  commission: number;
  duration: number;      // Trade duration in seconds
  mae: number;          // Maximum adverse excursion
  mfe: number;          // Maximum favorable excursion
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return_pct: number;
  equity_start: number;
  equity_end: number;
}

// ============= Live Trading =============

export interface BrokerConnection {
  name: string;
  type: 'PAPER' | 'LIVE';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  account: string;
  supported_assets: AssetClass[];
  supported_orders: OrderType[];
  latency?: number;      // Average latency in ms
}

export interface ExecutionReport {
  order_id: string;
  status: OrderStatus;
  filled_quantity: number;
  remaining_quantity: number;
  avg_fill_price?: number;
  last_fill_price?: number;
  last_fill_quantity?: number;
  timestamp: Timestamp;
  text?: string;         // Execution message
  commission?: number;
  fees?: number;
}

// ============= Alternative Data =============

export interface NewsItem {
  id: string;
  headline: string;
  summary?: string;
  content?: string;
  author?: string;
  source: string;
  symbols: string[];
  timestamp: Timestamp;
  sentiment?: number;    // -1 to 1
  relevance?: number;    // 0 to 1
  url?: string;
}

export interface EconomicEvent {
  id: string;
  name: string;
  country: string;
  currency: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH';
  actual?: number;
  forecast?: number;
  previous?: number;
  timestamp: Timestamp;
  unit?: string;
}

export interface SocialSentiment {
  symbol: string;
  timestamp: Timestamp;
  sentiment: number;     // -1 to 1
  volume: number;        // Number of mentions
  source: string;        // Twitter, Reddit, etc.
  confidence: number;    // 0 to 1
}

// ============= Market Microstructure =============

export interface MarketMicrostructure {
  symbol: string;
  timestamp: Timestamp;
  spread: number;
  effective_spread: number;
  realized_spread: number;
  price_impact: number;
  volatility: number;
  order_imbalance: number;
  trade_size_ratio: number;  // Large trade ratio
  quote_slope: number;       // Book slope
}

export interface LiquidityMetrics {
  symbol: string;
  timestamp: Timestamp;
  bid_depth: number;
  ask_depth: number;
  total_depth: number;
  weighted_spread: number;
  price_impact_1pct: number; // Price impact of 1% ADV
  amihud_illiquidity: number;
  roll_spread: number;
}

// ============= Risk Management =============

export interface RiskLimit {
  name: string;
  type: 'POSITION' | 'NOTIONAL' | 'LOSS' | 'VAR' | 'CONCENTRATION' | 'CORRELATION';
  limit: number;
  current: number;
  utilization: number;   // 0 to 1
  warning_threshold: number; // Warning at this utilization
  breach_time?: Timestamp;
  status: 'OK' | 'WARNING' | 'BREACH';
}

export interface RiskReport {
  portfolio_id: string;
  timestamp: Timestamp;
  limits: RiskLimit[];
  metrics: RiskMetrics;
  stress_tests?: StressTestResult[];
  warnings: string[];
  breaches: string[];
}

export interface StressTestResult {
  scenario: string;
  portfolio_shock: number;
  max_loss: number;
  worst_position: string;
  correlation_increase: number;
}

// ============= Helper Types =============

export type PriceData = {
  [symbol: string]: {
    [timeframe in Timeframe]?: Bar[];
  };
};

export type MarketDataFeed = {
  bars: (symbols: string[], timeframe: Timeframe) => AsyncIterableIterator<Bar>;
  ticks: (symbols: string[]) => AsyncIterableIterator<Tick>;
  quotes: (symbols: string[]) => AsyncIterableIterator<Quote>;
  orderbook: (symbols: string[], depth?: number) => AsyncIterableIterator<OrderBook>;
};

export type StrategyPerformance = {
  returns: number[];
  positions: Position[];
  trades: TradeRecord[];
  drawdowns: number[];
  metrics: RiskMetrics;
};