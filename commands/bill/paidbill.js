/**
 * /paidbill command handler
 * Đánh dấu hóa đơn đã thanh toán
 */

const Bill = require("../../models/Bill");
const { escapeMarkdown } = require("../../utils/response");

module.exports = {
  name: "paidbill",
  description: "Đánh dấu hóa đơn đã thanh toán",
  usage: "/paidbill <mã>",

  async execute(ctx, args) {
    if (args.length === 0) {
      return ctx.reply(
        `❌ *Thiếu mã hóa đơn!*\n\n` +
          `*Cách dùng:* /paidbill <mã>\n\n` +
          `Dùng /listbills để xem mã các hóa đơn`,
        { parse_mode: "Markdown" }
      );
    }

    const billCode = args[0];

    try {
      // Find the bill and check ownership
      const bill = await Bill.findOne({
        code: billCode,
        userId: ctx.from.id,
      });

      if (!bill) {
        return ctx.reply(
          `❌ *Không tìm thấy hóa đơn!*\n\n` +
            `Không tìm thấy hóa đơn với ID này hoặc bạn không có quyền truy cập.\n\n` +
            `Dùng /listbills để xem danh sách hóa đơn của bạn`,
          { parse_mode: "Markdown" }
        );
      }

      // Check if already paid
      if (bill.isPaid) {
        const paidDate = new Date(bill.paidDate).toLocaleDateString("vi-VN");
        return ctx.reply(
          `ℹ️ *Hóa đơn này đã được thanh toán!*\n\n` +
            `• Loại: ${bill.category.name}\n` +
            `• Số tiền: ${bill.amount.toLocaleString("vi-VN")} VNĐ\n` +
            `• Ngày thanh toán: ${paidDate}\n\n` +
            `Dùng /unpaidbill <mã> để đánh dấu chưa thanh toán`,
          { parse_mode: "Markdown" }
        );
      }

      // Mark as paid
      bill.isPaid = true;
      bill.paidDate = new Date();
      await bill.save();

      const billDate = new Date(bill.date).toLocaleDateString("vi-VN");
      const paidDate = new Date(bill.paidDate).toLocaleDateString("vi-VN");
      const formattedAmount = bill.amount.toLocaleString("vi-VN");

      await ctx.reply(
        `✅ *Đã đánh dấu hóa đơn đã thanh toán!*\n\n` +
          `📝 *Thông tin hóa đơn:*\n` +
          `• Loại: ${escapeMarkdown(bill.category.name)}\n` +
          `• Số tiền: ${formattedAmount} VNĐ\n` +
          `• Mô tả: ${escapeMarkdown(bill.description) || "Không có"}\n` +
          `• Ngày tạo: ${billDate}\n` +
          `• Ngày thanh toán: ${paidDate}\n` +
          `• Người trả: ${escapeMarkdown(bill.username)}\n\n` +
          `💡 Dùng /stats để xem thống kê chi tiêu`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error marking bill as paid:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi đánh dấu hóa đơn. Vui lòng kiểm tra ID và thử lại.`
      );
    }
  },
};
