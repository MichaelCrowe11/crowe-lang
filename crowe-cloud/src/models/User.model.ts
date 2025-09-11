import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  company?: string;
  role: 'user' | 'admin';
  
  // Subscription info
  subscriptionTier: 'hobby' | 'pro' | 'team' | 'enterprise';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: 'active' | 'trialing' | 'canceled' | 'past_due' | 'unpaid';
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  
  // Usage tracking
  usage: {
    buildMinutes: number;
    aiTokens: number;
    storageBytes: number;
    bandwidthBytes: number;
    lastResetAt: Date;
  };
  
  // Limits based on tier
  limits: {
    buildMinutesPerMonth: number;
    projectsMax: number;
    teamMembersMax: number;
    aiTokensPerMonth: number;
    storageGb: number;
    bandwidthGb: number;
  };
  
  // Account details
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  
  // Tracking
  lastLoginAt?: Date;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): string;
  generateVerificationToken(): string;
  resetUsage(): void;
  checkLimit(resource: string): boolean;
  incrementUsage(resource: string, amount: number): Promise<void>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  
  // Subscription
  subscriptionTier: {
    type: String,
    enum: ['hobby', 'pro', 'team', 'enterprise'],
    default: 'hobby',
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  subscriptionStatus: {
    type: String,
    enum: ['active', 'trialing', 'canceled', 'past_due', 'unpaid'],
    default: 'active',
  },
  trialEndsAt: Date,
  subscriptionEndsAt: Date,
  
  // Usage tracking
  usage: {
    buildMinutes: { type: Number, default: 0 },
    aiTokens: { type: Number, default: 0 },
    storageBytes: { type: Number, default: 0 },
    bandwidthBytes: { type: Number, default: 0 },
    lastResetAt: { type: Date, default: Date.now },
  },
  
  // Limits
  limits: {
    buildMinutesPerMonth: { type: Number, default: 100 }, // Hobby tier default
    projectsMax: { type: Number, default: 3 },
    teamMembersMax: { type: Number, default: 1 },
    aiTokensPerMonth: { type: Number, default: 0 },
    storageGb: { type: Number, default: 1 },
    bandwidthGb: { type: Number, default: 5 },
  },
  
  // Account
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  
  // Tracking
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ stripeCustomerId: 1 });
UserSchema.index({ subscriptionTier: 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Update limits when subscription tier changes
UserSchema.pre('save', function(next) {
  if (!this.isModified('subscriptionTier')) return next();
  
  const tierLimits = {
    hobby: {
      buildMinutesPerMonth: 100,
      projectsMax: 3,
      teamMembersMax: 1,
      aiTokensPerMonth: 0,
      storageGb: 1,
      bandwidthGb: 5,
    },
    pro: {
      buildMinutesPerMonth: 1000,
      projectsMax: -1, // unlimited
      teamMembersMax: 1,
      aiTokensPerMonth: 10000,
      storageGb: 10,
      bandwidthGb: 50,
    },
    team: {
      buildMinutesPerMonth: 5000,
      projectsMax: -1,
      teamMembersMax: 10,
      aiTokensPerMonth: -1, // unlimited
      storageGb: 100,
      bandwidthGb: 500,
    },
    enterprise: {
      buildMinutesPerMonth: -1,
      projectsMax: -1,
      teamMembersMax: -1,
      aiTokensPerMonth: -1,
      storageGb: -1,
      bandwidthGb: -1,
    },
  };
  
  this.limits = tierLimits[this.subscriptionTier];
  next();
});

// Methods
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAuthToken = function(): string {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
      tier: this.subscriptionTier,
    },
    process.env.JWT_SECRET || 'secret',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

UserSchema.methods.generateVerificationToken = function(): string {
  const token = jwt.sign(
    { id: this._id, purpose: 'email_verification' },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );
  this.emailVerificationToken = token;
  return token;
};

UserSchema.methods.resetUsage = function(): void {
  this.usage = {
    buildMinutes: 0,
    aiTokens: 0,
    storageBytes: 0,
    bandwidthBytes: 0,
    lastResetAt: new Date(),
  };
};

UserSchema.methods.checkLimit = function(resource: string): boolean {
  const limitKey = `${resource}PerMonth`;
  const usageKey = resource;
  
  if (this.limits[limitKey] === -1) return true; // Unlimited
  
  return this.usage[usageKey] < this.limits[limitKey];
};

UserSchema.methods.incrementUsage = async function(resource: string, amount: number): Promise<void> {
  this.usage[resource] += amount;
  await this.save();
};

// Virtual for display name
UserSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Virtual for subscription info
UserSchema.virtual('isSubscribed').get(function() {
  return this.subscriptionTier !== 'hobby' && this.subscriptionStatus === 'active';
});

UserSchema.virtual('isTrialing').get(function() {
  return this.subscriptionStatus === 'trialing' && this.trialEndsAt && this.trialEndsAt > new Date();
});

export const User = mongoose.model<IUser>('User', UserSchema);