// Portfolio management for tracking positions and P&L
import { Position, Portfolio, Fill, Side } from './types';
import Decimal from 'decimal.js';

export class PortfolioManager {
  private positions: Map<string, Position> = new Map();
  private cash: number;
  private initialCapital: number;
  private prices: Map<string, number> = new Map();

  constructor(initialCapital: number) {
    this.initialCapital = initialCapital;
    this.cash = initialCapital;
  }

  public processFill(fill: Fill): void {
    let position = this.positions.get(fill.symbol);
    
    if (!position) {
      // Create new position
      position = this.createPosition(fill);
      this.positions.set(fill.symbol, position);
    } else {
      // Update existing position
      this.updatePosition(position, fill);
    }
    
    // Update cash
    const tradeValue = new Decimal(fill.quantity).mul(fill.price);
    const totalCost = tradeValue.add(fill.commission || 0);
    
    if (fill.side === Side.BUY || fill.side === Side.COVER) {
      this.cash -= totalCost.toNumber();
    } else {
      this.cash += tradeValue.sub(fill.commission || 0).toNumber();
    }
    
    // Track commission
    position.total_commission += fill.commission || 0;
  }

  private createPosition(fill: Fill): Position {
    const side = fill.side === Side.BUY ? 'LONG' : 
                 fill.side === Side.SHORT ? 'SHORT' : 'FLAT';
    
    return {
      symbol: fill.symbol,
      quantity: fill.side === Side.SHORT ? -fill.quantity : fill.quantity,
      side,
      avg_entry_price: fill.price,
      market_value: fill.quantity * fill.price,
      unrealized_pnl: 0,
      realized_pnl: 0,
      total_commission: fill.commission || 0,
      opened_at: new Date(fill.timestamp.iso)
    };
  }

  private updatePosition(position: Position, fill: Fill): void {
    const oldQuantity = position.quantity;
    const fillQuantity = fill.side === Side.SELL || fill.side === Side.SHORT ? 
                        -fill.quantity : fill.quantity;
    
    // Check if position is being reduced or reversed
    if (Math.sign(oldQuantity) !== Math.sign(fillQuantity) && oldQuantity !== 0) {
      // Position is being reduced or closed
      const closedQuantity = Math.min(Math.abs(oldQuantity), Math.abs(fillQuantity));
      
      // Calculate realized P&L for closed portion
      const entryValue = new Decimal(closedQuantity).mul(position.avg_entry_price);
      const exitValue = new Decimal(closedQuantity).mul(fill.price);
      
      if (oldQuantity > 0) {
        // Long position being closed
        position.realized_pnl += exitValue.sub(entryValue).toNumber();
      } else {
        // Short position being closed
        position.realized_pnl += entryValue.sub(exitValue).toNumber();
      }
      
      // Update position quantity
      position.quantity += fillQuantity;
      
      // If position is completely closed
      if (Math.abs(position.quantity) < 0.0001) {
        position.quantity = 0;
        position.side = 'FLAT';
        position.closed_at = new Date(fill.timestamp.iso);
        position.avg_exit_price = fill.price;
      } else if (Math.abs(fillQuantity) > Math.abs(oldQuantity)) {
        // Position reversed
        position.side = position.quantity > 0 ? 'LONG' : 'SHORT';
        position.avg_entry_price = fill.price;
        position.opened_at = new Date(fill.timestamp.iso);
      }
    } else {
      // Position is being increased
      const totalCost = new Decimal(position.avg_entry_price)
        .mul(Math.abs(position.quantity))
        .add(new Decimal(fill.price).mul(fill.quantity));
      
      position.quantity += fillQuantity;
      position.avg_entry_price = totalCost.div(Math.abs(position.quantity)).toNumber();
      position.side = position.quantity > 0 ? 'LONG' : 
                      position.quantity < 0 ? 'SHORT' : 'FLAT';
    }
    
    // Update market value
    const currentPrice = this.prices.get(fill.symbol) || fill.price;
    position.market_value = Math.abs(position.quantity) * currentPrice;
  }

  public updatePrice(symbol: string, price: number): void {
    this.prices.set(symbol, price);
    
    const position = this.positions.get(symbol);
    if (position && position.quantity !== 0) {
      // Update market value
      position.market_value = Math.abs(position.quantity) * price;
      
      // Update unrealized P&L
      const entryValue = new Decimal(Math.abs(position.quantity))
        .mul(position.avg_entry_price);
      const currentValue = new Decimal(Math.abs(position.quantity))
        .mul(price);
      
      if (position.quantity > 0) {
        // Long position
        position.unrealized_pnl = currentValue.sub(entryValue).toNumber();
      } else {
        // Short position
        position.unrealized_pnl = entryValue.sub(currentValue).toNumber();
      }
      
      // Track max adverse/favorable excursion
      if (position.unrealized_pnl < 0) {
        position.max_adverse_excursion = Math.min(
          position.max_adverse_excursion || 0,
          position.unrealized_pnl
        );
      } else {
        position.max_favorable_excursion = Math.max(
          position.max_favorable_excursion || 0,
          position.unrealized_pnl
        );
      }
    }
  }

  public getPosition(symbol: string): Position | null {
    return this.positions.get(symbol) || null;
  }

  public getPortfolio(): Portfolio {
    let totalMarketValue = 0;
    let totalUnrealizedPnl = 0;
    let marginUsed = 0;
    
    // Calculate totals from positions
    for (const position of this.positions.values()) {
      if (position.quantity !== 0) {
        totalMarketValue += position.market_value;
        totalUnrealizedPnl += position.unrealized_pnl;
        
        // Short positions use margin
        if (position.quantity < 0) {
          marginUsed += position.market_value;
        }
      }
    }
    
    const equity = this.cash + totalUnrealizedPnl;
    const buyingPower = this.cash - marginUsed;
    
    return {
      account_id: 'BACKTEST',
      positions: new Map(this.positions),
      cash: this.cash,
      equity,
      buying_power: buyingPower,
      margin_used: marginUsed,
      updated_at: {
        unix: Date.now(),
        iso: new Date().toISOString()
      }
    };
  }

  public getOpenPositions(): Position[] {
    return Array.from(this.positions.values())
      .filter(p => p.quantity !== 0);
  }

  public getClosedPositions(): Position[] {
    return Array.from(this.positions.values())
      .filter(p => p.quantity === 0 && p.closed_at);
  }

  public getTotalRealizedPnl(): number {
    return Array.from(this.positions.values())
      .reduce((sum, p) => sum + p.realized_pnl, 0);
  }

  public getTotalUnrealizedPnl(): number {
    return Array.from(this.positions.values())
      .reduce((sum, p) => sum + p.unrealized_pnl, 0);
  }

  public reset(): void {
    this.positions.clear();
    this.prices.clear();
    this.cash = this.initialCapital;
  }
}