const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      index: true,
      unique: true,
    },
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
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidDate: {
      type: Date,
      default: null,
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

// Static method to generate next bill code
billSchema.statics.getNextCode = async function () {
  // Find all bills with bill codes
  const bills = await this.find({ code: /^bill\d+$/ }, { code: 1 }).lean();

  if (bills.length === 0) {
    return "bill1";
  }

  // Extract all numbers and find the maximum
  const numbers = bills.map((bill) => {
    const match = bill.code.match(/^bill(\d+)$/);
    return match ? parseInt(match[1]) : 0;
  });

  const maxNumber = Math.max(...numbers);
  return `bill${maxNumber + 1}`;
};

// Pre-save hook to auto-generate code if not provided
billSchema.pre("save", async function (next) {
  if (this.isNew && !this.code) {
    this.code = await this.constructor.getNextCode();
  }
  next();
});

module.exports = mongoose.model("Bill", billSchema);
