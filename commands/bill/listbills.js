/**
 * /listbills command handler
 * Hiển thị danh sách hóa đơn
 */

const Bill = require("../../models/Bill");
const { escapeMarkdown } = require("../../utils/response");

module.exports = {
  name: "listbills",
  description: "Xem danh sách hóa đơn",
  usage: "/listbills [tháng] [năm]",

  async execute(ctx, args) {
    const now = new Date();
    let month = now.getMonth() + 1;
    let year = now.getFullYear();

    // Parse month and year from args if provided
    if (args.length >= 1) {
      const parsedMonth = parseInt(args[0]);
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        month = parsedMonth;
      }
    }
    if (args.length >= 2) {
      const parsedYear = parseInt(args[1]);
      if (!isNaN(parsedYear) && parsedYear >= 2020 && parsedYear <= 2100) {
        year = parsedYear;
      }
    }

    try {
      const bills = await Bill.find({
        userId: ctx.from.id,
        month: month,
        year: year,
      }).sort({ date: -1 });

      if (bills.length === 0) {
        return ctx.reply(
          `📋 *Không có hóa đơn nào*\n\n` +
            `Không tìm thấy hóa đơn cho tháng ${month}/${year}\n\n` +
            `Dùng /addbill để thêm hóa đơn mới`,
          { parse_mode: "Markdown" }
        );
      }

      // Calculate total
      const total = bills.reduce((sum, bill) => sum + bill.amount, 0);

      // Group by category
      const byCategory = {};
      bills.forEach((bill) => {
        if (!byCategory[bill.category]) {
          byCategory[bill.category] = {
            total: 0,
            count: 0,
            name: bill.category.name,
          };
        }
        byCategory[bill.category].total += bill.amount;
        byCategory[bill.category].count += 1;
      });

      let message = `📊 *Hóa đơn tháng ${month}/${year}*\n\n`;

      // Summary by category
      message += `*📈 Tổng quan theo loại:*\n`;
      Object.entries(byCategory)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([cat, data]) => {
          const formatted = data.total.toLocaleString("vi-VN");
          message += `• ${data.name}: ${formatted} VNĐ (${data.count} hóa đơn)\n`;
        });

      message += `\n*💰 Tổng cộng:* ${total.toLocaleString("vi-VN")} VNĐ\n`;
      message += `*📝 Số lượng:* ${bills.length} hóa đơn\n\n`;

      message += `*📋 Chi tiết (10 gần nhất):*\n`;
      bills.slice(0, 10).forEach((bill, index) => {
        const date = new Date(bill.date).toLocaleDateString("vi-VN");
        const formatted = bill.amount.toLocaleString("vi-VN");
        message += `\n${index + 1}. *${escapeMarkdown(
          bill.category.name
        )}* - ${formatted} VNĐ ${bill.isPaid ? "✅" : "❌"}\n`;
        message += `   Mã: \`${bill.code}\``;
        message += `\n   Ngày: ${date}`;
        if (bill.description) {
          message += `\n   Mô tả: ${escapeMarkdown(bill.description)}`;
        }
        message += `\n   Người trả: ${escapeMarkdown(bill.username)}`;
        message += `\n   Trạng thái: ${
          bill.isPaid ? "Đã thanh toán" : "Chưa thanh toán"
        }`;
        if (bill.isPaid) {
          message += `\n   Ngày thanh toán: ${new Date(
            bill.paidDate
          ).toLocaleDateString("vi-VN")}`;
        }
        message += `\n`;
      });

      if (bills.length > 10) {
        message += `\n_...và ${bills.length - 10} hóa đơn khác_`;
      }

      message += `\n\n📌 *Lệnh hữu ích:*\n`;
      message += `• /editbill <mã> <trường> <giá trị> - Sửa hóa đơn\n`;
      message += `• /paidbill <mã> - Đánh dấu đã thanh toán\n`;
      message += `• /unpaidbill <mã> - Đánh dấu chưa thanh toán\n`;
      message += `• /deletebill <mã> - Xóa hóa đơn`;

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error listing bills:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi lấy danh sách hóa đơn. Vui lòng thử lại sau.`
      );
    }
  },
};
