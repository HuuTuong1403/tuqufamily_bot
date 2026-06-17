/**
 * /export command handler
 * Xuất báo cáo chi tiêu: file CSV + ảnh biểu đồ
 */

const Bill = require("../../models/Bill");
const { parseMonthYear } = require("../../utils/function");

module.exports = {
  name: "export",
  description: "Xuất báo cáo chi tiêu (CSV + biểu đồ)",
  usage: "/export [tháng/năm]",

  /**
   * Bọc một ô CSV: thêm ngoặc kép nếu chứa dấu phẩy/ngoặc/xuống dòng.
   */
  csvCell(value) {
    const str = value == null ? "" : String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  },

  buildCsv(bills) {
    const headers = [
      "Mã",
      "Ngày",
      "Loại",
      "Số tiền",
      "Mô tả",
      "Người trả",
      "Trạng thái",
      "Ngày thanh toán",
    ];

    const lines = [headers.map((h) => this.csvCell(h)).join(",")];

    bills.forEach((bill) => {
      const row = [
        bill.code,
        new Date(bill.date).toLocaleDateString("vi-VN"),
        bill.category && bill.category.name,
        bill.amount,
        bill.description || "",
        bill.username || "",
        bill.isPaid ? "Đã thanh toán" : "Chưa thanh toán",
        bill.isPaid && bill.paidDate
          ? new Date(bill.paidDate).toLocaleDateString("vi-VN")
          : "",
      ];
      lines.push(row.map((c) => this.csvCell(c)).join(","));
    });

    // BOM UTF-8 để Excel đọc đúng tiếng Việt
    return "\uFEFF" + lines.join("\r\n");
  },

  buildChartUrl(byCategory, month, year) {
    const labels = byCategory.map((c) => c.name);
    const data = byCategory.map((c) => c.total);

    const config = {
      type: "outlabeledPie",
      data: {
        labels,
        datasets: [{ data }],
      },
      options: {
        title: {
          display: true,
          text: `Chi tiêu theo loại - tháng ${month}/${year}`,
        },
        plugins: {
          legend: { position: "right" },
        },
      },
    };

    const encoded = encodeURIComponent(JSON.stringify(config));
    return `https://quickchart.io/chart?w=600&h=400&c=${encoded}`;
  },

  async execute(ctx, args) {
    try {
      const now = new Date();
      let month = now.getMonth() + 1;
      let year = now.getFullYear();

      if (args[0]) {
        const parsed = parseMonthYear(args[0]);
        if (!parsed) {
          return ctx.reply(
            `❌ *Định dạng không đúng!*\n\n` +
              `*Cách dùng:* /export [tháng/năm]\n\n` +
              `*Ví dụ:*\n/export\n/export 6/2026`,
            { parse_mode: "Markdown" }
          );
        }
        month = parsed.getMonth() + 1;
        year = parsed.getFullYear();
      }

      const bills = await Bill.find({ month, year }).sort({ date: -1 });

      if (bills.length === 0) {
        return ctx.reply(
          `📋 *Không có dữ liệu*\n\n` +
            `Chưa có hóa đơn nào trong tháng ${month}/${year}.`,
          { parse_mode: "Markdown" }
        );
      }

      // Tổng hợp theo loại cho biểu đồ
      const catMap = {};
      bills.forEach((bill) => {
        const code = bill.category.code;
        if (!catMap[code]) {
          catMap[code] = { name: bill.category.name, total: 0 };
        }
        catMap[code].total += bill.amount;
      });
      const byCategory = Object.values(catMap).sort(
        (a, b) => b.total - a.total
      );

      const total = bills.reduce((sum, b) => sum + b.amount, 0);

      // 1. Gửi file CSV
      const csv = this.buildCsv(bills);
      await ctx.replyWithDocument(
        {
          source: Buffer.from(csv, "utf-8"),
          filename: `bao-cao-chi-tieu-${month}-${year}.csv`,
        },
        {
          caption:
            `📄 *Báo cáo tháng ${month}/${year}*\n` +
            `Tổng: ${total.toLocaleString("vi-VN")} VNĐ — ${bills.length} hóa đơn`,
          parse_mode: "Markdown",
        }
      );

      // 2. Gửi ảnh biểu đồ
      try {
        const chartUrl = this.buildChartUrl(byCategory, month, year);
        await ctx.replyWithPhoto(
          { url: chartUrl },
          { caption: `📊 Biểu đồ chi tiêu theo loại - tháng ${month}/${year}` }
        );
      } catch (chartError) {
        console.error("Error sending chart:", chartError);
        await ctx.reply(
          `⚠️ Đã xuất CSV nhưng không tạo được biểu đồ. Vui lòng thử lại sau.`
        );
      }
    } catch (error) {
      console.error("Error exporting bills:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại sau.`
      );
    }
  },
};
