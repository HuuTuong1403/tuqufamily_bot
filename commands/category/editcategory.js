/**
 * /editcategory command handler
 * Sửa thông tin loại hóa đơn
 */

const Category = require("../../models/Category");

module.exports = {
  name: "editcategory",
  description: "Sửa loại hóa đơn",
  usage: "/editcategory <mã> <trường> <giá trị>",

  async execute(ctx, args) {
    if (args.length < 3) {
      return ctx.reply(
        `❌ *Cú pháp không đúng!*\n\n` +
          `*Cách dùng:* /editcategory <mã> <trường> <giá trị>\n\n` +
          `*Các trường có thể sửa:*\n` +
          `• name - Tên hiển thị\n` +
          `• icon - Icon (emoji)\n` +
          `• description - Mô tả\n\n` +
          `*Ví dụ:*\n` +
          `/editcategory "y tế" icon 💊\n` +
          `/editcategory laptop name "Máy tính"\n` +
          `/editcategory gas description "Gas nấu ăn hàng tháng"`,
        { parse_mode: "Markdown" }
      );
    }

    const code = args[0].toLowerCase();
    const field = args[1].toLowerCase();
    const value = args.slice(2).join(" ");

    // Validate field
    const allowedFields = ["name", "displayname", "icon", "description"];
    if (!allowedFields.includes(field)) {
      return ctx.reply(
        `❌ *Trường không hợp lệ!*\n\n` +
          `Các trường có thể sửa: name, icon, description`,
        { parse_mode: "Markdown" }
      );
    }

    try {
      // Find the category
      const category = await Category.findOne({
        code: code,
      });

      if (!category) {
        return ctx.reply(
          `❌ *Không tìm thấy loại!*\n\n` +
            `Không tìm thấy loại bạn cần sửa trong danh sách.\n\n` +
            `Dùng /categories để xem danh sách`,
          { parse_mode: "Markdown" }
        );
      }

      // Update the field
      const updates = {};
      switch (field) {
        case "name":
        case "displayname":
          updates.name = value;
          break;
        case "icon":
          updates.icon = value.length <= 2 ? value : "📦";
          break;
        case "description":
          updates.description = value;
          break;
      }

      await Category.updateOne({ _id: category._id }, updates);

      const updatedCategory = await Category.findById(category._id);

      await ctx.reply(
        `✅ *Đã cập nhật loại hóa đơn!*\n\n` +
          `${updatedCategory.icon} *${updatedCategory.code}*\n` +
          `• Tên: ${updatedCategory.name}\n` +
          `• Mô tả: ${updatedCategory.description || "Không có"}\n` +
          `• Đã dùng: ${updatedCategory.usageCount} lần`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error editing category:", error);
      await ctx.reply(`❌ Có lỗi xảy ra khi sửa loại. Vui lòng thử lại sau.`);
    }
  },
};
