// Integration test for the full CroweLang pipeline
import { BacktestEngine, BaseStrategy } from '@crowelang/runtime';
import { MeanReversionStrategy } from '../examples/example-strategy';

describe('CroweLang Integration Tests', () => {
  describe('End-to-end backtest', () => {
    it('should run a complete backtest with mock data', async () => {
      // Create backtest engine
      const engine = new BacktestEngine({
        start_date: '2023-01-01',
        end_date: '2023-01-31',
        initial_capital: 100000,
        data_source: 'mock',
        symbols: ['TEST'],
        timeframe: 'DAY',
        commission: 0.001,
        slippage: 0.0005
      });

      // Create and add strategy
      const strategy = new MeanReversionStrategy({
        name: 'TestMeanReversion',
        symbols: ['TEST'],
        params: {
          lookback: 10,
          zscoreEntry: 2.0,
          zscoreExit: 0.5,
          positionSize: 0.1
        }
      });

      engine.addStrategy('mean_reversion', strategy);

      // Run backtest
      const results = await engine.run();

      // Validate results structure
      expect(results).toBeDefined();
      expect(results.total_return).toBeDefined();
      expect(results.sharpe_ratio).toBeDefined();
      expect(results.max_drawdown).toBeDefined();
      expect(results.total_trades).toBeGreaterThanOrEqual(0);
      expect(results.equity_curve).toBeInstanceOf(Array);
      expect(results.trade_log).toBeInstanceOf(Array);
    });

    it('should handle multiple strategies', async () => {
      const engine = new BacktestEngine({
        start_date: '2023-01-01',
        end_date: '2023-01-31',
        initial_capital: 100000,
        data_source: 'mock',
        symbols: ['AAPL', 'GOOGL'],
        timeframe: 'DAY',
        commission: 0.001,
        slippage: 0.0005
      });

      // Add multiple strategies
      const strategy1 = new MeanReversionStrategy({
        name: 'MeanRev_AAPL',
        symbols: ['AAPL'],
        params: { lookback: 20, zscoreEntry: 2.0 }
      });

      const strategy2 = new MeanReversionStrategy({
        name: 'MeanRev_GOOGL',
        symbols: ['GOOGL'],
        params: { lookback: 15, zscoreEntry: 1.5 }
      });

      engine.addStrategy('strategy1', strategy1);
      engine.addStrategy('strategy2', strategy2);

      const results = await engine.run();

      expect(results).toBeDefined();
      expect(results.equity_curve.length).toBeGreaterThan(0);
    });

    it('should enforce risk limits', async () => {
      const engine = new BacktestEngine({
        start_date: '2023-01-01',
        end_date: '2023-01-31',
        initial_capital: 100000,
        data_source: 'mock',
        symbols: ['TEST'],
        timeframe: 'DAY',
        commission: 0.001,
        slippage: 0.0005,
        halt_on_risk_breach: true
      });

      // Strategy with high risk
      const strategy = new MeanReversionStrategy({
        name: 'HighRisk',
        symbols: ['TEST'],
        params: {
          positionSize: 0.5  // 50% position size (risky)
        }
      });

      engine.addStrategy('high_risk', strategy);
      
      // Set strict risk limits
      const riskManager = (engine as any).riskManager;
      riskManager.setLimits({
        max_position_size: 0.3,  // Max 30% per position
        max_drawdown: 0.1        // Max 10% drawdown
      });

      const results = await engine.run();

      // Should have risk breaches
      expect(results).toBeDefined();
      // Position size should be limited by risk manager
      expect(results.max_drawdown).toBeLessThanOrEqual(0.3);
    });
  });

  describe('Performance metrics calculation', () => {
    it('should calculate Sharpe ratio correctly', () => {
      const equityCurve = [
        { timestamp: { unix: 0, iso: '2023-01-01' }, equity: 100000, drawdown: 0, positions: 0 },
        { timestamp: { unix: 1, iso: '2023-01-02' }, equity: 101000, drawdown: 0, positions: 1 },
        { timestamp: { unix: 2, iso: '2023-01-03' }, equity: 102500, drawdown: 0, positions: 1 },
        { timestamp: { unix: 3, iso: '2023-01-04' }, equity: 101500, drawdown: 0.0098, positions: 1 },
        { timestamp: { unix: 4, iso: '2023-01-05' }, equity: 103000, drawdown: 0, positions: 0 }
      ];

      const trades = [
        {
          entry_time: new Date('2023-01-02'),
          exit_time: new Date('2023-01-05'),
          symbol: 'TEST',
          side: 'LONG' as const,
          quantity: 100,
          entry_price: 100,
          exit_price: 103,
          pnl: 300,
          return_pct: 0.03,
          commission: 20,
          duration: 259200,
          mae: -100,
          mfe: 250
        }
      ];

      const analyzer = new (require('@crowelang/runtime').PerformanceAnalyzer)();
      const results = analyzer.calculateResults(equityCurve, trades, {
        initial_capital: 100000,
        start_date: '2023-01-01',
        end_date: '2023-01-05'
      });

      expect(results.total_return).toBeCloseTo(0.03, 2);
      expect(results.win_rate).toBe(1);
      expect(results.total_trades).toBe(1);
      expect(results.sharpe_ratio).toBeGreaterThan(0);
    });
  });
});