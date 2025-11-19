/**
 * /deletebill command handler
 * Xóa hóa đơn theo ID
 */

const Bill = require("../../models/Bill");

module.exports = {
  name: "deletebill",
  description: "Xóa hóa đơn",
  usage: "/deletebill <mã>",

  async execute(ctx, args) {
    if (args.length === 0) {
      return ctx.reply(
        `❌ *Thiếu mã hóa đơn!*\n\n` +
          `*Cách dùng:* /deletebill <mã>\n\n` +
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
            `Không tìm thấy hóa đơn với ID này hoặc bạn không có quyền xóa.\n\n` +
            `Dùng /listbills để xem danh sách hóa đơn của bạn`,
          { parse_mode: "Markdown" }
        );
      }

      // Save bill info before deletion
      const billInfo = {
        category: bill.category,
        amount: bill.amount,
        description: bill.description,
        date: new Date(bill.date).toLocaleDateString("vi-VN"),
      };

      // Delete the bill
      await Bill.deleteOne({ code: billCode });

      const formattedAmount = billInfo.amount.toLocaleString("vi-VN");

      await ctx.reply(
        `✅ *Đã xóa hóa đơn thành công!*\n\n` +
          `📝 *Thông tin hóa đơn đã xóa:*\n` +
          `• Loại: ${billInfo.category}\n` +
          `• Số tiền: ${formattedAmount} VNĐ\n` +
          `• Mô tả: ${billInfo.description || "Không có"}\n` +
          `• Ngày: ${billInfo.date}`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error deleting bill:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi xóa hóa đơn. Vui lòng kiểm tra ID và thử lại.`
      );
    }
  },
};
