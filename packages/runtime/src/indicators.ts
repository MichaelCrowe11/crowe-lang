// Technical indicators for CroweLang
import Decimal from 'decimal.js';

export class Indicators {
  // Simple Moving Average
  static SMA(series: number[], period: number): number {
    if (series.length < period) return NaN;
    
    const slice = series.slice(-period);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    return sum / period;
  }

  // Exponential Moving Average
  static EMA(series: number[], period: number): number {
    if (series.length === 0) return NaN;
    
    const alpha = 2 / (period + 1);
    let ema = series[0];
    
    for (let i = 1; i < series.length; i++) {
      ema = alpha * series[i] + (1 - alpha) * ema;
    }
    
    return ema;
  }

  // Relative Strength Index
  static RSI(series: number[], period: number = 14): number {
    if (series.length < period + 1) return NaN;
    
    const changes: number[] = [];
    for (let i = 1; i < series.length; i++) {
      changes.push(series[i] - series[i - 1]);
    }
    
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
    
    const avgGain = this.SMA(gains.slice(-period), period);
    const avgLoss = this.SMA(losses.slice(-period), period);
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Moving Average Convergence Divergence
  static MACD(series: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    const fastEMA = this.EMA(series, fastPeriod);
    const slowEMA = this.EMA(series, slowPeriod);
    const macd = fastEMA - slowEMA;
    
    // Calculate signal line (EMA of MACD)
    const macdSeries: number[] = [];
    for (let i = slowPeriod - 1; i < series.length; i++) {
      const fast = this.EMA(series.slice(0, i + 1), fastPeriod);
      const slow = this.EMA(series.slice(0, i + 1), slowPeriod);
      macdSeries.push(fast - slow);
    }
    
    const signal = this.EMA(macdSeries, signalPeriod);
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }

  // Bollinger Bands
  static BollingerBands(series: number[], period: number = 20, stdDev: number = 2): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const middle = this.SMA(series, period);
    const std = this.StdDev(series, period);
    
    return {
      upper: middle + (stdDev * std),
      middle,
      lower: middle - (stdDev * std)
    };
  }

  // Standard Deviation
  static StdDev(series: number[], period: number): number {
    if (series.length < period) return NaN;
    
    const slice = series.slice(-period);
    const mean = this.SMA(slice, period);
    
    const squaredDiffs = slice.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / period;
    
    return Math.sqrt(variance);
  }

  // Average True Range
  static ATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (highs.length < period + 1) return NaN;
    
    const trueRanges: number[] = [];
    
    for (let i = 1; i < highs.length; i++) {
      const highLow = highs[i] - lows[i];
      const highClose = Math.abs(highs[i] - closes[i - 1]);
      const lowClose = Math.abs(lows[i] - closes[i - 1]);
      
      trueRanges.push(Math.max(highLow, highClose, lowClose));
    }
    
    return this.SMA(trueRanges, period);
  }

  // Stochastic Oscillator
  static Stochastic(highs: number[], lows: number[], closes: number[], period: number = 14): {
    k: number;
    d: number;
  } {
    if (highs.length < period) return { k: NaN, d: NaN };
    
    const highSlice = highs.slice(-period);
    const lowSlice = lows.slice(-period);
    const close = closes[closes.length - 1];
    
    const highestHigh = Math.max(...highSlice);
    const lowestLow = Math.min(...lowSlice);
    
    const k = ((close - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    // Calculate %D (3-period SMA of %K)
    const kValues: number[] = [];
    for (let i = period - 1; i < closes.length; i++) {
      const hh = Math.max(...highs.slice(i - period + 1, i + 1));
      const ll = Math.min(...lows.slice(i - period + 1, i + 1));
      kValues.push(((closes[i] - ll) / (hh - ll)) * 100);
    }
    
    const d = this.SMA(kValues.slice(-3), 3);
    
    return { k, d };
  }

  // Volume Weighted Average Price
  static VWAP(bars: Array<{ high: number; low: number; close: number; volume: number }>): number {
    if (bars.length === 0) return NaN;
    
    let totalVolume = 0;
    let totalVolumePrice = 0;
    
    for (const bar of bars) {
      const typicalPrice = (bar.high + bar.low + bar.close) / 3;
      totalVolumePrice += typicalPrice * bar.volume;
      totalVolume += bar.volume;
    }
    
    return totalVolume > 0 ? totalVolumePrice / totalVolume : NaN;
  }

  // On-Balance Volume
  static OBV(closes: number[], volumes: number[]): number {
    if (closes.length !== volumes.length || closes.length < 2) return NaN;
    
    let obv = 0;
    
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) {
        obv += volumes[i];
      } else if (closes[i] < closes[i - 1]) {
        obv -= volumes[i];
      }
      // If prices are equal, OBV remains unchanged
    }
    
    return obv;
  }

  // Commodity Channel Index
  static CCI(highs: number[], lows: number[], closes: number[], period: number = 20): number {
    if (highs.length < period) return NaN;
    
    const typicalPrices: number[] = [];
    for (let i = 0; i < highs.length; i++) {
      typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    
    const sma = this.SMA(typicalPrices, period);
    const meanDeviation = this.MeanDeviation(typicalPrices.slice(-period), sma);
    
    const currentTP = typicalPrices[typicalPrices.length - 1];
    
    return (currentTP - sma) / (0.015 * meanDeviation);
  }

  // Mean Deviation
  private static MeanDeviation(series: number[], mean: number): number {
    const deviations = series.map(x => Math.abs(x - mean));
    return deviations.reduce((acc, val) => acc + val, 0) / series.length;
  }

  // Williams %R
  static WilliamsR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (highs.length < period) return NaN;
    
    const highSlice = highs.slice(-period);
    const lowSlice = lows.slice(-period);
    const close = closes[closes.length - 1];
    
    const highestHigh = Math.max(...highSlice);
    const lowestLow = Math.min(...lowSlice);
    
    return ((highestHigh - close) / (highestHigh - lowestLow)) * -100;
  }

  // Money Flow Index
  static MFI(highs: number[], lows: number[], closes: number[], volumes: number[], period: number = 14): number {
    if (highs.length < period + 1) return NaN;
    
    const typicalPrices: number[] = [];
    const moneyFlows: number[] = [];
    
    for (let i = 0; i < highs.length; i++) {
      const tp = (highs[i] + lows[i] + closes[i]) / 3;
      typicalPrices.push(tp);
      moneyFlows.push(tp * volumes[i]);
    }
    
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    for (let i = typicalPrices.length - period; i < typicalPrices.length; i++) {
      if (i === 0) continue;
      
      if (typicalPrices[i] > typicalPrices[i - 1]) {
        positiveFlow += moneyFlows[i];
      } else {
        negativeFlow += moneyFlows[i];
      }
    }
    
    if (negativeFlow === 0) return 100;
    
    const moneyRatio = positiveFlow / negativeFlow;
    return 100 - (100 / (1 + moneyRatio));
  }

  // Parabolic SAR
  static ParabolicSAR(highs: number[], lows: number[], af: number = 0.02, maxAf: number = 0.2): number[] {
    if (highs.length < 2) return [];
    
    const result: number[] = [];
    let isUpTrend = true;
    let sar = lows[0];
    let ep = highs[0];
    let currentAf = af;
    
    for (let i = 1; i < highs.length; i++) {
      if (isUpTrend) {
        sar = sar + currentAf * (ep - sar);
        
        if (highs[i] > ep) {
          ep = highs[i];
          currentAf = Math.min(currentAf + af, maxAf);
        }
        
        if (lows[i] < sar) {
          isUpTrend = false;
          sar = ep;
          ep = lows[i];
          currentAf = af;
        }
      } else {
        sar = sar + currentAf * (ep - sar);
        
        if (lows[i] < ep) {
          ep = lows[i];
          currentAf = Math.min(currentAf + af, maxAf);
        }
        
        if (highs[i] > sar) {
          isUpTrend = true;
          sar = ep;
          ep = highs[i];
          currentAf = af;
        }
      }
      
      result.push(sar);
    }
    
    return result;
  }
}