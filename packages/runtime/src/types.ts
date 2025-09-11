// Core types for CroweLang runtime
export interface Timestamp {
  unix: number;
  iso: string;
}

export interface Bar {
  symbol: string;
  timestamp: Timestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades?: number;
  vwap?: number;
}

export interface Tick {
  symbol: string;
  timestamp: Timestamp;
  price: number;
  size: number;
  side: Side;
  exchange?: string;
}

export enum Side {
  BUY = 'BUY',
  SELL = 'SELL',
  SHORT = 'SHORT',
  COVER = 'COVER'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  PARTIAL_FILL = 'PARTIAL_FILL',
  FILLED = 'FILLED',
  CANCELED = 'CANCELED',
  REJECTED = 'REJECTED'
}

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type TimeInForce = 'DAY' | 'GTC' | 'IOC' | 'FOK';
export type Timeframe = 'MINUTE' | 'HOUR' | 'DAY';

export interface Order {
  id: string;
  client_order_id: string;
  symbol: string;
  side: Side;
  type: OrderType;
  quantity: number;
  price?: number;
  stop_price?: number;
  time_in_force: TimeInForce;
  status: OrderStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
  filled_quantity: number;
  avg_fill_price?: number;
  commission?: number;
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
  liquidity?: 'MAKER' | 'TAKER';
}

export interface Position {
  symbol: string;
  quantity: number;
  side: 'LONG' | 'SHORT' | 'FLAT';
  avg_entry_price: number;
  avg_exit_price?: number;
  market_value: number;
  unrealized_pnl: number;
  realized_pnl: number;
  total_commission: number;
  opened_at: Date;
  closed_at?: Date;
  max_adverse_excursion?: number;
  max_favorable_excursion?: number;
}

export interface Portfolio {
  account_id: string;
  positions: Map<string, Position>;
  cash: number;
  equity: number;
  buying_power: number;
  margin_used: number;
  updated_at: Timestamp;
}

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
  halt_on_risk_breach?: boolean;
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
  entry_time: Date;
  exit_time: Date;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entry_price: number;
  exit_price: number;
  pnl: number;
  return_pct: number;
  commission: number;
  duration: number;
  mae: number;
  mfe: number;
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return_pct: number;
  equity_start: number;
  equity_end: number;
}

export interface RiskMetrics {
  portfolio_value: number;
  total_pnl: number;
  daily_pnl: number;
  max_drawdown: number;
  var_1d: number;
  var_10d: number;
  sharpe_ratio: number;
  volatility: number;
}