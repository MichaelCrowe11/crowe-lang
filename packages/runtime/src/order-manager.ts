// Order management system for the backtest engine
import { EventEmitter } from 'events';
import { Order, Fill, Bar, OrderStatus, Side } from './types';
import Decimal from 'decimal.js';

export class OrderManager extends EventEmitter {
  private orders: Map<string, Order> = new Map();
  private orderQueue: Order[] = [];
  private fillIdCounter: number = 0;
  private engine: any; // BacktestEngine reference

  constructor(engine: any) {
    super();
    this.engine = engine;
  }

  public submitOrder(order: Order): string {
    // Validate order
    if (!this.validateOrder(order)) {
      this.emit('reject', order, 'Invalid order parameters');
      return '';
    }

    // Add to order book
    this.orders.set(order.id, order);
    this.orderQueue.push(order);
    
    console.log(`Order submitted: ${order.side} ${order.quantity} ${order.symbol} @ ${order.type}`);
    
    return order.id;
  }

  public cancelOrder(orderId: string): boolean {
    const order = this.orders.get(orderId);
    if (!order) return false;
    
    if (order.status === OrderStatus.PENDING || order.status === OrderStatus.OPEN) {
      order.status = OrderStatus.CANCELED;
      order.updated_at = {
        unix: Date.now(),
        iso: new Date().toISOString()
      };
      
      // Remove from queue
      const index = this.orderQueue.findIndex(o => o.id === orderId);
      if (index > -1) {
        this.orderQueue.splice(index, 1);
      }
      
      console.log(`Order canceled: ${orderId}`);
      return true;
    }
    
    return false;
  }

  public cancelAllOrders(symbol?: string): number {
    let canceledCount = 0;
    
    for (const order of this.orderQueue) {
      if (!symbol || order.symbol === symbol) {
        if (this.cancelOrder(order.id)) {
          canceledCount++;
        }
      }
    }
    
    return canceledCount;
  }

  public async processOrders(bar: Bar): Promise<void> {
    // Process orders for this symbol
    const symbolOrders = this.orderQueue.filter(o => o.symbol === bar.symbol);
    
    for (const order of symbolOrders) {
      const fill = await this.tryFillOrder(order, bar);
      
      if (fill) {
        // Update order status
        order.filled_quantity += fill.quantity;
        
        if (order.filled_quantity >= order.quantity) {
          order.status = OrderStatus.FILLED;
          // Remove from queue
          const index = this.orderQueue.indexOf(order);
          if (index > -1) {
            this.orderQueue.splice(index, 1);
          }
        } else {
          order.status = OrderStatus.PARTIAL_FILL;
        }
        
        order.updated_at = {
          unix: Date.now(),
          iso: new Date().toISOString()
        };
        
        // Calculate average fill price
        if (!order.avg_fill_price) {
          order.avg_fill_price = fill.price;
        } else {
          const totalValue = new Decimal(order.avg_fill_price)
            .mul(order.filled_quantity - fill.quantity)
            .add(new Decimal(fill.price).mul(fill.quantity));
          order.avg_fill_price = totalValue.div(order.filled_quantity).toNumber();
        }
        
        // Emit fill event
        this.emit('fill', fill);
      }
    }
  }

  private async tryFillOrder(order: Order, bar: Bar): Promise<Fill | null> {
    let fillPrice: number | null = null;
    let shouldFill = false;
    
    switch (order.type) {
      case 'MARKET':
        // Market orders always fill at current price
        fillPrice = this.getExecutionPrice(order, bar);
        shouldFill = true;
        break;
        
      case 'LIMIT':
        if (!order.price) break;
        
        if (order.side === Side.BUY || order.side === Side.COVER) {
          // Buy limit: fill if price <= limit
          if (bar.low <= order.price) {
            fillPrice = Math.min(order.price, bar.open);
            shouldFill = true;
          }
        } else {
          // Sell limit: fill if price >= limit
          if (bar.high >= order.price) {
            fillPrice = Math.max(order.price, bar.open);
            shouldFill = true;
          }
        }
        break;
        
      case 'STOP':
        if (!order.stop_price) break;
        
        if (order.side === Side.BUY || order.side === Side.COVER) {
          // Buy stop: trigger if price >= stop
          if (bar.high >= order.stop_price) {
            fillPrice = Math.max(order.stop_price, bar.open);
            shouldFill = true;
          }
        } else {
          // Sell stop: trigger if price <= stop
          if (bar.low <= order.stop_price) {
            fillPrice = Math.min(order.stop_price, bar.open);
            shouldFill = true;
          }
        }
        break;
        
      case 'STOP_LIMIT':
        // Stop limit: trigger stop first, then check limit
        if (!order.stop_price || !order.price) break;
        
        if (order.side === Side.BUY || order.side === Side.COVER) {
          if (bar.high >= order.stop_price && bar.low <= order.price) {
            fillPrice = order.price;
            shouldFill = true;
          }
        } else {
          if (bar.low <= order.stop_price && bar.high >= order.price) {
            fillPrice = order.price;
            shouldFill = true;
          }
        }
        break;
    }
    
    if (shouldFill && fillPrice !== null) {
      // Apply slippage
      fillPrice = this.applySlippage(fillPrice, order.side, bar);
      
      // Calculate commission
      const commission = this.calculateCommission(order.quantity, fillPrice);
      
      // Create fill
      const fill: Fill = {
        id: `FILL_${++this.fillIdCounter}`,
        order_id: order.id,
        symbol: order.symbol,
        side: order.side,
        quantity: Math.min(order.quantity - order.filled_quantity, order.quantity),
        price: fillPrice,
        timestamp: bar.timestamp,
        commission,
        liquidity: order.type === 'MARKET' ? 'TAKER' : 'MAKER'
      };
      
      return fill;
    }
    
    return null;
  }

  private getExecutionPrice(order: Order, bar: Bar): number {
    // For market orders, use a realistic price within the bar
    if (order.side === Side.BUY || order.side === Side.COVER) {
      // Buy at ask (approximated by using higher price)
      return bar.open < bar.close ? 
        bar.open + (bar.close - bar.open) * 0.6 : 
        bar.open;
    } else {
      // Sell at bid (approximated by using lower price)
      return bar.open > bar.close ? 
        bar.open - (bar.open - bar.close) * 0.6 : 
        bar.open;
    }
  }

  private applySlippage(price: number, side: Side, bar: Bar): number {
    const config = this.engine.config;
    const slippage = config.slippage || 0;
    
    if (slippage === 0) return price;
    
    // Calculate slippage based on volatility and volume
    const volatility = (bar.high - bar.low) / bar.open;
    const slippageMultiplier = 1 + (slippage * volatility);
    
    if (side === Side.BUY || side === Side.COVER) {
      // Buying: price goes up (worse for buyer)
      return new Decimal(price).mul(slippageMultiplier).toNumber();
    } else {
      // Selling: price goes down (worse for seller)
      return new Decimal(price).div(slippageMultiplier).toNumber();
    }
  }

  private calculateCommission(quantity: number, price: number): number {
    const config = this.engine.config;
    const commission = config.commission || 0;
    
    // Commission as percentage of trade value
    const tradeValue = new Decimal(quantity).mul(price);
    return tradeValue.mul(commission).toNumber();
  }

  private validateOrder(order: Order): boolean {
    // Basic validation
    if (order.quantity <= 0) return false;
    if (order.type === 'LIMIT' && !order.price) return false;
    if (order.type === 'STOP' && !order.stop_price) return false;
    if (order.type === 'STOP_LIMIT' && (!order.stop_price || !order.price)) return false;
    
    // Check risk limits
    // TODO: Add position size limits, buying power checks, etc.
    
    return true;
  }

  public getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  public getOpenOrders(symbol?: string): Order[] {
    return this.orderQueue.filter(o => 
      (!symbol || o.symbol === symbol) && 
      (o.status === OrderStatus.PENDING || o.status === OrderStatus.OPEN)
    );
  }
}