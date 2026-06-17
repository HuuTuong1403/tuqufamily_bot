/**
 * /listbills command handler
 * Hiển thị danh sách hóa đơn
 */

const User = require("../../models/User");
const Bill = require("../../models/Bill");

const { parseDate, parseMonthYear } = require("../../utils/function");
const { escapeMarkdown } = require("../../utils/response");

const PAGE_SIZE = 5;

module.exports = {
  name: "listbills",
  description: "Xem danh sách hóa đơn",
  usage: "/listbills [username] [ngày/tháng/năm | tháng/năm | all] [paid|unpaid]",

  async getBills(params) {
    const query = {};
    if (params.userId) query.userId = params.userId;
    if (!params.all) {
      if (params.date) query.date = params.date;
      if (params.month) query.month = params.month;
      if (params.year) query.year = params.year;
    }
    query.isPaid = !!params.isPaid;

    return await Bill.find(query).sort({ date: -1 });
  },

  /**
   * Mã hoá bộ lọc + trang vào callback_data (dùng "~" để không đụng dấu ":").
   */
  encodeContext(params, page) {
    return [
      page,
      params.userId || 0,
      params.month || 0,
      params.year || 0,
      params.date ? params.date.getTime() : 0,
      params.isPaid ? 1 : 0,
      params.all ? 1 : 0,
    ].join("~");
  },

  decodeContext(str) {
    const [page, userId, month, year, dateMs, isPaid, all] = str
      .split("~")
      .map((v) => parseInt(v, 10) || 0);
    return {
      page,
      params: {
        userId: userId || "",
        month: month || 0,
        year: year || 0,
        date: dateMs ? new Date(dateMs) : null,
        isPaid: isPaid === 1,
        all: all === 1,
      },
    };
  },

  buildKeyboard(bills, params, page, totalPages) {
    const rows = bills.map((bill) => {
      const ctx = this.encodeContext(params, page);
      return [
        {
          text: bill.isPaid
            ? `↩️ Hủy TT ${bill.code}`
            : `✅ Đã trả ${bill.code}`,
          callback_data: `lb:paid:${bill.code}:${ctx}`,
        },
        {
          text: `🗑 ${bill.code}`,
          callback_data: `lb:del:${bill.code}:${ctx}`,
        },
      ];
    });

    if (totalPages > 1) {
      const navRow = [];
      if (page > 0) {
        navRow.push({
          text: "⬅️ Trước",
          callback_data: `lb:nav:${this.encodeContext(params, page - 1)}`,
        });
      }
      navRow.push({
        text: `${page + 1}/${totalPages}`,
        callback_data: "lb:noop",
      });
      if (page < totalPages - 1) {
        navRow.push({
          text: "Sau ➡️",
          callback_data: `lb:nav:${this.encodeContext(params, page + 1)}`,
        });
      }
      rows.push(navRow);
    }

    return { inline_keyboard: rows };
  },

  /**
   * Tạo nội dung tin nhắn + bàn phím cho một bộ lọc và trang cụ thể.
   * Trả về { text, extra } hoặc { empty: true, text } nếu không có hóa đơn.
   */
  async render(params, page = 0) {
    const bills = await this.getBills(params);

    const isFilterDate = !!params.date;
    const isPaidLabel = params.isPaid ? "Đã thanh toán" : "Chưa thanh toán";
    const periodLabel = params.all
      ? "tất cả thời gian"
      : isFilterDate
      ? `ngày ${params.date.toLocaleDateString("vi-VN")}`
      : `tháng ${params.month}/${params.year}`;

    if (bills.length === 0) {
      return {
        empty: true,
        text:
          `📋 *Không có hóa đơn nào*\n\n` +
          `Không tìm thấy hóa đơn *${isPaidLabel}* cho ${periodLabel}\n\n` +
          `Dùng /addbill để thêm hóa đơn mới`,
      };
    }

    const total = bills.reduce((sum, bill) => sum + bill.amount, 0);

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

    message += `*📈 Tổng quan theo loại:*\n`;
    Object.entries(byCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([, data]) => {
        const formatted = data.total.toLocaleString("vi-VN");
        message += `• ${data.name}: ${formatted} VNĐ (${data.count} hóa đơn)\n`;
      });

    message += `\n*💰 Tổng cộng:* ${total.toLocaleString("vi-VN")} VNĐ\n`;
    message += `*📝 Số lượng:* ${bills.length} hóa đơn\n\n`;

    const totalPages = Math.ceil(bills.length / PAGE_SIZE);
    const safePage = Math.min(Math.max(page, 0), totalPages - 1);
    const start = safePage * PAGE_SIZE;
    const pageBills = bills.slice(start, start + PAGE_SIZE);

    message += `*📋 Chi tiết (trang ${safePage + 1}/${totalPages}):*\n`;
    pageBills.forEach((bill, index) => {
      const date = new Date(bill.date).toLocaleDateString("vi-VN");
      const formatted = bill.amount.toLocaleString("vi-VN");
      message += `\n${start + index + 1}. *${escapeMarkdown(
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
      if (bill.isPaid && bill.paidDate) {
        message += `\n   Ngày thanh toán: ${new Date(
          bill.paidDate
        ).toLocaleDateString("vi-VN")}`;
      }
      message += `\n`;
    });

    const keyboard = this.buildKeyboard(pageBills, params, safePage, totalPages);

    return {
      text: message,
      extra: { parse_mode: "Markdown", reply_markup: keyboard },
    };
  },

  async execute(ctx, args) {
    try {
      const params = {
        userId: "",
        month: 0,
        year: 0,
        date: null,
        isPaid: false,
        all: false,
      };
      let isFilterDate = false;

      // Tách keyword paid/unpaid khỏi args trước khi xử lý
      const statusIndex = args.findIndex(
        (a) => a.toLowerCase() === "paid" || a.toLowerCase() === "unpaid"
      );
      if (statusIndex !== -1) {
        const statusArg = args.splice(statusIndex, 1)[0].toLowerCase();
        params.isPaid = statusArg === "paid";
      }

      // Tách keyword "all" -> bỏ lọc theo thời gian (xem toàn bộ)
      const allIndex = args.findIndex((a) => a.toLowerCase() === "all");
      if (allIndex !== -1) {
        args.splice(allIndex, 1);
        params.all = true;
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

          if (parsedDate && args[1]) {
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

          if (parsedDate && args[0]) {
            params.month = parsedDate.getMonth() + 1;
            params.year = parsedDate.getFullYear();
          }
        }
      }

      // Mặc định lọc theo tháng hiện tại nếu không nhập ngày/tháng (trừ khi xem tất cả)
      if (!params.all && !isFilterDate && !params.month && !params.year) {
        const now = new Date();
        params.month = now.getMonth() + 1;
        params.year = now.getFullYear();
      }

      const result = await this.render(params, 0);

      if (result.empty) {
        return ctx.reply(result.text, { parse_mode: "Markdown" });
      }

      let message = result.text;
      message += `\n📌 *Lệnh hữu ích:*\n`;
      message +=
        "• /listbills [username] [ngày/tháng/năm | tháng/năm | all] [paid|unpaid] - Xem hóa đơn (mặc định: tháng này, unpaid)\n";
      message += "• /listbills all - Xem tất cả hóa đơn chưa thanh toán\n";
      message +=
        "• /balance [tháng/năm | all] - Đối soát công nợ (all = mọi hóa đơn chưa thanh toán)\n";
      message += "• /export [tháng/năm] - Xuất CSV + biểu đồ chi tiêu\n";

      await ctx.reply(message, result.extra);
    } catch (error) {
      console.error("Error listing bills:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi lấy danh sách hóa đơn. Vui lòng thử lại sau.`
      );
    }
  },
};
