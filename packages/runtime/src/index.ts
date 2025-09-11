// CroweLang Runtime - Main exports
export { BacktestEngine } from './backtest-engine';
export { BaseStrategy, StrategyConfig } from './base-strategy';
export { DataFeed, DataProvider } from './data-feed';
export { OrderManager } from './order-manager';
export { PortfolioManager } from './portfolio-manager';
export { RiskManager, RiskLimits, RiskCheckResult } from './risk-manager';
export { PerformanceAnalyzer } from './performance-analyzer';

// Export all types
export * from './types';

// Export indicators
export * from './indicators';

// Version
export const VERSION = '0.1.0';