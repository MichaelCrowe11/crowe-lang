// Risk management system for monitoring and enforcing risk limits
import { EventEmitter } from 'events';
import { Portfolio, Position, BacktestConfig, RiskMetrics } from './types';
import Decimal from 'decimal.js';

export interface RiskLimits {
  max_position_size?: number;
  max_portfolio_risk?: number;
  max_drawdown?: number;
  max_leverage?: number;
  max_concentration?: number;
  daily_loss_limit?: number;
  var_limit?: number;
}

export interface RiskCheckResult {
  passed: boolean;
  violations: string[];
  metrics: RiskMetrics;
}

export class RiskManager extends EventEmitter {
  private config: BacktestConfig;
  private limits: RiskLimits;
  private dailyPnl: number = 0;
  private peakEquity: number = 0;
  private returns: number[] = [];
  private startOfDayEquity: number = 0;

  constructor(config: BacktestConfig) {
    super();
    this.config = config;
    this.limits = this.getDefaultLimits();
    this.peakEquity = config.initial_capital;
    this.startOfDayEquity = config.initial_capital;
  }

  private getDefaultLimits(): RiskLimits {
    return {
      max_position_size: 0.25,     // 25% of portfolio
      max_portfolio_risk: 0.10,    // 10% portfolio risk
      max_drawdown: 0.20,          // 20% max drawdown
      max_leverage: 2.0,           // 2x leverage
      max_concentration: 0.40,     // 40% in single position
      daily_loss_limit: 0.05,      // 5% daily loss
      var_limit: 0.03             // 3% VaR
    };
  }

  public setLimits(limits: Partial<RiskLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }

  public async checkLimits(portfolio: Portfolio): Promise<RiskCheckResult> {
    const violations: string[] = [];
    const metrics = this.calculateMetrics(portfolio);
    
    // Check position size limit
    for (const [symbol, position] of portfolio.positions) {
      const positionValue = Math.abs(position.market_value);
      const positionRatio = positionValue / portfolio.equity;
      
      if (this.limits.max_position_size && positionRatio > this.limits.max_position_size) {
        violations.push(`Position size violation: ${symbol} is ${(positionRatio * 100).toFixed(1)}% of portfolio`);
      }
    }
    
    // Check concentration limit
    const largestPosition = Math.max(
      ...Array.from(portfolio.positions.values()).map(p => Math.abs(p.market_value))
    );
    const concentration = largestPosition / portfolio.equity;
    
    if (this.limits.max_concentration && concentration > this.limits.max_concentration) {
      violations.push(`Concentration violation: Largest position is ${(concentration * 100).toFixed(1)}% of portfolio`);
    }
    
    // Check leverage
    const totalExposure = Array.from(portfolio.positions.values())
      .reduce((sum, p) => sum + Math.abs(p.market_value), 0);
    const leverage = totalExposure / portfolio.equity;
    
    if (this.limits.max_leverage && leverage > this.limits.max_leverage) {
      violations.push(`Leverage violation: Current leverage is ${leverage.toFixed(2)}x`);
    }
    
    // Check drawdown
    if (portfolio.equity > this.peakEquity) {
      this.peakEquity = portfolio.equity;
    }
    const drawdown = (this.peakEquity - portfolio.equity) / this.peakEquity;
    
    if (this.limits.max_drawdown && drawdown > this.limits.max_drawdown) {
      violations.push(`Drawdown violation: Current drawdown is ${(drawdown * 100).toFixed(1)}%`);
    }
    
    // Check daily loss limit
    const dailyLoss = (this.startOfDayEquity - portfolio.equity) / this.startOfDayEquity;
    
    if (this.limits.daily_loss_limit && dailyLoss > this.limits.daily_loss_limit) {
      violations.push(`Daily loss violation: Lost ${(dailyLoss * 100).toFixed(1)}% today`);
    }
    
    // Check VaR limit
    if (this.limits.var_limit && metrics.var_1d > this.limits.var_limit * portfolio.equity) {
      violations.push(`VaR violation: 1-day VaR of $${metrics.var_1d.toFixed(0)} exceeds limit`);
    }
    
    // Emit risk breach if violations found
    if (violations.length > 0) {
      this.emit('risk_breach', violations.join(', '), metrics);
    }
    
    return {
      passed: violations.length === 0,
      violations,
      metrics
    };
  }

  public calculateMetrics(portfolio: Portfolio): RiskMetrics {
    const totalPnl = Array.from(portfolio.positions.values())
      .reduce((sum, p) => sum + p.realized_pnl + p.unrealized_pnl, 0);
    
    this.dailyPnl = portfolio.equity - this.startOfDayEquity;
    
    // Calculate returns for risk metrics
    if (this.returns.length > 0) {
      const lastEquity = portfolio.equity - this.dailyPnl;
      const dailyReturn = this.dailyPnl / lastEquity;
      this.returns.push(dailyReturn);
    }
    
    // Keep only last 252 trading days
    if (this.returns.length > 252) {
      this.returns = this.returns.slice(-252);
    }
    
    // Calculate volatility (annualized)
    const volatility = this.calculateVolatility(this.returns);
    
    // Calculate Sharpe ratio
    const avgReturn = this.returns.reduce((sum, r) => sum + r, 0) / this.returns.length;
    const annualizedReturn = avgReturn * 252;
    const sharpeRatio = volatility > 0 ? annualizedReturn / volatility : 0;
    
    // Calculate VaR (95% confidence)
    const var1d = this.calculateVaR(portfolio.equity, this.returns, 0.95, 1);
    const var10d = this.calculateVaR(portfolio.equity, this.returns, 0.95, 10);
    
    // Calculate max drawdown
    const maxDrawdown = (this.peakEquity - portfolio.equity) / this.peakEquity;
    
    return {
      portfolio_value: portfolio.equity,
      total_pnl: totalPnl,
      daily_pnl: this.dailyPnl,
      max_drawdown: maxDrawdown,
      var_1d: var1d,
      var_10d: var10d,
      sharpe_ratio: sharpeRatio,
      volatility: volatility
    };
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / (returns.length - 1);
    
    // Annualized volatility
    return Math.sqrt(variance * 252);
  }

  private calculateVaR(
    portfolioValue: number,
    returns: number[],
    confidence: number,
    days: number
  ): number {
    if (returns.length < 20) return 0;
    
    // Sort returns
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    // Find percentile
    const percentileIndex = Math.floor((1 - confidence) * sortedReturns.length);
    const percentileReturn = sortedReturns[percentileIndex];
    
    // Scale to N days
    const scaledReturn = percentileReturn * Math.sqrt(days);
    
    // Convert to dollar value
    return Math.abs(scaledReturn * portfolioValue);
  }

  public updateMetrics(portfolio: Portfolio): void {
    // Store metrics for historical analysis
    const metrics = this.calculateMetrics(portfolio);
    
    // Emit metrics update
    this.emit('metrics_update', metrics);
  }

  public resetDaily(): void {
    this.dailyPnl = 0;
    this.startOfDayEquity = this.peakEquity; // Or current equity
  }

  public getMetrics(): RiskMetrics {
    return {
      portfolio_value: 0,
      total_pnl: 0,
      daily_pnl: this.dailyPnl,
      max_drawdown: 0,
      var_1d: 0,
      var_10d: 0,
      sharpe_ratio: 0,
      volatility: this.calculateVolatility(this.returns)
    };
  }
}