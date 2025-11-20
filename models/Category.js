/**
 * Category Model
 * Lưu trữ các loại hóa đơn do người dùng tự định nghĩa
 */

const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
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
categorySchema.index({ code: 1 }, { unique: true });

// Static method to get user's categories
categorySchema.statics.getCategories = async function () {
  return await this.find().sort({ usageCount: -1, displayName: 1 });
};

// Static method to find or create default categories for new user
categorySchema.statics.initDefaultCategories = async function () {
  const defaultCategories = [
    {
      code: "thuenha",
      name: "Thuê nhà",
      icon: "🏠",
      description: "Tiền thuê nhà, phòng trọ",
    },
    {
      code: "anuong",
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

  const existingCount = await this.countDocuments({});

  if (existingCount === 0) {
    const categories = defaultCategories.map((cat) => ({
      ...cat,

      isDefault: true,
    }));

    await this.insertMany(categories);
    console.log(`✅ Initialized ${categories.length} default categories`);
  }

  return await this.getCategories();
};

// Static method to increment usage count
categorySchema.statics.incrementUsage = async function (categoryCode) {
  await this.updateOne({ code: categoryCode }, { $inc: { usageCount: 1 } });
};

// Static method to check if category exists
categorySchema.statics.categoryExists = async function (categoryCode) {
  const count = await this.countDocuments({
    code: categoryCode,
  });
  return count > 0;
};

module.exports = mongoose.model("Category", categorySchema);
