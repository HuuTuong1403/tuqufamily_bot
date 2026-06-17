/**
 * /addbill command handler
 * Thêm hóa đơn chi tiêu
 * Cú pháp: /addbill <loại> <số tiền> [DD/MM/YYYY] <mô tả>
 */

const Bill = require("../../models/Bill");
const Category = require("../../models/Category");
const { escapeMarkdown } = require("../../utils/response");
const { parseDate } = require("../../utils/function");

module.exports = {
  name: "addbill",
  description: "Thêm hóa đơn sinh hoạt",
  usage: "/addbill <mã loại> <số tiền> [DD/MM/YYYY] <mô tả>",

  async execute(ctx, args) {
    if (args.length < 2) {
      // Get user's categories to show in help
      let categories = await Category.getCategories();
      if (categories.length === 0) {
        categories = await Category.initDefaultCategories();
      }

      const categoryList = categories
        .slice(0, 7)
        .map((c) => `• Mã ${c.code} - Tên: ${c.name}`)
        .join("\n");

      return ctx.reply(
        `❌ *Cú pháp không đúng!*\n\n` +
          `*Cách dùng:* /addbill <loại> <số tiền> [ngày] <mô tả>\n\n` +
          `*Một số loại hóa đơn:*\n` +
          `${categoryList}\n` +
          `${
            categories.length > 7
              ? `_...và ${categories.length - 7} loại khác_\n\n`
              : "\n"
          }` +
          `*Ví dụ:*\n` +
          `/addbill dien 500000 Tiền điện tháng 11\n` +
          `/addbill anuong 250000 15/11/2025 Đi chợ\n` +
          `/addbill nuoc 200000 01/10/2025 Tiền nước\n\n` +
          `💡 Ngày có format DD/MM/YYYY, để trống sẽ dùng ngày hôm nay\n\n` +
          `Dùng /categories để xem tất cả loại`,
        { parse_mode: "Markdown" }
      );
    }

    const category = args[0].toLowerCase();
    const amount = parseFloat(args[1]);

    // Check if args[2] is a date
    let billDate = new Date();
    let descriptionStartIndex = 2;

    if (args.length >= 3) {
      const parsedDate = parseDate(args[2]);
      if (parsedDate) {
        billDate = parsedDate;
        descriptionStartIndex = 3;
      }
    }

    const description = args.slice(descriptionStartIndex).join(" ");

    // Validate category from database
    const categoryExists = await Category.categoryExists(category);
    if (!categoryExists) {
      return ctx.reply(
        `❌ *Loại hóa đơn không tồn tại!*\n\n` +
          `Loại bạn vừa nhập chưa có trong danh sách của bạn.\n\n` +
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
      const categoryInfo = await Category.findOne({
        code: category,
      });

      const bill = await Bill.create({
        userId: ctx.from.id,
        username: ctx.from.username || ctx.from.first_name,
        category: { code: categoryInfo.code, name: categoryInfo.name },
        amount: amount,
        description: description,
        date: billDate,
        month: billDate.getMonth() + 1,
        year: billDate.getFullYear(),
      });

      // Increment category usage count
      await Category.incrementUsage(category);

      const formattedAmount = amount.toLocaleString("vi-VN");
      const displayCategory = `${categoryInfo.icon} ${categoryInfo.name}`;

      await ctx.reply(
        `✅ *Đã thêm hóa đơn thành công!*\n\n` +
          `📝 *Chi tiết:*\n` +
          `• Mã: \`${bill.code}\`\n` +
          `• Loại: ${displayCategory}\n` +
          `• Số tiền: ${formattedAmount} VNĐ\n` +
          `• Mô tả: ${escapeMarkdown(description) || "Không có"}\n` +
          `• Ngày: ${billDate.toLocaleDateString("vi-VN")}\n\n` +
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
