/**
 * /addbill command handler
 * Thêm hóa đơn chi tiêu
 * Cú pháp: /addbill <loại> <số tiền> <mô tả>
 */

const Bill = require("../../models/Bill");
const Category = require("../../models/Category");

module.exports = {
  name: "addbill",
  description: "Thêm hóa đơn sinh hoạt",
  usage: "/addbill <mã loại> <số tiền> <mô tả>",

  async execute(ctx, args) {
    if (args.length < 2) {
      // Get user's categories to show in help
      let categories = await Category.getUserCategories(ctx.from.id);
      if (categories.length === 0) {
        categories = await Category.initDefaultCategories(ctx.from.id);
      }

      const categoryList = categories
        .slice(0, 7)
        .map((c) => `• ${c.name}`)
        .join("\n");

      return ctx.reply(
        `❌ *Cú pháp không đúng!*\n\n` +
          `*Cách dùng:* /addbill <loại> <số tiền> <mô tả>\n\n` +
          `*Một số loại hóa đơn:*\n` +
          `${categoryList}\n` +
          `${
            categories.length > 7
              ? `_...và ${categories.length - 7} loại khác_\n\n`
              : "\n"
          }` +
          `*Ví dụ:*\n` +
          `/addbill dien 500000 Tiền điện tháng 11\n` +
          `/addbill an_uong 250000 Đi chợ cuối tuần\n\n` +
          `Dùng /categories để xem tất cả loại`,
        { parse_mode: "Markdown" }
      );
    }

    const category = args[0].toLowerCase();
    const amount = parseFloat(args[1]);
    const description = args.slice(2).join(" ");

    // Validate category from database
    const categoryExists = await Category.categoryExists(ctx.from.id, category);
    if (!categoryExists) {
      return ctx.reply(
        `❌ *Loại hóa đơn không tồn tại!*\n\n` +
          `Loại "${category}" chưa có trong danh sách của bạn.\n\n` +
          `Dùng /categories để xem danh sách loại\n` +
          `Hoặc /addcategory để thêm loại mới`,
        { parse_mode: "Markdown" }
      );
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return ctx.reply(
        `❌ *Số tiền không hợp lệ!*\n\nVui lòng nhập số tiền là một số dương.`,
        { parse_mode: "Markdown" }
      );
    }

    try {
      const now = new Date();
      const categoryInfo = await Category.findOne({
        userId: ctx.from.id,
        code: category,
      });

      const bill = await Bill.create({
        userId: ctx.from.id,
        username: ctx.from.username || ctx.from.first_name,
        category: { code: categoryInfo.code, name: categoryInfo.name },
        amount: amount,
        description: description,
        date: now,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });

      // Increment category usage count
      await Category.incrementUsage(ctx.from.id, category);
    

      const formattedAmount = amount.toLocaleString("vi-VN");
      const displayCategory = `${categoryInfo.icon} ${categoryInfo.name}`;

      await ctx.reply(
        `✅ *Đã thêm hóa đơn thành công!*\n\n` +
          `📝 *Chi tiết:*\n` +
          `• Loại: ${displayCategory}\n` +
          `• Số tiền: ${formattedAmount} VNĐ\n` +
          `• Mô tả: ${description || "Không có"}\n` +
          `• Ngày: ${now.toLocaleDateString("vi-VN")}\n\n` +
          `Dùng /listbills để xem tất cả hóa đơn`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error adding bill:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi lưu hóa đơn. Vui lòng thử lại sau.`,
        { parse_mode: "Markdown" }
      );
    }
  },
};
