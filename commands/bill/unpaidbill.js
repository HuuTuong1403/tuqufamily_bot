/**
 * /unpaidbill command handler
 * Đánh dấu hóa đơn chưa thanh toán
 */

const Bill = require("../../models/Bill");
const { parseDate, parseMonthYear } = require("../../utils/function");
const { escapeMarkdown } = require("../../utils/response");

module.exports = {
  name: "unpaidbill",
  description: "Đánh dấu hóa đơn chưa thanh toán",
  usage: "/unpaidbill <all | mã | ngày/tháng/năm | tháng/năm>",

  async unpaidBills(ctx, bills) {
    if (bills.length === 0) {
      ctx.reply(
        `❌ *Không tìm thấy hóa đơn!*\n\n` +
          `Không tìm thấy hóa đơn của bạn.\n\n` +
          `Dùng /listbills để xem danh sách hóa đơn của bạn`,
        { parse_mode: "Markdown" }
      );
      return false;
    }

    const billCodeList = bills.map((bill) => bill.code);

    await Bill.updateMany(
      { code: { $in: billCodeList } },
      { isPaid: false, paidDate: null }
    );

    return true;
  },

  async execute(ctx, args) {
    if (args.length === 0) {
      return ctx.reply(
        `❌ *Thiếu mã hóa đơn!*\n\n` +
          `*Cách dùng:* /unpaidbill <all | mã | ngày/tháng/năm | tháng/năm>\n\n` +
          `Dùng /listbills để xem mã các hóa đơn`,
        { parse_mode: "Markdown" }
      );
    }

    const firstArgs = args[0];

    try {
      if (firstArgs === "all") {
        const bills = await Bill.find({ userId: ctx.from.id, isPaid: true });

        const result = await this.unpaidBills(ctx, bills);
        if (!result) {
          return;
        }

        return ctx.reply(
          `✅ *Đã đánh dấu chưa thanh toán cho tất cả hóa đơn của bạn!*`
        );
      } else if (parseDate(firstArgs)) {
        const date = parseDate(firstArgs);

        const bills = await Bill.find({
          date: date,
          userId: ctx.from.id,
          isPaid: true,
        });

        const result = await this.unpaidBills(ctx, bills);
        if (!result) {
          return;
        }

        return ctx.reply(
          `✅ *Đã đánh dấu chưa thanh toán cho hóa đơn của bạn trong ngày ${date.toLocaleDateString(
            "vi-VN"
          )}!*`
        );
      } else if (parseMonthYear(firstArgs)) {
        const monthYear = parseMonthYear(firstArgs);

        const bills = await Bill.find({
          month: monthYear.getMonth() + 1,
          year: monthYear.getFullYear(),
          userId: ctx.from.id,
          isPaid: true,
        });

        const result = await this.unpaidBills(ctx, bills);
        if (!result) {
          return;
        }

        return ctx.reply(
          `✅ *Đã đánh dấu chưa thanh toán cho hóa đơn của bạn trong tháng ${
            monthYear.getMonth() + 1
          }/${monthYear.getFullYear()}!*`
        );
      } else {
        const billCode = firstArgs;

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
            `• Loại: ${escapeMarkdown(bill.category.name)}\n` +
            `• Số tiền: ${formattedAmount} VNĐ\n` +
            `• Mô tả: ${escapeMarkdown(bill.description) || "Không có"}\n` +
            `• Ngày tạo: ${billDate}\n` +
            `• Người trả: ${escapeMarkdown(bill.username)}\n` +
            `• Trạng thái: Chưa thanh toán\n\n` +
            `💡 Dùng /paidbill <mã> để đánh dấu đã thanh toán`,
          { parse_mode: "Markdown" }
        );
      }
    } catch (error) {
      console.error("Error marking bill as unpaid:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi đánh dấu hóa đơn. Vui lòng kiểm tra ID và thử lại.`
      );
    }
  },
};
