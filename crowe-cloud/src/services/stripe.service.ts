import Stripe from 'stripe';
import { logger } from '../server';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  HOBBY: 'hobby',
  PRO: 'pro',
  TEAM: 'team',
  ENTERPRISE: 'enterprise'
} as const;

export const PRICE_IDS = {
  [SUBSCRIPTION_TIERS.PRO]: process.env.STRIPE_PRICE_ID_PRO || 'price_pro',
  [SUBSCRIPTION_TIERS.TEAM]: process.env.STRIPE_PRICE_ID_TEAM || 'price_team',
  [SUBSCRIPTION_TIERS.ENTERPRISE]: process.env.STRIPE_PRICE_ID_ENTERPRISE || 'price_enterprise',
};

export class StripeService {
  /**
   * Create a Stripe customer
   */
  async createCustomer(email: string, name: string, metadata?: any) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          ...metadata,
          platform: 'crowe-cloud'
        }
      });
      return customer;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: any
  ) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        subscription_data: {
          trial_period_days: 14, // 14-day free trial
          metadata
        },
        allow_promotion_codes: true,
      });
      return session;
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create a customer portal session
   */
  async createPortalSession(customerId: string, returnUrl: string) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session;
    } catch (error) {
      logger.error('Error creating portal session:', error);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, immediately = false) {
    try {
      if (immediately) {
        return await stripe.subscriptions.cancel(subscriptionId);
      } else {
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      }
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscription(subscriptionId: string, newPriceId: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });
      
      return updatedSubscription;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Create usage record for metered billing
   */
  async recordUsage(subscriptionItemId: string, quantity: number, timestamp?: number) {
    try {
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          action: 'increment',
        }
      );
      return usageRecord;
    } catch (error) {
      logger.error('Error recording usage:', error);
      throw error;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(payload: Buffer, signature: string) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      logger.info(`Stripe webhook received: ${event.type}`);

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
          
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
          
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
          
        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Webhook error:', error);
      throw error;
    }
  }

  // Webhook handlers
  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    logger.info(`Subscription created: ${subscription.id}`);
    // Update user's subscription status in database
    // Send welcome email
    // Provision resources
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    logger.info(`Subscription updated: ${subscription.id}`);
    // Update user's plan in database
    // Adjust resource limits
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    logger.info(`Subscription deleted: ${subscription.id}`);
    // Downgrade user to free tier
    // Clean up resources
    // Send cancellation email
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    logger.info(`Payment succeeded for invoice: ${invoice.id}`);
    // Update payment status
    // Send receipt email
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    logger.info(`Payment failed for invoice: ${invoice.id}`);
    // Send payment failed email
    // Retry payment or suspend account
  }

  /**
   * Create promo code
   */
  async createPromoCode(percentOff: number, duration: 'once' | 'forever' | 'repeating', code: string) {
    try {
      const coupon = await stripe.coupons.create({
        percent_off: percentOff,
        duration,
        duration_in_months: duration === 'repeating' ? 3 : undefined,
        metadata: {
          campaign: 'early_adopter'
        }
      });

      const promoCode = await stripe.promotionCodes.create({
        coupon: coupon.id,
        code,
        max_redemptions: 100,
        expires_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      });

      return promoCode;
    } catch (error) {
      logger.error('Error creating promo code:', error);
      throw error;
    }
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(startDate: Date, endDate: Date) {
    try {
      // Get all charges in date range
      const charges = await stripe.charges.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000),
        },
        limit: 100,
      });

      // Calculate metrics
      const totalRevenue = charges.data.reduce((sum, charge) => sum + charge.amount, 0) / 100;
      const successfulCharges = charges.data.filter(c => c.paid).length;
      const failedCharges = charges.data.filter(c => !c.paid).length;

      // Get active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        status: 'active',
        limit: 100,
      });

      const mrr = subscriptions.data.reduce((sum, sub) => {
        const amount = sub.items.data.reduce((itemSum, item) => {
          return itemSum + (item.price.unit_amount || 0) * (item.quantity || 1);
        }, 0);
        return sum + amount;
      }, 0) / 100;

      return {
        totalRevenue,
        mrr,
        arr: mrr * 12,
        activeSubscriptions: subscriptions.data.length,
        successfulCharges,
        failedCharges,
        churnRate: this.calculateChurnRate(subscriptions.data),
      };
    } catch (error) {
      logger.error('Error getting revenue metrics:', error);
      throw error;
    }
  }

  private calculateChurnRate(subscriptions: Stripe.Subscription[]) {
    // Simple churn calculation - would need historical data for accuracy
    const canceledCount = subscriptions.filter(s => s.cancel_at_period_end).length;
    return subscriptions.length > 0 ? (canceledCount / subscriptions.length) * 100 : 0;
  }
}

export const stripeService = new StripeService();