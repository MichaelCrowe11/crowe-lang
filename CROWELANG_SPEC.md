# CroweLang - Quantitative Trading DSL Specification

## Overview
CroweLang is a domain-specific language for quantitative trading, focusing on strategy research, execution, risk management, and market microstructure analysis.

## Core Language Features

### 1. Strategy Definition
```crowelang
strategy MeanReversion {
  params {
    lookback: int = 20
    zscore_entry: float = 2.0
    zscore_exit: float = 0.5
    position_size: float = 0.1
  }
  
  indicators {
    sma = SMA(close, lookback)
    std = StdDev(close, lookback)
    zscore = (close - sma) / std
  }
  
  signals {
    long_entry = zscore < -zscore_entry
    long_exit = zscore > -zscore_exit
    short_entry = zscore > zscore_entry
    short_exit = zscore < zscore_exit
  }
  
  rules {
    when (long_entry and not position) {
      buy(position_size * capital)
    }
    when (long_exit and position > 0) {
      sell(position)
    }
    when (short_entry and not position) {
      short(position_size * capital)
    }
    when (short_exit and position < 0) {
      cover(position)
    }
  }
  
  risk {
    max_position = 0.2 * capital
    stop_loss = 0.02
    daily_var_limit = 0.05
  }
}
```

### 2. Market Data Types
```crowelang
data Bar {
  symbol: string
  timestamp: datetime
  open: float
  high: float
  low: float
  close: float
  volume: int
  vwap?: float
}

data Tick {
  symbol: string
  timestamp: datetime
  price: float
  size: int
  side: Side
  exchange?: string
}

data OrderBook {
  symbol: string
  timestamp: datetime
  bids: Level[]
  asks: Level[]
  spread: float = asks[0].price - bids[0].price
}

data Level {
  price: float
  size: int
  orders?: int
}
```

### 3. Execution Primitives
```crowelang
order MarketOrder {
  symbol: string
  side: Side
  quantity: float
  time_in_force: TimeInForce = IOC
}

order LimitOrder {
  symbol: string
  side: Side
  quantity: float
  price: float
  time_in_force: TimeInForce = DAY
  post_only?: boolean = false
}

order StopOrder {
  symbol: string
  side: Side
  quantity: float
  stop_price: float
  limit_price?: float
}

enum Side { BUY, SELL, SHORT, COVER }
enum TimeInForce { IOC, FOK, DAY, GTC, GTX }
enum OrderStatus { PENDING, PARTIAL, FILLED, CANCELLED, REJECTED }
```

### 4. Portfolio & Risk Management
```crowelang
portfolio Portfolio {
  positions: Map<string, Position>
  cash: float
  equity: float
  margin_used: float
  
  metrics {
    sharpe = annual_return / annual_volatility
    max_drawdown = compute_max_drawdown(equity_curve)
    win_rate = winning_trades / total_trades
    profit_factor = gross_profit / gross_loss
  }
  
  constraints {
    max_leverage = 2.0
    max_concentration = 0.3
    min_liquidity = 1000000  // daily volume
  }
}

risk RiskManager {
  limits {
    position_limit = 100000
    order_rate_limit = 100  // per second
    daily_loss_limit = 50000
    var_limit = 100000
  }
  
  checks {
    pre_trade = [check_position_limit, check_margin, check_liquidity]
    post_trade = [update_var, check_exposure, log_trade]
  }
}
```

### 5. Backtesting Framework
```crowelang
backtest Config {
  data_source: DataSource = "polygon"
  start_date: date = "2020-01-01"
  end_date: date = "2023-12-31"
  initial_capital: float = 1000000
  
  universe: string[] = ["AAPL", "GOOGL", "MSFT"]
  frequency: Frequency = MINUTE
  
  costs {
    commission: float = 0.001  // 10 bps
    slippage: SlippageModel = LinearSlippage(0.0001)
    borrow_rate: float = 0.02  // annual
  }
  
  output {
    metrics: boolean = true
    trades: boolean = true
    equity_curve: boolean = true
    risk_report: boolean = true
  }
}
```

### 6. Event System
```crowelang
event MarketEvent {
  on_bar(bar: Bar) {
    // Process new bar data
  }
  
  on_tick(tick: Tick) {
    // Process tick data
  }
  
  on_book(book: OrderBook) {
    // Process order book update
  }
}

event ExecutionEvent {
  on_fill(fill: Fill) {
    log("Filled: ${fill.symbol} ${fill.quantity} @ ${fill.price}")
  }
  
  on_reject(order: Order, reason: string) {
    log("Rejected: ${reason}")
  }
}
```

### 7. Indicators Library
```crowelang
indicator SMA(series: float[], period: int) -> float {
  return sum(series[-period:]) / period
}

indicator EMA(series: float[], period: int) -> float {
  alpha = 2.0 / (period + 1)
  return series[-1] * alpha + ema[-1] * (1 - alpha)
}

indicator RSI(series: float[], period: int = 14) -> float {
  gains = [max(0, series[i] - series[i-1]) for i in 1..len(series)]
  losses = [max(0, series[i-1] - series[i]) for i in 1..len(series)]
  avg_gain = sma(gains, period)
  avg_loss = sma(losses, period)
  rs = avg_gain / avg_loss
  return 100 - (100 / (1 + rs))
}

indicator VWAP(bars: Bar[]) -> float {
  typical_price = (bars.high + bars.low + bars.close) / 3
  return sum(typical_price * bars.volume) / sum(bars.volume)
}
```

### 8. Market Microstructure
```crowelang
microstructure OrderFlow {
  imbalance = (bid_volume - ask_volume) / (bid_volume + ask_volume)
  toxicity = adverse_selection_cost / total_volume
  
  detect {
    sweep = large_order_detection(threshold = 10 * avg_order_size)
    iceberg = hidden_order_detection(book_history)
    spoofing = cancelled_order_ratio > 0.9
  }
}

microstructure MarketMaking {
  spread = calculate_optimal_spread(volatility, inventory)
  
  quote {
    bid_price = mid - spread/2 - inventory_skew
    ask_price = mid + spread/2 + inventory_skew
    bid_size = calculate_size(risk_limit, inventory)
    ask_size = calculate_size(risk_limit, -inventory)
  }
  
  hedging {
    when (abs(inventory) > max_inventory) {
      hedge_with_futures(inventory)
    }
  }
}
```

## Compilation Targets

1. **Python** - For research and backtesting
2. **C++** - For low-latency execution
3. **Rust** - For safety-critical components
4. **TypeScript** - For web-based tools and visualization

## Standard Library

- **Data Providers**: Polygon, IBKR, Alpaca, Binance, FIX
- **Risk Models**: VaR, CVaR, Stress Testing, Factor Models
- **Execution Algos**: TWAP, VWAP, POV, Iceberg, Sniper
- **ML Integration**: Feature engineering, model serving, A/B testing

## Development Phases

### Phase 0: Foundation (Weeks 0-4)
- Core language parser and AST
- Basic backtest engine
- VS Code extension with syntax highlighting
- Mock broker connections

### Phase 1: Pro Tools (Months 1-3)
- Event-driven backtester
- Real broker connections (IBKR, Alpaca)
- Portfolio optimization
- Risk analytics dashboard

### Phase 2: Production (Months 4-12)
- Live execution engine
- Co-location support
- Smart order routing
- Compliance and audit logs

### Phase 3: Enterprise (Years 1-3)
- Multi-venue execution
- Cross-asset support
- Regulatory compliance (MiFID II, SEC)
- Strategy marketplace