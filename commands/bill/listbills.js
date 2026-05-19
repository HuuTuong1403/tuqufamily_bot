/**
 * /listbills command handler
 * Hiển thị danh sách hóa đơn
 */

const User = require("../../models/User");
const Bill = require("../../models/Bill");

const { parseDate, parseMonthYear } = require("../../utils/function");
const { escapeMarkdown } = require("../../utils/response");

module.exports = {
  name: "listbills",
  description: "Xem danh sách hóa đơn",
  usage: "/listbills [username] [ngày/tháng/năm | tháng/năm] [paid|unpaid]",

  async getBills(params) {
    const query = {};
    for (let key in params) {
      if (key === "isPaid") {
        query[key] = params[key];
      } else if (params[key]) {
        query[key] = params[key];
      }
    }

    return await Bill.find(query).sort({ date: -1 });
  },

  async execute(ctx, args) {
    try {
      const params = {
        userId: "",
        month: 0,
        year: 0,
        date: null,
        isPaid: false,
      };
      let isFilterDate = false;
      let isPaidLabel = "Chưa thanh toán";

      // Tách keyword paid/unpaid khỏi args trước khi xử lý
      const statusIndex = args.findIndex(
        (a) => a.toLowerCase() === "paid" || a.toLowerCase() === "unpaid"
      );
      if (statusIndex !== -1) {
        const statusArg = args.splice(statusIndex, 1)[0].toLowerCase();
        params.isPaid = statusArg === "paid";
        isPaidLabel = params.isPaid ? "Đã thanh toán" : "Chưa thanh toán";
      }

      const firstArgs = args[0];

      const user = await User.findOne({ username: firstArgs });

      if (user) {
        params.userId = user.telegramId;
        let parsedDate = parseDate(args[1]);

        if (parsedDate) {
          params.date = parsedDate;
          isFilterDate = true;
        } else {
          parsedDate = parseMonthYear(args[1]);

          if (parsedDate) {
            params.month = parsedDate.getMonth() + 1;
            params.year = parsedDate.getFullYear();
          }
        }
      } else {
        let parsedDate = parseDate(args[0]);

        if (parsedDate) {
          params.date = parsedDate;
          isFilterDate = true;
        } else {
          parsedDate = parseMonthYear(args[0]);

          if (parsedDate) {
            params.month = parsedDate.getMonth() + 1;
            params.year = parsedDate.getFullYear();
          }
        }
      }

      const bills = await this.getBills(params);

      const periodLabel = isFilterDate
        ? `ngày ${params.date.toLocaleDateString("vi-VN")}`
        : `tháng ${params.month}/${params.year}`;

      if (bills.length === 0) {
        return ctx.reply(
          `📋 *Không có hóa đơn nào*\n\n` +
            `Không tìm thấy hóa đơn *${isPaidLabel}* cho ${periodLabel}\n\n` +
            `Dùng /addbill để thêm hóa đơn mới`,
          { parse_mode: "Markdown" }
        );
      }

      // Calculate total
      const total = bills.reduce((sum, bill) => sum + bill.amount, 0);

      // Group by category
      const byCategory = {};
      bills.forEach((bill) => {
        if (!byCategory[bill.category.code]) {
          byCategory[bill.category.code] = {
            total: 0,
            count: 0,
            name: bill.category.name,
          };
        }
        byCategory[bill.category.code].total += bill.amount;
        byCategory[bill.category.code].count += 1;
      });

      const statusIcon = params.isPaid ? "✅" : "❌";
      let message = `📊 *Hóa đơn ${periodLabel}* ${statusIcon} ${isPaidLabel}\n\n`;

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
        "• /listbills [username] [ngày/tháng/năm | tháng/năm] [paid|unpaid] - Xem hóa đơn (mặc định: unpaid)\n";
      message += "• /editbill <mã> <trường> <giá trị> - Sửa hóa đơn\n";
      message +=
        "• /paidbill <all | mã | ngày/tháng/năm | tháng/năm> - Đánh dấu hóa đơn của bạn đã thanh toán\n";
      message +=
        "• /unpaidbill <all | mã | ngày/tháng/năm | tháng/năm> - Đánh dấu hóa đơn của bạn chưa thanh toán\n";
      message += "• /deletebill <mã> - Xóa hóa đơn\n";

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error listing bills:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi lấy danh sách hóa đơn. Vui lòng thử lại sau.`
      );
    }
  },
};
