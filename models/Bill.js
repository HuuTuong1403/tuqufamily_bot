const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      index: true,
    },
    username: {
      type: String,
      default: null,
    },
    category: {
      type: Object,
      required: true,
      default: { code: "khac", name: "Khác" },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
billSchema.index({ userId: 1, month: 1, year: 1 });
billSchema.index({ category: 1 });

// Static method to get total by category
billSchema.statics.getTotalByCategory = async function (userId, month, year) {
  return await this.aggregate([
    {
      $match: {
        userId: userId,
        month: month,
        year: year,
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);
};

// Static method to get monthly total
billSchema.statics.getMonthlyTotal = async function (userId, month, year) {
  const result = await this.aggregate([
    {
      $match: {
        userId: userId,
        month: month,
        year: year,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0 ? result[0] : { total: 0, count: 0 };
};

module.exports = mongoose.model("Bill", billSchema);
