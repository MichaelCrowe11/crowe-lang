// Example TypeScript strategy using CroweLang runtime
import { BaseStrategy, Bar, StrategyConfig } from '@crowelang/runtime';
import { Indicators } from '@crowelang/runtime';

export class MeanReversionStrategy extends BaseStrategy {
  private lookback: number = 20;
  private zscoreEntry: number = 2.0;
  private zscoreExit: number = 0.5;
  private positionSize: number = 0.1;
  
  private prices: number[] = [];
  private sma: number = 0;
  private stdDev: number = 0;
  private zscore: number = 0;
  
  constructor(config: StrategyConfig) {
    super(config);
    
    // Override default params if provided
    if (config.params) {
      this.lookback = config.params.lookback || this.lookback;
      this.zscoreEntry = config.params.zscoreEntry || this.zscoreEntry;
      this.zscoreExit = config.params.zscoreExit || this.zscoreExit;
      this.positionSize = config.params.positionSize || this.positionSize;
    }
  }
  
  public async onBar(bar: Bar): Promise<void> {
    // Update price history
    this.prices.push(bar.close);
    if (this.prices.length > this.lookback) {
      this.prices.shift();
    }
    
    // Need enough data
    if (this.prices.length < this.lookback) {
      return;
    }
    
    // Calculate indicators
    this.sma = Indicators.SMA(this.prices, this.lookback);
    this.stdDev = Indicators.StdDev(this.prices, this.lookback);
    this.zscore = (bar.close - this.sma) / this.stdDev;
    
    // Store indicators for monitoring
    this.setIndicator('sma', this.sma);
    this.setIndicator('zscore', this.zscore);
    
    // Generate signals
    const longEntry = this.zscore < -this.zscoreEntry;
    const longExit = this.zscore > -this.zscoreExit;
    const shortEntry = this.zscore > this.zscoreEntry;
    const shortExit = this.zscore < this.zscoreExit;
    
    this.setSignal('long_entry', longEntry);
    this.setSignal('long_exit', longExit);
    this.setSignal('short_entry', shortEntry);
    this.setSignal('short_exit', shortExit);
    
    // Execute trading rules
    const position = this.getPosition(bar.symbol);
    const currentPos = position ? position.quantity : 0;
    
    if (longEntry && currentPos === 0) {
      // Enter long position
      const shares = Math.floor((this.capital * this.positionSize) / bar.close);
      console.log(`Long entry signal: Buying ${shares} shares at ${bar.close}`);
      this.buy(bar.symbol, shares);
      
    } else if (longExit && currentPos > 0) {
      // Exit long position
      console.log(`Long exit signal: Selling ${currentPos} shares at ${bar.close}`);
      this.sell(bar.symbol, currentPos);
      
    } else if (shortEntry && currentPos === 0) {
      // Enter short position
      const shares = Math.floor((this.capital * this.positionSize) / bar.close);
      console.log(`Short entry signal: Shorting ${shares} shares at ${bar.close}`);
      this.short(bar.symbol, shares);
      
    } else if (shortExit && currentPos < 0) {
      // Exit short position
      console.log(`Short exit signal: Covering ${Math.abs(currentPos)} shares at ${bar.close}`);
      this.buy(bar.symbol, Math.abs(currentPos));
    }
  }
  
  public updateIndicators(bar: Bar): void {
    // Called automatically by the engine
    // Can be used for additional indicator updates
  }
  
  public async onStart(): Promise<void> {
    console.log(`${this.config.name} strategy started with params:`, {
      lookback: this.lookback,
      zscoreEntry: this.zscoreEntry,
      zscoreExit: this.zscoreExit,
      positionSize: this.positionSize
    });
  }
  
  public async onStop(): Promise<void> {
    // Clean up any open positions
    this.closeAllPositions();
    console.log(`${this.config.name} strategy stopped`);
  }
}