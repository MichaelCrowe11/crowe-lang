// Simple backtesting example using the CroweLang runtime
// This demonstrates how to run a basic strategy backtest

import { BacktestEngine } from '../packages/runtime/src/backtest-engine';
import { BacktestConfig } from '../packages/runtime/src/types';
import { createMomentumReversalStrategy } from './compiled-strategy-example';

// Generate mock market data for backtesting
function generateMockData(symbol: string, days: number = 252) {
  const data = [];
  let price = 100;
  const startDate = new Date('2023-01-01');
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // Simple random walk with trend
    const dailyReturn = (Math.random() - 0.48) * 0.02; // Slight upward bias
    price *= (1 + dailyReturn);
    
    const volatility = 0.01 + Math.random() * 0.02;
    const open = price * (1 + (Math.random() - 0.5) * volatility * 0.5);
    const high = Math.max(open, price) * (1 + Math.random() * volatility);
    const low = Math.min(open, price) * (1 - Math.random() * volatility);
    const volume = Math.floor(1000000 * (0.5 + Math.random()));
    
    data.push({
      timestamp: date.getTime(),
      symbol,
      open,
      high,
      low,
      close: price,
      volume
    });
  }
  
  return data;
}

// Main backtest execution
async function runSimpleBacktest() {
  console.log('🚀 Starting Simple Backtest Example\n');
  
  // Create backtest configuration
  const config: BacktestConfig = {
    start_date: '2023-01-01',
    end_date: '2023-12-31',
    initial_capital: 50000,
    timeframe: 'DAY',
    commission: 0.005, // 0.5% commission
    slippage: 0.001,   // 0.1% slippage
    halt_on_risk_breach: false
  };
  
  // Create backtest engine
  const engine = new BacktestEngine(config);
  
  // Create and add strategy
  const strategy = createMomentumReversalStrategy({
    rsi_period: 14,
    rsi_oversold: 30,
    rsi_overbought: 70,
    position_size: 0.4
  });
  
  engine.addStrategy('MomentumReversal', strategy);
  
  // Set up event listeners for monitoring
  engine.on('fill', (fill) => {
    console.log(`📈 Fill: ${fill.side} ${fill.quantity} ${fill.symbol} @ $${fill.price.toFixed(2)}`);
  });
  
  engine.on('reject', ({ order, reason }) => {
    console.log(`❌ Order Rejected: ${reason}`);
  });
  
  let barCount = 0;
  engine.on('bar', (bar) => {
    barCount++;
    if (barCount % 50 === 0) {
      const portfolio = engine.getPortfolio();
      console.log(`📊 Day ${barCount}: Equity $${portfolio.equity.toFixed(2)}, Cash $${portfolio.cash.toFixed(2)}`);
    }
  });
  
  try {
    // Run the backtest
    console.log('Running backtest...\n');
    const results = await engine.run();
    
    // Display results
    console.log('\n🎯 Backtest Results:');
    console.log('==================');
    console.log(`Total Return: ${(results.total_return * 100).toFixed(2)}%`);
    console.log(`Annual Return: ${(results.annual_return * 100).toFixed(2)}%`);
    console.log(`Sharpe Ratio: ${results.sharpe_ratio.toFixed(2)}`);
    console.log(`Max Drawdown: ${(results.max_drawdown * 100).toFixed(2)}%`);
    console.log(`Total Trades: ${results.trade_count}`);
    console.log(`Win Rate: ${(results.win_rate * 100).toFixed(1)}%`);
    console.log(`Profit Factor: ${results.profit_factor.toFixed(2)}`);
    
    if (results.equity_curve.length > 0) {
      const finalEquity = results.equity_curve[results.equity_curve.length - 1];
      console.log(`Final Equity: $${finalEquity.equity.toFixed(2)}`);
      console.log(`Final Drawdown: ${(finalEquity.drawdown * 100).toFixed(2)}%`);
    }
    
    // Display strategy-specific metrics
    const strategyMetrics = strategy.getStrategyMetrics();
    console.log('\n📊 Strategy Metrics:');
    console.log(`Current RSI: ${strategyMetrics.current_rsi.toFixed(2)}`);
    console.log(`Current Momentum: ${strategyMetrics.current_momentum.toFixed(4)}`);
    console.log(`Current ATR: ${strategyMetrics.current_atr.toFixed(4)}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Backtest failed:', error);
    throw error;
  }
}

// Portfolio optimization example
async function runMultiStrategyBacktest() {
  console.log('\n🔄 Running Multi-Strategy Portfolio Backtest\n');
  
  const config: BacktestConfig = {
    start_date: '2023-01-01',
    end_date: '2023-12-31',
    initial_capital: 100000,
    timeframe: 'DAY',
    commission: 0.003,
    slippage: 0.0005,
    halt_on_risk_breach: false
  };
  
  const engine = new BacktestEngine(config);
  
  // Add multiple strategies with different parameters
  const strategies = [
    {
      name: 'Conservative',
      strategy: createMomentumReversalStrategy({
        rsi_period: 21,
        rsi_oversold: 25,
        rsi_overbought: 75,
        position_size: 0.2
      })
    },
    {
      name: 'Aggressive', 
      strategy: createMomentumReversalStrategy({
        rsi_period: 10,
        rsi_oversold: 35,
        rsi_overbought: 65,
        position_size: 0.3
      })
    }
  ];
  
  strategies.forEach(({ name, strategy }) => {
    engine.addStrategy(name, strategy);
  });
  
  console.log('Running multi-strategy backtest...');
  const results = await engine.run();
  
  console.log('\n🏆 Multi-Strategy Results:');
  console.log('========================');
  console.log(`Portfolio Return: ${(results.total_return * 100).toFixed(2)}%`);
  console.log(`Risk-Adjusted Return: ${results.sharpe_ratio.toFixed(2)}`);
  
  return results;
}

// Performance comparison
async function compareStrategies() {
  console.log('\n⚖️  Strategy Comparison\n');
  
  const configurations = [
    { name: 'Short RSI', rsi_period: 7, position_size: 0.3 },
    { name: 'Medium RSI', rsi_period: 14, position_size: 0.4 },
    { name: 'Long RSI', rsi_period: 21, position_size: 0.3 }
  ];
  
  const results = [];
  
  for (const config of configurations) {
    console.log(`Testing ${config.name}...`);
    
    const backtestConfig: BacktestConfig = {
      start_date: '2023-01-01',
      end_date: '2023-12-31', 
      initial_capital: 50000,
      timeframe: 'DAY',
      commission: 0.005,
      slippage: 0.001,
      halt_on_risk_breach: false
    };
    
    const engine = new BacktestEngine(backtestConfig);
    const strategy = createMomentumReversalStrategy({
      rsi_period: config.rsi_period,
      position_size: config.position_size
    });
    
    engine.addStrategy(config.name, strategy);
    const result = await engine.run();
    
    results.push({
      name: config.name,
      return: result.total_return,
      sharpe: result.sharpe_ratio,
      maxDrawdown: result.max_drawdown,
      trades: result.trade_count
    });
  }
  
  // Display comparison
  console.log('\n📈 Strategy Comparison Results:');
  console.log('===============================');
  results.forEach(result => {
    console.log(`${result.name}:`);
    console.log(`  Return: ${(result.return * 100).toFixed(2)}%`);
    console.log(`  Sharpe: ${result.sharpe.toFixed(2)}`);
    console.log(`  Max DD: ${(result.maxDrawdown * 100).toFixed(2)}%`);
    console.log(`  Trades: ${result.trades}`);
    console.log('');
  });
  
  return results;
}

// Export functions for use in other modules
export {
  runSimpleBacktest,
  runMultiStrategyBacktest,
  compareStrategies,
  generateMockData
};

// Run examples if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      await runSimpleBacktest();
      await runMultiStrategyBacktest();
      await compareStrategies();
    } catch (error) {
      console.error('Example execution failed:', error);
      process.exit(1);
    }
  })();
}