// Performance analysis and metrics calculation
import { 
  BacktestResults, EquityCurvePoint, TradeRecord, 
  MonthlyReturn, BacktestConfig 
} from './types';
import Decimal from 'decimal.js';

export class PerformanceAnalyzer {
  public calculateResults(
    equityCurve: EquityCurvePoint[],
    trades: TradeRecord[],
    config: BacktestConfig
  ): BacktestResults {
    if (equityCurve.length === 0) {
      return this.getEmptyResults();
    }

    const initialCapital = config.initial_capital;
    const finalEquity = equityCurve[equityCurve.length - 1].equity;
    
    // Calculate returns
    const totalReturn = (finalEquity - initialCapital) / initialCapital;
    const tradingDays = equityCurve.length;
    const years = tradingDays / 252;
    const annualReturn = years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0;
    
    // Calculate daily returns
    const dailyReturns = this.calculateDailyReturns(equityCurve);
    
    // Calculate volatility
    const volatility = this.calculateAnnualizedVolatility(dailyReturns);
    
    // Calculate Sharpe ratio (assuming 0% risk-free rate)
    const sharpeRatio = volatility > 0 ? annualReturn / volatility : 0;
    
    // Calculate Sortino ratio
    const sortinoRatio = this.calculateSortinoRatio(dailyReturns, annualReturn);
    
    // Calculate max drawdown
    const maxDrawdown = this.calculateMaxDrawdown(equityCurve);
    
    // Calculate Calmar ratio
    const calmarRatio = maxDrawdown > 0 ? annualReturn / maxDrawdown : 0;
    
    // Trade statistics
    const tradeStats = this.calculateTradeStatistics(trades);
    
    // Monthly returns
    const monthlyReturns = this.calculateMonthlyReturns(equityCurve);
    
    return {
      total_return: totalReturn,
      annual_return: annualReturn,
      volatility,
      sharpe_ratio: sharpeRatio,
      sortino_ratio: sortinoRatio,
      max_drawdown: maxDrawdown,
      calmar_ratio: calmarRatio,
      win_rate: tradeStats.winRate,
      profit_factor: tradeStats.profitFactor,
      total_trades: trades.length,
      avg_trade: tradeStats.avgTrade,
      avg_win: tradeStats.avgWin,
      avg_loss: tradeStats.avgLoss,
      largest_win: tradeStats.largestWin,
      largest_loss: tradeStats.largestLoss,
      equity_curve: equityCurve,
      trade_log: trades,
      monthly_returns: monthlyReturns
    };
  }

  private calculateDailyReturns(equityCurve: EquityCurvePoint[]): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < equityCurve.length; i++) {
      const prevEquity = equityCurve[i - 1].equity;
      const currEquity = equityCurve[i].equity;
      const dailyReturn = (currEquity - prevEquity) / prevEquity;
      returns.push(dailyReturn);
    }
    
    return returns;
  }

  private calculateAnnualizedVolatility(dailyReturns: number[]): number {
    if (dailyReturns.length < 2) return 0;
    
    const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const squaredDiffs = dailyReturns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / (dailyReturns.length - 1);
    const dailyVolatility = Math.sqrt(variance);
    
    // Annualize (assuming 252 trading days)
    return dailyVolatility * Math.sqrt(252);
  }

  private calculateSortinoRatio(dailyReturns: number[], annualReturn: number): number {
    // Calculate downside deviation
    const negativeReturns = dailyReturns.filter(r => r < 0);
    
    if (negativeReturns.length === 0) return 0;
    
    const squaredNegatives = negativeReturns.map(r => r * r);
    const downsideVariance = squaredNegatives.reduce((sum, s) => sum + s, 0) / negativeReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252);
    
    return downsideDeviation > 0 ? annualReturn / downsideDeviation : 0;
  }

  private calculateMaxDrawdown(equityCurve: EquityCurvePoint[]): number {
    let maxDrawdown = 0;
    let peak = equityCurve[0].equity;
    
    for (const point of equityCurve) {
      if (point.equity > peak) {
        peak = point.equity;
      }
      
      const drawdown = (peak - point.equity) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  private calculateTradeStatistics(trades: TradeRecord[]): {
    winRate: number;
    profitFactor: number;
    avgTrade: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
  } {
    if (trades.length === 0) {
      return {
        winRate: 0,
        profitFactor: 0,
        avgTrade: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0
      };
    }
    
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const winRate = winningTrades.length / trades.length;
    
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const avgTrade = totalPnl / trades.length;
    
    const avgWin = winningTrades.length > 0 ? 
      grossProfit / winningTrades.length : 0;
    
    const avgLoss = losingTrades.length > 0 ? 
      grossLoss / losingTrades.length : 0;
    
    const largestWin = winningTrades.length > 0 ? 
      Math.max(...winningTrades.map(t => t.pnl)) : 0;
    
    const largestLoss = losingTrades.length > 0 ? 
      Math.min(...losingTrades.map(t => t.pnl)) : 0;
    
    return {
      winRate,
      profitFactor,
      avgTrade,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss
    };
  }

  private calculateMonthlyReturns(equityCurve: EquityCurvePoint[]): MonthlyReturn[] {
    const monthlyReturns: MonthlyReturn[] = [];
    
    if (equityCurve.length === 0) return monthlyReturns;
    
    let currentMonth = new Date(equityCurve[0].timestamp.iso).getMonth();
    let currentYear = new Date(equityCurve[0].timestamp.iso).getFullYear();
    let monthStartEquity = equityCurve[0].equity;
    let monthEndEquity = equityCurve[0].equity;
    
    for (const point of equityCurve) {
      const date = new Date(point.timestamp.iso);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      if (month !== currentMonth || year !== currentYear) {
        // New month - record previous month's return
        const monthReturn = (monthEndEquity - monthStartEquity) / monthStartEquity;
        
        monthlyReturns.push({
          year: currentYear,
          month: currentMonth + 1, // 1-indexed
          return_pct: monthReturn,
          equity_start: monthStartEquity,
          equity_end: monthEndEquity
        });
        
        // Start new month
        currentMonth = month;
        currentYear = year;
        monthStartEquity = monthEndEquity;
      }
      
      monthEndEquity = point.equity;
    }
    
    // Add final month
    const finalReturn = (monthEndEquity - monthStartEquity) / monthStartEquity;
    monthlyReturns.push({
      year: currentYear,
      month: currentMonth + 1,
      return_pct: finalReturn,
      equity_start: monthStartEquity,
      equity_end: monthEndEquity
    });
    
    return monthlyReturns;
  }

  private getEmptyResults(): BacktestResults {
    return {
      total_return: 0,
      annual_return: 0,
      volatility: 0,
      sharpe_ratio: 0,
      sortino_ratio: 0,
      max_drawdown: 0,
      calmar_ratio: 0,
      win_rate: 0,
      profit_factor: 0,
      total_trades: 0,
      avg_trade: 0,
      avg_win: 0,
      avg_loss: 0,
      largest_win: 0,
      largest_loss: 0,
      equity_curve: [],
      trade_log: [],
      monthly_returns: []
    };
  }

  public updateMetrics(portfolio: any, timestamp: Date): void {
    // Real-time metric updates during backtesting
    // Can be used for live monitoring
  }
}