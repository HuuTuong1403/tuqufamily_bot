/**
 * /categories command handler
 * Hiển thị danh sách tất cả các loại hóa đơn của người dùng
 */

const Category = require("../../models/Category");

module.exports = {
  name: "categories",
  description: "Xem danh sách loại hóa đơn",

  async execute(ctx) {
    try {
      // Initialize default categories if user has none
      let categories = await Category.getUserCategories(ctx.from.id);

      if (categories.length === 0) {
        categories = await Category.initDefaultCategories(ctx.from.id);
      }

      let message = `📋 *Danh sách loại hóa đơn của bạn*\n\n`;

      // Group by default and custom
      const defaultCategories = categories.filter((c) => c.isDefault);
      const customCategories = categories.filter((c) => !c.isDefault);

      if (defaultCategories.length > 0) {
        message += `*🔧 Loại mặc định:*\n`;
        defaultCategories.forEach((cat) => {
          const usage = cat.usageCount > 0 ? ` (${cat.usageCount}x)` : "";
          message += `${cat.icon} *${cat.name}* - ${cat.description}${usage}\n`;
        });
        message += `\n`;
      }

      if (customCategories.length > 0) {
        message += `*⭐ Loại tùy chỉnh:*\n`;
        customCategories.forEach((cat) => {
          const usage = cat.usageCount > 0 ? ` (${cat.usageCount}x)` : "";
          message += `${cat.icon} *${cat.name}* - ${cat.description}${usage}\n`;
        });
        message += `\n`;
      }

      message += `📊 *Tổng số:* ${categories.length} loại\n\n`;

      message += `*💡 Các lệnh quản lý:*\n`;
      message += `• /addcategory - Thêm loại mới\n`;
      message += `• /editcategory - Sửa loại\n`;
      message += `• /deletecategory - Xóa loại\n\n`;

      message += `*🔍 Cách dùng:*\n`;
      message += `\`/addbill <loại> <số tiền> <mô tả>\`\n`;
      message += `Ví dụ: \`/addbill điện 500000 Tiền điện\``;

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error listing categories:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi lấy danh sách loại. Vui lòng thử lại sau.`
      );
    }
  },
};
