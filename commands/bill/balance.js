/**
 * /balance command handler
 * Đối soát công nợ giữa các thành viên (chia đều)
 */

const User = require("../../models/User");
const Bill = require("../../models/Bill");

const { parseMonthYear } = require("../../utils/function");
const { escapeMarkdown } = require("../../utils/response");

module.exports = {
  name: "balance",
  description: "Đối soát công nợ giữa các thành viên",
  usage: "/balance [tháng/năm]",

  /**
   * Build settlement suggestions using a greedy algorithm.
   * Ghép người nợ nhiều nhất với người được nhận nhiều nhất.
   */
  buildSettlements(balances) {
    const debtors = balances
      .filter((b) => b.net < -0.5)
      .map((b) => ({ ...b, remaining: -b.net }))
      .sort((a, b) => b.remaining - a.remaining);
    const creditors = balances
      .filter((b) => b.net > 0.5)
      .map((b) => ({ ...b, remaining: b.net }))
      .sort((a, b) => b.remaining - a.remaining);

    const settlements = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.remaining, creditor.remaining);

      if (amount > 0.5) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount),
        });
      }

      debtor.remaining -= amount;
      creditor.remaining -= amount;

      if (debtor.remaining <= 0.5) i += 1;
      if (creditor.remaining <= 0.5) j += 1;
    }

    return settlements;
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
              `*Cách dùng:* /balance [tháng/năm]\n\n` +
              `*Ví dụ:*\n/balance\n/balance 6/2026`,
            { parse_mode: "Markdown" }
          );
        }
        month = parsed.getMonth() + 1;
        year = parsed.getFullYear();
      }

      const members = await User.find().sort({ joinedAt: 1 });

      if (members.length === 0) {
        return ctx.reply(
          `📋 *Chưa có thành viên nào*\n\nChưa thể đối soát công nợ.`,
          { parse_mode: "Markdown" }
        );
      }

      // Tổng số tiền mỗi thành viên đã trả trong kỳ
      const paidByUser = await Bill.aggregate([
        { $match: { month, year } },
        { $group: { _id: "$userId", total: { $sum: "$amount" } } },
      ]);

      const paidMap = {};
      paidByUser.forEach((row) => {
        paidMap[row._id] = row.total;
      });

      const total = paidByUser.reduce((sum, row) => sum + row.total, 0);

      if (total === 0) {
        return ctx.reply(
          `📊 *Đối soát tháng ${month}/${year}*\n\n` +
            `Chưa có chi tiêu nào trong tháng này.`,
          { parse_mode: "Markdown" }
        );
      }

      const memberCount = members.length;
      const share = total / memberCount;

      const balances = members.map((m) => {
        const paid = paidMap[m.telegramId] || 0;
        return {
          name: m.username || m.firstName || `ID ${m.telegramId}`,
          paid,
          net: paid - share,
        };
      });

      let message = `📊 *Đối soát chi tiêu tháng ${month}/${year}*\n\n`;
      message += `💰 *Tổng chi tiêu:* ${total.toLocaleString("vi-VN")} VNĐ\n`;
      message += `👥 *Số thành viên:* ${memberCount}\n`;
      message += `🧮 *Mỗi người chịu:* ${Math.round(share).toLocaleString(
        "vi-VN"
      )} VNĐ\n\n`;

      message += `*📋 Chi tiết theo người:*\n`;
      balances
        .slice()
        .sort((a, b) => b.net - a.net)
        .forEach((b) => {
          const netRounded = Math.round(b.net);
          let status;
          if (netRounded > 0) {
            status = `được nhận ${netRounded.toLocaleString("vi-VN")} VNĐ`;
          } else if (netRounded < 0) {
            status = `còn nợ ${Math.abs(netRounded).toLocaleString(
              "vi-VN"
            )} VNĐ`;
          } else {
            status = `đã cân bằng`;
          }
          message += `\n• *${escapeMarkdown(b.name)}*\n`;
          message += `   Đã trả: ${b.paid.toLocaleString("vi-VN")} VNĐ\n`;
          message += `   ${netRounded > 0 ? "🟢" : netRounded < 0 ? "🔴" : "⚪"} ${status}\n`;
        });

      const settlements = this.buildSettlements(balances);

      message += `\n*💸 Gợi ý thanh toán:*\n`;
      if (settlements.length === 0) {
        message += `Mọi người đã cân bằng, không cần chuyển khoản. 🎉\n`;
      } else {
        settlements.forEach((s) => {
          message += `• ${escapeMarkdown(s.from)} ➡️ ${escapeMarkdown(
            s.to
          )}: ${s.amount.toLocaleString("vi-VN")} VNĐ\n`;
        });
      }

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error calculating balance:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi đối soát công nợ. Vui lòng thử lại sau.`
      );
    }
  },
};
