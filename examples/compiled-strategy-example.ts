// Example of compiled CroweLang strategy to TypeScript
// This shows what the momentum reversal strategy would look like after compilation

import { BaseStrategy, StrategyConfig } from '../packages/runtime/src/base-strategy';
import { Bar, Position, Portfolio } from '../packages/runtime/src/types';
import * as indicators from '../packages/runtime/src/indicators';

interface MomentumReversalParams {
  rsi_period?: number;
  rsi_oversold?: number;
  rsi_overbought?: number;
  momentum_period?: number;
  position_size?: number;
}

export class MomentumReversalStrategy extends BaseStrategy {
  private params: Required<MomentumReversalParams>;
  
  // Indicator values
  private rsi: number = 50;
  private momentum: number = 0;
  private price_sma: number = 0;
  private atr: number = 0;
  
  // Price history for lookback calculations
  private priceHistory: number[] = [];
  private highHistory: number[] = [];
  private lowHistory: number[] = [];
  private volumeHistory: number[] = [];
  
  constructor(config: StrategyConfig, params: MomentumReversalParams = {}) {
    super(config);
    
    // Apply default parameters
    this.params = {
      rsi_period: params.rsi_period ?? 14,
      rsi_oversold: params.rsi_oversold ?? 30.0,
      rsi_overbought: params.rsi_overbought ?? 70.0,
      momentum_period: params.momentum_period ?? 5,
      position_size: params.position_size ?? 0.5
    };
  }

  public async onBar(bar: Bar): Promise<void> {
    // Update price history
    this.updateHistory(bar);
    
    // Calculate indicators
    this.updateIndicators(bar);
    
    // Update signals
    this.updateSignals(bar);
    
    // Execute trading rules
    this.processRules(bar);
  }

  private updateHistory(bar: Bar): void {
    this.priceHistory.push(bar.close);
    this.highHistory.push(bar.high);
    this.lowHistory.push(bar.low);
    this.volumeHistory.push(bar.volume);
    
    // Keep only required history
    const maxHistory = Math.max(this.params.rsi_period, this.params.momentum_period, 20, 14) + 10;
    if (this.priceHistory.length > maxHistory) {
      this.priceHistory.shift();
      this.highHistory.shift();
      this.lowHistory.shift();
      this.volumeHistory.shift();
    }
  }

  private updateIndicators(bar: Bar): void {
    if (this.priceHistory.length < Math.max(this.params.rsi_period, 20, 14)) {
      return; // Not enough data yet
    }

    // Calculate RSI
    this.rsi = indicators.RSI(this.priceHistory, this.params.rsi_period);
    
    // Calculate momentum
    if (this.priceHistory.length > this.params.momentum_period) {
      const currentPrice = this.priceHistory[this.priceHistory.length - 1];
      const pastPrice = this.priceHistory[this.priceHistory.length - 1 - this.params.momentum_period];
      this.momentum = currentPrice - pastPrice;
    }
    
    // Calculate SMA
    this.price_sma = indicators.SMA(this.priceHistory, 20);
    
    // Calculate ATR
    this.atr = indicators.ATR(this.highHistory, this.lowHistory, this.priceHistory, 14);
    
    // Store indicator values for debugging
    this.setIndicator('rsi', this.rsi);
    this.setIndicator('momentum', this.momentum);
    this.setIndicator('price_sma', this.price_sma);
    this.setIndicator('atr', this.atr);
  }

  private updateSignals(bar: Bar): void {
    // Reversal signals
    const oversold_reversal = this.rsi < this.params.rsi_oversold && 
                              this.momentum < 0 && 
                              bar.close < this.price_sma;
                              
    const overbought_reversal = this.rsi > this.params.rsi_overbought && 
                                this.momentum > 0 && 
                                bar.close > this.price_sma;
    
    // Confirmation signals
    const volume_sma = indicators.SMA(this.volumeHistory, 10);
    const bullish_confirm = bar.close > bar.open && bar.volume > volume_sma;
    const bearish_confirm = bar.close < bar.open && bar.volume > volume_sma;
    
    // Exit signals
    const rsi_neutral = this.rsi > 45 && this.rsi < 55;
    
    // Store signals
    this.setSignal('oversold_reversal', oversold_reversal);
    this.setSignal('overbought_reversal', overbought_reversal);
    this.setSignal('bullish_confirm', bullish_confirm);
    this.setSignal('bearish_confirm', bearish_confirm);
    this.setSignal('rsi_neutral', rsi_neutral);
  }

  private processRules(bar: Bar): void {
    const position = this.getPosition(bar.symbol);
    const currentPosition = position?.quantity || 0;
    const portfolio = this.getPortfolio();
    
    // Get signals
    const oversold_reversal = this.getSignal('oversold_reversal');
    const overbought_reversal = this.getSignal('overbought_reversal');
    const bullish_confirm = this.getSignal('bullish_confirm');
    const bearish_confirm = this.getSignal('bearish_confirm');
    const rsi_neutral = this.getSignal('rsi_neutral');
    
    // Rule: Enter long on oversold reversal
    if (oversold_reversal && bullish_confirm && currentPosition === 0) {
      const quantity = Math.floor((portfolio.cash * this.params.position_size) / bar.close);
      if (quantity > 0) {
        this.buy(bar.symbol, quantity);
        console.log(`MomentumReversal: Buying ${quantity} shares at ${bar.close} (RSI: ${this.rsi.toFixed(2)})`);
      }
    }
    
    // Rule: Enter short on overbought reversal
    if (overbought_reversal && bearish_confirm && currentPosition === 0) {
      const quantity = Math.floor((portfolio.cash * this.params.position_size) / bar.close);
      if (quantity > 0) {
        this.short(bar.symbol, quantity);
        console.log(`MomentumReversal: Shorting ${quantity} shares at ${bar.close} (RSI: ${this.rsi.toFixed(2)})`);
      }
    }
    
    // Rule: Exit long positions
    if (currentPosition > 0 && (rsi_neutral || this.rsi > this.params.rsi_overbought)) {
      this.sell(bar.symbol, currentPosition);
      console.log(`MomentumReversal: Selling ${currentPosition} shares at ${bar.close} (RSI: ${this.rsi.toFixed(2)})`);
    }
    
    // Rule: Exit short positions  
    if (currentPosition < 0 && (rsi_neutral || this.rsi < this.params.rsi_oversold)) {
      this.buy(bar.symbol, Math.abs(currentPosition)); // Cover short
      console.log(`MomentumReversal: Covering ${Math.abs(currentPosition)} shares at ${bar.close} (RSI: ${this.rsi.toFixed(2)})`);
    }
    
    // Risk management: Dynamic stop loss based on ATR
    if (currentPosition !== 0 && this.atr > 0) {
      const stopDistance = 2.5 * this.atr;
      const takeProfitDistance = 1.5 * this.atr;
      
      if (currentPosition > 0) {
        // Long position stops
        const stopPrice = bar.close - stopDistance;
        const takeProfitPrice = bar.close + takeProfitDistance;
        
        if (bar.close <= stopPrice) {
          this.sell(bar.symbol, currentPosition);
          console.log(`MomentumReversal: Stop loss triggered at ${bar.close}`);
        } else if (bar.close >= takeProfitPrice) {
          this.sell(bar.symbol, currentPosition);
          console.log(`MomentumReversal: Take profit triggered at ${bar.close}`);
        }
      } else if (currentPosition < 0) {
        // Short position stops
        const stopPrice = bar.close + stopDistance;
        const takeProfitPrice = bar.close - takeProfitDistance;
        
        if (bar.close >= stopPrice) {
          this.buy(bar.symbol, Math.abs(currentPosition));
          console.log(`MomentumReversal: Stop loss triggered at ${bar.close}`);
        } else if (bar.close <= takeProfitPrice) {
          this.buy(bar.symbol, Math.abs(currentPosition));
          console.log(`MomentumReversal: Take profit triggered at ${bar.close}`);
        }
      }
    }
  }

  // Performance metrics specific to this strategy
  public getStrategyMetrics(): Record<string, any> {
    return {
      current_rsi: this.rsi,
      current_momentum: this.momentum,
      current_atr: this.atr,
      signals: {
        oversold_reversal: this.getSignal('oversold_reversal'),
        overbought_reversal: this.getSignal('overbought_reversal'),
        rsi_neutral: this.getSignal('rsi_neutral')
      },
      parameters: this.params
    };
  }
}

// Factory function for creating the strategy
export function createMomentumReversalStrategy(params?: MomentumReversalParams): MomentumReversalStrategy {
  const config: StrategyConfig = {
    name: 'MomentumReversal',
    symbols: ['SPY'], // Default symbol
    use_ticks: false
  };
  
  return new MomentumReversalStrategy(config, params);
}

// Example usage
export function exampleUsage() {
  // Create strategy with custom parameters
  const strategy = createMomentumReversalStrategy({
    rsi_period: 21,
    rsi_oversold: 25,
    rsi_overbought: 75,
    position_size: 0.3
  });
  
  console.log('Created Momentum Reversal Strategy');
  console.log('Parameters:', strategy.getStrategyMetrics().parameters);
  
  return strategy;
}