/**
 * /deletecategory command handler
 * Xóa loại hóa đơn
 */

const Category = require("../../models/Category");
const Bill = require("../../models/Bill");

module.exports = {
  name: "deletecategory",
  description: "Xóa loại hóa đơn",
  usage: "/deletecategory <mã>",

  async execute(ctx, args) {
    if (args.length === 0) {
      return ctx.reply(
        `❌ *Thiếu mã loại!*\n\n` +
          `*Cách dùng:* /deletecategory <mã>\n\n` +
          `*Ví dụ:*\n` +
          `/deletecategory yte\n` +
          `/deletecategory giaothong\n\n` +
          `Dùng /categories để xem danh sách`,
        { parse_mode: "Markdown" }
      );
    }

    const code = args[0].toLowerCase();

    try {
      // Find the category
      const category = await Category.findOne({
        userId: ctx.from.id,
        code: code,
      });

      if (!category) {
        return ctx.reply(
          `❌ *Không tìm thấy loại!*\n\n` +
            `Không tìm thấy loại bạn cần xóa trong danh sách của bạn.\n\n` +
            `Dùng /categories để xem danh sách`,
          { parse_mode: "Markdown" }
        );
      }

      // Check if it's a default category
      if (category.isDefault) {
        return ctx.reply(
          `⚠️ *Không thể xóa loại mặc định!*\n\n` +
            `Loại "${category.name}" là loại mặc định và không thể xóa.\n\n` +
            `Bạn chỉ có thể xóa các loại tự tạo.`,
          { parse_mode: "Markdown" }
        );
      }

      // Check if there are bills using this category
      const billCount = await Bill.countDocuments({
        userId: ctx.from.id,
        category: code,
      });

      if (billCount > 0) {
        return ctx.reply(
          `⚠️ *Cảnh báo!*\n\n` +
            `Có ${billCount} hóa đơn đang sử dụng loại "${billCount.category.name}".\n\n` +
            `Nếu xóa loại này, các hóa đơn sẽ không bị xóa nhưng sẽ hiển thị loại không xác định.\n\n` +
            `Để xác nhận xóa, dùng:\n` +
            `/deletecategory ${code} confirm`,
          { parse_mode: "Markdown" }
        );
      }

      // If confirm argument is provided or no bills exist, delete
      if (args.length >= 2 && args[1] === "confirm") {
        await Category.deleteOne({ _id: category._id });

        await ctx.reply(
          `✅ *Đã xóa loại hóa đơn!*\n\n` +
            `${category.icon} *${category.name}* đã được xóa khỏi danh sách.` +
            (billCount > 0
              ? `\n\n⚠️ ${billCount} hóa đơn cũ vẫn giữ nguyên.`
              : ""),
          { parse_mode: "Markdown" }
        );
      } else {
        // No bills, can delete directly
        await Category.deleteOne({ _id: category._id });

        await ctx.reply(
          `✅ *Đã xóa loại hóa đơn!*\n\n` +
            `${category.icon} *${category.name}* đã được xóa khỏi danh sách.`,
          { parse_mode: "Markdown" }
        );
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      await ctx.reply(`❌ Có lỗi xảy ra khi xóa loại. Vui lòng thử lại sau.`);
    }
  },
};
