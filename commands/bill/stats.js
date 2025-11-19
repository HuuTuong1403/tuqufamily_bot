/**
 * /stats command handler
 * Thống kê chi tiêu
 */

const Bill = require("../../models/Bill");

module.exports = {
  name: "stats",
  description: "Thống kê chi tiêu",
  usage: "/stats [tháng] [năm]",

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
      const monthlyTotal = await Bill.getMonthlyTotal(
        ctx.from.id,
        month,
        year
      );
      const byCategory = await Bill.getTotalByCategory(
        ctx.from.id,
        month,
        year
      );
      console.log("🚀 => byCategory:", byCategory)

      if (monthlyTotal.count === 0) {
        return ctx.reply(
          `📊 *Thống kê tháng ${month}/${year}*\n\n` +
            `Chưa có dữ liệu chi tiêu cho tháng này.\n\n` +
            `Dùng /addbill để thêm hóa đơn`,
          { parse_mode: "Markdown" }
        );
      }

      let message = `📊 *Thống kê chi tiêu tháng ${month}/${year}*\n\n`;

      // Total
      const formattedTotal = monthlyTotal.total.toLocaleString("vi-VN");
      message += `💰 *Tổng chi tiêu:* ${formattedTotal} VNĐ\n`;
      message += `📝 *Số hóa đơn:* ${monthlyTotal.count}\n`;

      // By category with percentage
      message += `*📋 Chi tiết theo loại:*\n\n`;
      byCategory.forEach((cat, index) => {
        const percentage = ((cat.total / monthlyTotal.total) * 100).toFixed(1);
        const formatted = cat.total.toLocaleString("vi-VN");
        const bars = "█".repeat(Math.ceil(parseFloat(percentage) / 10));

        message += `${index + 1}. *${cat._id.name}*\n`;
        message += `   💵 ${formatted} VNĐ (${percentage}%)\n`;
        message += `   ${bars}\n`;
        message += `   📊 ${cat.count} hóa đơn\n\n`;
      });

      // Compare with previous month
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevMonthTotal = await Bill.getMonthlyTotal(
        ctx.from.id,
        prevMonth,
        prevYear
      );

      if (prevMonthTotal.count > 0) {
        const diff = monthlyTotal.total - prevMonthTotal.total;
        const diffPercent = ((diff / prevMonthTotal.total) * 100).toFixed(1);
        const arrow = diff > 0 ? "📈" : "📉";
        const sign = diff > 0 ? "+" : "";

        message += `\n*📊 So với tháng ${prevMonth}/${prevYear}:*\n`;
        message += `${arrow} ${sign}${diff.toLocaleString(
          "vi-VN"
        )} VNĐ (${sign}${diffPercent}%)\n`;
      }

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error getting stats:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi tính thống kê. Vui lòng thử lại sau.`
      );
    }
  },
};

