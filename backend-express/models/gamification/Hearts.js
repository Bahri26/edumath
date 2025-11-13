// backend-express/models/gamification/Hearts.js
const mongoose = require('mongoose');

const heartsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentHearts: {
    type: Number,
    default: 5,
    min: 0,
    max: 5
  },
  maxHearts: {
    type: Number,
    default: 5
  },
  lastRefillTime: {
    type: Date,
    default: Date.now
  },
  // Refill rate: 1 heart every X minutes
  refillRateMinutes: {
    type: Number,
    default: 30
  },
  // Total hearts lost (all time)
  totalHeartsLost: {
    type: Number,
    default: 0
  },
  // Unlimited hearts until this date (premium feature)
  unlimitedUntil: {
    type: Date,
    default: null
  },
  // History
  heartHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    change: Number, // +1 or -1
    reason: {
      type: String,
      enum: ['lost', 'refilled', 'purchased', 'bonus', 'practice']
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InteractiveExercise'
    }
  }]
}, { timestamps: true });

// Methods
heartsSchema.methods.loseHeart = async function(exerciseId) {
  if (this.hasUnlimitedHearts()) {
    return { currentHearts: this.currentHearts, unlimited: true };
  }

  if (this.currentHearts > 0) {
    this.currentHearts -= 1;
    this.totalHeartsLost += 1;
    this.heartHistory.push({
      change: -1,
      reason: 'lost',
      exerciseId
    });
    await this.save();
  }

  return { 
    currentHearts: this.currentHearts, 
    canContinue: this.currentHearts > 0,
    unlimited: false
  };
};

heartsSchema.methods.refillHearts = async function() {
  if (this.hasUnlimitedHearts()) {
    return { currentHearts: this.currentHearts, unlimited: true };
  }

  const now = new Date();
  const timeSinceLastRefill = (now - this.lastRefillTime) / (1000 * 60); // minutes
  const heartsToRefill = Math.floor(timeSinceLastRefill / this.refillRateMinutes);

  if (heartsToRefill > 0) {
    const heartsAdded = Math.min(heartsToRefill, this.maxHearts - this.currentHearts);
    this.currentHearts = Math.min(this.currentHearts + heartsAdded, this.maxHearts);
    this.lastRefillTime = now;
    
    if (heartsAdded > 0) {
      this.heartHistory.push({
        change: heartsAdded,
        reason: 'refilled'
      });
    }
    
    await this.save();
  }

  return { 
    currentHearts: this.currentHearts,
    nextRefillIn: this.getTimeUntilNextRefill(),
    unlimited: false
  };
};

heartsSchema.methods.addHearts = async function(amount, reason = 'bonus') {
  this.currentHearts = Math.min(this.currentHearts + amount, this.maxHearts);
  this.heartHistory.push({
    change: amount,
    reason
  });
  await this.save();
  return { currentHearts: this.currentHearts };
};

heartsSchema.methods.buyUnlimitedHearts = async function(durationDays = 1) {
  const unlimitedDate = new Date();
  unlimitedDate.setDate(unlimitedDate.getDate() + durationDays);
  this.unlimitedUntil = unlimitedDate;
  await this.save();
  return { unlimitedUntil: this.unlimitedUntil };
};

heartsSchema.methods.hasUnlimitedHearts = function() {
  return this.unlimitedUntil && this.unlimitedUntil > new Date();
};

heartsSchema.methods.getTimeUntilNextRefill = function() {
  if (this.currentHearts >= this.maxHearts) return 0;
  
  const now = new Date();
  const timeSinceLastRefill = (now - this.lastRefillTime) / (1000 * 60); // minutes
  const timeUntilNext = this.refillRateMinutes - (timeSinceLastRefill % this.refillRateMinutes);
  return Math.ceil(timeUntilNext);
};

heartsSchema.methods.getTimeUntilFullRefill = function() {
  const heartsNeeded = this.maxHearts - this.currentHearts;
  const minutesNeeded = heartsNeeded * this.refillRateMinutes;
  const timeUntilNext = this.getTimeUntilNextRefill();
  return timeUntilNext + ((heartsNeeded - 1) * this.refillRateMinutes);
};

// Static methods
heartsSchema.statics.getOrCreate = async function(userId) {
  let hearts = await this.findOne({ userId });
  if (!hearts) {
    hearts = await this.create({ userId });
  } else {
    // Auto-refill when fetched
    await hearts.refillHearts();
  }
  return hearts;
};

module.exports = mongoose.model('Hearts', heartsSchema);
