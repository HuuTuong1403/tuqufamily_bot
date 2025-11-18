/**
 * Category Model
 * Lưu trữ các loại hóa đơn do người dùng tự định nghĩa
 */

const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "📦",
    },
    description: {
      type: String,
      default: "",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index for userId and name combination
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Static method to get user's categories
categorySchema.statics.getUserCategories = async function (userId) {
  return await this.find({ userId }).sort({ usageCount: -1, displayName: 1 });
};

// Static method to find or create default categories for new user
categorySchema.statics.initDefaultCategories = async function (userId) {
  const defaultCategories = [
    {
      code: "thue_nha",
      name: "Thuê nhà",
      icon: "🏠",
      description: "Tiền thuê nhà, phòng trọ",
    },
    {
      code: "an_uong",
      name: "Ăn uống",
      icon: "🍜",
      description: "Đi chợ, ăn ngoài, thực phẩm",
    },
    {
      code: "khac",
      name: "Khác",
      icon: "📦",
      description: "Chi phí khác",
    },
  ];

  const existingCount = await this.countDocuments({ userId });

  if (existingCount === 0) {
    const categories = defaultCategories.map((cat) => ({
      ...cat,
      userId,
      isDefault: true,
    }));

    await this.insertMany(categories);
    console.log(
      `✅ Initialized ${categories.length} default categories for user ${userId}`
    );
  }

  return await this.getUserCategories(userId);
};

// Static method to increment usage count
categorySchema.statics.incrementUsage = async function (userId, categoryCode) {
  await this.updateOne(
    { userId, name: categoryCode.toLowerCase() },
    { $inc: { usageCount: 1 } }
  );
};

// Static method to check if category exists
categorySchema.statics.categoryExists = async function (userId, categoryCode) {
  const count = await this.countDocuments({
    userId,
    name: categoryCode.toLowerCase(),
  });
  return count > 0;
};

module.exports = mongoose.model("Category", categorySchema);
