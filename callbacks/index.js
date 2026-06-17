/**
 * Callback query router
 * Định tuyến các callback_data của inline keyboard tới handler tương ứng.
 * Quy ước callback_data: "<prefix>:<action>:<...args>"
 */

const Bill = require("../models/Bill");
const listbills = require("../commands/bill/listbills");
const addbillFlow = require("../flows/addbill");

/**
 * Render lại danh sách hóa đơn vào tin nhắn hiện tại.
 */
async function refreshList(ctx, params, page) {
  const result = await listbills.render(params, page);

  if (result.empty) {
    return ctx.editMessageText(result.text, { parse_mode: "Markdown" });
  }

  return ctx.editMessageText(result.text, result.extra);
}

const handlers = {
  // Không làm gì (nút hiển thị số trang)
  async noop(ctx) {
    await ctx.answerCbQuery();
  },

  // Chuyển trang
  async nav(ctx, parts) {
    const { page, params } = listbills.decodeContext(parts[0]);
    await refreshList(ctx, params, page);
    await ctx.answerCbQuery();
  },

  // Đánh dấu đã trả / hủy thanh toán
  async paid(ctx, parts) {
    const code = parts[0];
    const { page, params } = listbills.decodeContext(parts.slice(1).join(":"));

    const bill = await Bill.findOne({ code });
    if (!bill) {
      return ctx.answerCbQuery("Không tìm thấy hóa đơn này.", {
        show_alert: true,
      });
    }
    if (bill.userId !== ctx.from.id) {
      return ctx.answerCbQuery("Bạn chỉ có thể thao tác hóa đơn của mình.", {
        show_alert: true,
      });
    }

    bill.isPaid = !bill.isPaid;
    bill.paidDate = bill.isPaid ? new Date() : null;
    await bill.save();

    await refreshList(ctx, params, page);
    await ctx.answerCbQuery(
      bill.isPaid ? "Đã đánh dấu thanh toán ✅" : "Đã hủy thanh toán ↩️"
    );
  },

  // Xóa hóa đơn
  async del(ctx, parts) {
    const code = parts[0];
    const { page, params } = listbills.decodeContext(parts.slice(1).join(":"));

    const bill = await Bill.findOne({ code });
    if (!bill) {
      return ctx.answerCbQuery("Không tìm thấy hóa đơn này.", {
        show_alert: true,
      });
    }
    if (bill.userId !== ctx.from.id) {
      return ctx.answerCbQuery("Bạn chỉ có thể xóa hóa đơn của mình.", {
        show_alert: true,
      });
    }

    await Bill.deleteOne({ _id: bill._id });

    await refreshList(ctx, params, page);
    await ctx.answerCbQuery(`Đã xóa hóa đơn ${code} 🗑`);
  },
};

/**
 * Điểm vào: nhận ctx của callback_query, phân tích data và gọi handler.
 */
async function handleCallback(ctx) {
  const data = ctx.callbackQuery && ctx.callbackQuery.data;

  if (!data) {
    return ctx.answerCbQuery();
  }

  const parts = data.split(":");
  const prefix = parts[0];
  const action = parts[1];

  try {
    // Nhóm "lb": danh sách hóa đơn
    if (prefix === "lb" && handlers[action]) {
      return await handlers[action](ctx, parts.slice(2));
    }

    // Nhóm "ab": flow thêm hóa đơn tương tác
    if (prefix === "ab") {
      return await addbillFlow.handleCallback(ctx, action, parts.slice(2));
    }
  } catch (error) {
    console.error(`Error handling callback ${data}:`, error);
    return ctx.answerCbQuery("Có lỗi xảy ra, vui lòng thử lại.", {
      show_alert: true,
    });
  }

  return ctx.answerCbQuery();
}

module.exports = { handleCallback };
