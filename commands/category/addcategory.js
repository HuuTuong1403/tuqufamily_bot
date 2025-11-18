/**
 * /addcategory command handler
 * Thêm loại hóa đơn mới
 */

const Category = require("../../models/Category");

module.exports = {
  name: "addcategory",
  description: "Thêm loại hóa đơn mới",
  usage: "/addcategory <mã> <tên> [icon] [mô tả]",

  async execute(ctx, args) {
    console.log("🚀 => args:", args);
    if (args.length < 2) {
      return ctx.reply(
        `❌ *Cú pháp không đúng!*\n\n` +
          `*Cách dùng:* /addcategory <mã> <tên> [icon] [mô tả]\n\n` +
          `*Ví dụ:*\n` +
          `/addcategory "y_te" "Y tế" 💊 "Khám bệnh, thuốc men"\n` +
          `/addcategory "giao_thong" "Giao thông" 🚗\n` +
          `/addcategory laptop Laptop 💻\n\n` +
          `💡 *Lưu ý:* Nếu tên có khoảng trắng, đặt trong dấu ngoặc kép`,
        { parse_mode: "Markdown" }
      );
    }

    const code = args[0].toLowerCase();
    const name = args[1].split("_").join(" ");
    const icon = args.length >= 3 && args[2].length <= 2 ? args[2] : "📦";
    const description = args.slice(icon === "📦" ? 2 : 3).join(" ") || "";

    // Validate name
    if (name.length < 2 || name.length > 30) {
      return ctx.reply(`❌ Tên loại phải từ 2-30 ký tự!`, {
        parse_mode: "Markdown",
      });
    }

    try {
      // Check if category already exists
      const exists = await Category.categoryExists(ctx.from.id, code);
      if (exists) {
        return ctx.reply(
          `❌ *Loại hóa đơn đã tồn tại!*\n\n` +
            `Loại "${code}" đã có trong danh sách của bạn.\n\n` +
            `Dùng /categories để xem tất cả loại`,
          { parse_mode: "Markdown" }
        );
      }

      // Create new category
      const category = await Category.create({
        userId: ctx.from.id,
        code: code,
        name: name,
        icon: icon,
        description: description,
        isDefault: false,
      });

      await ctx.reply(
        `✅ *Đã thêm loại hóa đơn mới!*\n\n` +
          `${icon} *${name}*\n` +
          `• Mô tả: ${description || "Không có"}\n\n` +
          `Bây giờ bạn có thể dùng:\n` +
          `/addbill ${name} <số tiền> <mô tả>`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error adding category:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi thêm loại hóa đơn. Vui lòng thử lại sau.`
      );
    }
  },
};
