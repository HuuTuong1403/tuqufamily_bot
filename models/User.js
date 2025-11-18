const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      default: null,
    },
    firstName: {
      type: String,
      default: null,
    },
    lastName: {
      type: String,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Update last activity on every interaction
userSchema.methods.updateActivity = async function () {
  this.lastActivity = new Date();
  this.messageCount += 1;
  await this.save();
};

// Static method to find or create user
userSchema.statics.findOrCreate = async function (telegramUser) {
  let user = await this.findOne({ telegramId: telegramUser.id });

  if (!user) {
    user = await this.create({
      telegramId: telegramUser.id,
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
    });
    console.log(
      `✅ New user created: ${telegramUser.username || telegramUser.id}`
    );
  } else {
    // Update user info if changed
    user.username = telegramUser.username || user.username;
    user.firstName = telegramUser.first_name || user.firstName;
    user.lastName = telegramUser.last_name || user.lastName;
    await user.updateActivity();
  }

  return user;
};

module.exports = mongoose.model("User", userSchema);
