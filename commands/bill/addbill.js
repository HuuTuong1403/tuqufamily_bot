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

  /**
   * Bàn phím chọn cách nhập hóa đơn (nhập tay hoặc chọn loại).
   */
  startKeyboard() {
    return {
      inline_keyboard: [
        [{ text: "✍️ Nhập tay", callback_data: "ab:manual" }],
        [{ text: "📂 Chọn loại", callback_data: "ab:cats:0" }],
        [{ text: "❌ Hủy", callback_data: "ab:cancel" }],
      ],
    };
  },

  /**
   * Tạo hóa đơn và gửi xác nhận. Dùng chung cho lệnh trực tiếp và flow tương tác.
   * Trả về bill đã tạo hoặc null nếu lỗi.
   */
  async createBill(ctx, { categoryCode, amount, date, description }) {
    const categoryInfo = await Category.findOne({ code: categoryCode });
    if (!categoryInfo) {
      await ctx.reply(
        `❌ *Loại hóa đơn không tồn tại!*\n\nDùng /categories để xem danh sách.`,
        { parse_mode: "Markdown" }
      );
      return null;
    }

    const billDate = date || new Date();
    const bill = await Bill.create({
      userId: ctx.from.id,
      username: ctx.from.username || ctx.from.first_name,
      category: { code: categoryInfo.code, name: categoryInfo.name },
      amount,
      description: description || "",
      date: billDate,
      month: billDate.getMonth() + 1,
      year: billDate.getFullYear(),
    });

    await Category.incrementUsage(categoryInfo.code);

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

    return bill;
  },

  async execute(ctx, args) {
    // Không có đủ tham số -> mở flow tương tác bằng inline keyboard
    if (args.length < 2) {
      return ctx.reply(
        `🧾 *Thêm hóa đơn mới*\n\nBạn muốn nhập theo cách nào?`,
        { parse_mode: "Markdown", reply_markup: this.startKeyboard() }
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
      await this.createBill(ctx, {
        categoryCode: category,
        amount,
        date: billDate,
        description,
      });
    } catch (error) {
      console.error("Error adding bill:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi lưu hóa đơn. Vui lòng thử lại sau.`,
        { parse_mode: "Markdown" }
      );
    }
  },
};
