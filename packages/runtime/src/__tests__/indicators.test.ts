import { Indicators } from '../indicators';

describe('Technical Indicators', () => {
  describe('SMA (Simple Moving Average)', () => {
    it('should calculate SMA correctly', () => {
      const series = [10, 12, 13, 15, 14, 16, 18, 17, 19, 20];
      const sma = Indicators.SMA(series, 5);
      expect(sma).toBeCloseTo(17.8, 1);
    });

    it('should return NaN for insufficient data', () => {
      const series = [10, 12];
      const sma = Indicators.SMA(series, 5);
      expect(sma).toBeNaN();
    });
  });

  describe('EMA (Exponential Moving Average)', () => {
    it('should calculate EMA correctly', () => {
      const series = [10, 12, 13, 15, 14, 16, 18, 17, 19, 20];
      const ema = Indicators.EMA(series, 5);
      expect(ema).toBeCloseTo(18.25, 1);
    });

    it('should give more weight to recent values', () => {
      const series = [10, 10, 10, 10, 20];
      const ema = Indicators.EMA(series, 3);
      const sma = Indicators.SMA(series, 3);
      expect(ema).toBeGreaterThan(sma);
    });
  });

  describe('RSI (Relative Strength Index)', () => {
    it('should calculate RSI correctly', () => {
      const series = [44, 44.25, 44.5, 43.75, 44.75, 45.5, 45.25, 46, 46.5, 46.25, 47.5, 47.25, 48, 47.75, 47.5];
      const rsi = Indicators.RSI(series, 14);
      expect(rsi).toBeGreaterThan(50);
      expect(rsi).toBeLessThan(100);
    });

    it('should return 100 for all gains', () => {
      const series = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
      const rsi = Indicators.RSI(series, 14);
      expect(rsi).toBe(100);
    });

    it('should return 0 for all losses', () => {
      const series = [24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
      const rsi = Indicators.RSI(series, 14);
      expect(rsi).toBe(0);
    });
  });

  describe('Bollinger Bands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const series = [10, 12, 13, 15, 14, 16, 18, 17, 19, 20, 22, 21, 23, 25, 24, 26, 28, 27, 29, 30];
      const bands = Indicators.BollingerBands(series, 20, 2);
      
      expect(bands.middle).toBeCloseTo(20.5, 1);
      expect(bands.upper).toBeGreaterThan(bands.middle);
      expect(bands.lower).toBeLessThan(bands.middle);
      expect(bands.upper - bands.middle).toBeCloseTo(bands.middle - bands.lower, 1);
    });
  });

  describe('StdDev (Standard Deviation)', () => {
    it('should calculate standard deviation correctly', () => {
      const series = [10, 12, 14, 16, 18, 20];
      const stdDev = Indicators.StdDev(series, 6);
      expect(stdDev).toBeCloseTo(3.74, 1);
    });

    it('should return 0 for constant values', () => {
      const series = [10, 10, 10, 10, 10];
      const stdDev = Indicators.StdDev(series, 5);
      expect(stdDev).toBe(0);
    });
  });

  describe('MACD', () => {
    it('should calculate MACD correctly', () => {
      const series = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
      const macd = Indicators.MACD(series, 12, 26, 9);
      
      expect(macd.macd).toBeDefined();
      expect(macd.signal).toBeDefined();
      expect(macd.histogram).toBeDefined();
      expect(macd.histogram).toBe(macd.macd - macd.signal);
    });
  });

  describe('ATR (Average True Range)', () => {
    it('should calculate ATR correctly', () => {
      const highs = [48, 49, 47, 48, 50, 49, 51, 52, 50, 53, 54, 52, 55, 56, 54];
      const lows = [45, 46, 44, 45, 47, 46, 48, 49, 47, 50, 51, 49, 52, 53, 51];
      const closes = [46, 47, 45, 46, 48, 47, 49, 50, 48, 51, 52, 50, 53, 54, 52];
      
      const atr = Indicators.ATR(highs, lows, closes, 14);
      expect(atr).toBeGreaterThan(0);
      expect(atr).toBeLessThan(10);
    });
  });

  describe('VWAP (Volume Weighted Average Price)', () => {
    it('should calculate VWAP correctly', () => {
      const bars = [
        { high: 50, low: 48, close: 49, volume: 1000 },
        { high: 51, low: 49, close: 50, volume: 1500 },
        { high: 52, low: 50, close: 51, volume: 2000 },
        { high: 53, low: 51, close: 52, volume: 1200 }
      ];
      
      const vwap = Indicators.VWAP(bars);
      expect(vwap).toBeGreaterThan(50);
      expect(vwap).toBeLessThan(52);
    });

    it('should return NaN for empty bars', () => {
      const vwap = Indicators.VWAP([]);
      expect(vwap).toBeNaN();
    });
  });
});