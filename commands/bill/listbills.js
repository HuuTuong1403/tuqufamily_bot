/**
 * /listbills command handler
 * Hiển thị danh sách hóa đơn
 */

const User = require("../../models/User");
const Bill = require("../../models/Bill");

const { parseDate } = require("../../utils/function");
const { escapeMarkdown } = require("../../utils/response");

module.exports = {
  name: "listbills",
  description: "Xem danh sách hóa đơn",
  usage: "/listbills [tháng] [năm]",

  async getBills(params) {
    for (let key in params) {
      if (!params[key]) {
        delete params[key];
      }
    }

    return await Bill.find(params).sort({ date: -1 });
  },

  async execute(ctx, args) {
    try {
      const params = {
        userId: "",
        month: 0,
        year: 0,
        date: null,
      };
      let isFilterDate = false;

      const firstArgs = args[0];
      const user = await User.findOne({ username: firstArgs });

      if (user) {
        params.userId = user.telegramId;
        const parsedDate = parseDate(args[1]);

        if (parsedDate) {
          params.date = parsedDate;
          isFilterDate = true;
        } else {
          params.month = this.getMonthYear(args[1], "month");
          params.year = this.getMonthYear(args[2], "year");
        }
      } else {
        const parsedDate = parseDate(args[0]);

        if (parsedDate) {
          params.date = parsedDate;
          isFilterDate = true;
        } else {
          params.month = this.getMonthYear(args[0], "month");
          params.year = this.getMonthYear(args[1], "year");
        }
      }

      const bills = await this.getBills(params);

      if (bills.length === 0) {
        return ctx.reply(
          `📋 *Không có hóa đơn nào*\n\n` +
            `Không tìm thấy hóa đơn cho ${
              isFilterDate
                ? `ngày ${params.date.toLocaleDateString("vi-VN")}`
                : `tháng ${params.month}/${params.year}`
            }\n\n` +
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

      let message = `📊 *Hóa đơn ${
        isFilterDate
          ? `ngày ${params.date.toLocaleDateString("vi-VN")}`
          : `tháng ${params.month}/${params.year}`
      }*\n\n`;

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
      message +=
        "• /listbills <username> <ngày/tháng/năm> <tháng> <năm> - Xem hóa đơn của người dùng theo ngày hoặc tháng năm\n";
      message += "• /editbill <mã> <trường> <giá trị> - Sửa hóa đơn\n";
      message += "• /paidbill <mã> - Đánh dấu đã thanh toán\n";
      message += "• /unpaidbill <mã> - Đánh dấu chưa thanh toán\n";
      message += "• /deletebill <mã> - Xóa hóa đơn\n";

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error listing bills:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi lấy danh sách hóa đơn. Vui lòng thử lại sau.`
      );
    }
  },

  getMonthYear(data, type) {
    if (!data) return null;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    if (type === "month") {
      const parsedMonth = parseInt(data);
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        return parsedMonth;
      }
      return month;
    }

    if (type === "year") {
      const parsedYear = parseInt(data);
      if (!isNaN(parsedYear) && parsedYear >= 2020 && parsedYear <= 2100) {
        return parsedYear;
      }
      return year;
    }
  },
};
