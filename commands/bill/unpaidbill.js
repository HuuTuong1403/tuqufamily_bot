/**
 * /unpaidbill command handler
 * Đánh dấu hóa đơn chưa thanh toán
 */

const Bill = require("../../models/Bill");

module.exports = {
  name: "unpaidbill",
  description: "Đánh dấu hóa đơn chưa thanh toán",
  usage: "/unpaidbill <mã>",

  async execute(ctx, args) {
    if (args.length === 0) {
      return ctx.reply(
        `❌ *Thiếu mã hóa đơn!*\n\n` +
          `*Cách dùng:* /unpaidbill <mã>\n\n` +
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

      // Check if already unpaid
      if (!bill.isPaid) {
        return ctx.reply(
          `ℹ️ *Hóa đơn này chưa được thanh toán!*\n\n` +
            `• Loại: ${bill.category.name}\n` +
            `• Số tiền: ${bill.amount.toLocaleString("vi-VN")} VNĐ\n` +
            `• Trạng thái: Chưa thanh toán\n\n` +
            `Dùng /paidbill <mã> để đánh dấu đã thanh toán`,
          { parse_mode: "Markdown" }
        );
      }

      // Mark as unpaid
      bill.isPaid = false;
      bill.paidDate = null;
      await bill.save();

      const billDate = new Date(bill.date).toLocaleDateString("vi-VN");
      const formattedAmount = bill.amount.toLocaleString("vi-VN");

      await ctx.reply(
        `✅ *Đã đánh dấu hóa đơn chưa thanh toán!*\n\n` +
          `📝 *Thông tin hóa đơn:*\n` +
          `• Loại: ${bill.category.name}\n` +
          `• Số tiền: ${formattedAmount} VNĐ\n` +
          `• Mô tả: ${bill.description || "Không có"}\n` +
          `• Ngày tạo: ${billDate}\n` +
          `• Người trả: ${bill.username}\n` +
          `• Trạng thái: Chưa thanh toán\n\n` +
          `💡 Dùng /paidbill <ID> để đánh dấu đã thanh toán`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error marking bill as unpaid:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi đánh dấu hóa đơn. Vui lòng kiểm tra ID và thử lại.`
      );
    }
  },
};
