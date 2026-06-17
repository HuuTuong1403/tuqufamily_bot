/**
 * Flow tương tác cho /addbill
 *
 * Luồng: chọn loại -> nhập số tiền -> chọn/nhập ngày -> nhập ghi chú -> tạo hóa đơn.
 * Hoặc: nhập tay -> gửi mẫu lệnh để người dùng tự điền.
 *
 * Trạng thái được lưu tạm trong bộ nhớ (Map), hết hạn sau SESSION_TTL.
 */

const Category = require("../models/Category");
const addbill = require("../commands/bill/addbill");
const { parseDate } = require("../utils/function");

const sessions = new Map();
const SESSION_TTL = 10 * 60 * 1000; // 10 phút
const CATS_PER_PAGE = 8;

function sessionKey(ctx) {
  const chatId = ctx.chat ? ctx.chat.id : ctx.from.id;
  return `${chatId}:${ctx.from.id}`;
}

function getSession(ctx) {
  const key = sessionKey(ctx);
  const session = sessions.get(key);
  if (!session) return null;
  if (Date.now() - session.updatedAt > SESSION_TTL) {
    sessions.delete(key);
    return null;
  }
  return session;
}

function setSession(ctx, data) {
  const key = sessionKey(ctx);
  const current = sessions.get(key) || {};
  sessions.set(key, { ...current, ...data, updatedAt: Date.now() });
}

function clearSession(ctx) {
  sessions.delete(sessionKey(ctx));
}

function hasActiveFlow(ctx) {
  return getSession(ctx) !== null;
}

// ---- Bàn phím & tin nhắn ----

function dateKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📅 Hôm nay", callback_data: "ab:date:today" },
        { text: "📅 Hôm qua", callback_data: "ab:date:yesterday" },
      ],
      [{ text: "✍️ Nhập ngày khác", callback_data: "ab:date:manual" }],
      [{ text: "❌ Hủy", callback_data: "ab:cancel" }],
    ],
  };
}

function noteKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "⏭ Bỏ qua", callback_data: "ab:note:skip" }],
      [{ text: "❌ Hủy", callback_data: "ab:cancel" }],
    ],
  };
}

async function buildCategoryKeyboard(page) {
  let categories = await Category.getCategories();
  if (categories.length === 0) {
    categories = await Category.initDefaultCategories();
  }

  const totalPages = Math.max(1, Math.ceil(categories.length / CATS_PER_PAGE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * CATS_PER_PAGE;
  const pageItems = categories.slice(start, start + CATS_PER_PAGE);

  const rows = [];
  for (let i = 0; i < pageItems.length; i += 2) {
    const row = pageItems.slice(i, i + 2).map((c) => ({
      text: `${c.icon} ${c.name}`,
      callback_data: `ab:cat:${c.code}`,
    }));
    rows.push(row);
  }

  if (totalPages > 1) {
    const navRow = [];
    if (safePage > 0) {
      navRow.push({
        text: "⬅️",
        callback_data: `ab:cats:${safePage - 1}`,
      });
    }
    navRow.push({
      text: `${safePage + 1}/${totalPages}`,
      callback_data: "ab:noop",
    });
    if (safePage < totalPages - 1) {
      navRow.push({
        text: "➡️",
        callback_data: `ab:cats:${safePage + 1}`,
      });
    }
    rows.push(navRow);
  }

  rows.push([{ text: "❌ Hủy", callback_data: "ab:cancel" }]);

  return { inline_keyboard: rows };
}

/**
 * Chuẩn hoá chuỗi số tiền người dùng nhập: "500.000", "500,000", "500 000" -> 500000
 */
function parseAmount(text) {
  const cleaned = text.replace(/[.,\s]/g, "");
  const amount = parseFloat(cleaned);
  if (isNaN(amount) || amount <= 0) return null;
  return amount;
}

// ---- Xử lý callback ----

async function handleCallback(ctx, action, rest) {
  switch (action) {
    case "noop":
      return ctx.answerCbQuery();

    case "cancel":
      clearSession(ctx);
      await ctx.answerCbQuery("Đã hủy");
      return ctx.editMessageText("❌ Đã hủy thêm hóa đơn.");

    case "manual": {
      clearSession(ctx);
      await ctx.answerCbQuery();
      return ctx.editMessageText(
        `✍️ *Nhập tay*\n\n` +
          `Sao chép mẫu dưới đây, điền thông tin rồi gửi lại:\n\n` +
          "`/addbill <loại> <số tiền> <DD/MM/YYYY> <mô tả>`\n\n" +
          `*Ví dụ:*\n` +
          "`/addbill dien 500000 15/11/2025 Tiền điện tháng 11`\n\n" +
          `💡 Ngày có thể để trống (sẽ dùng hôm nay).`,
        { parse_mode: "Markdown" }
      );
    }

    case "cats": {
      const page = parseInt(rest[0], 10) || 0;
      const keyboard = await buildCategoryKeyboard(page);
      await ctx.answerCbQuery();
      return ctx.editMessageText(`📂 *Chọn loại hóa đơn:*`, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
    }

    case "cat": {
      const code = rest[0];
      const category = await Category.findOne({ code });
      if (!category) {
        return ctx.answerCbQuery("Loại không tồn tại.", { show_alert: true });
      }

      setSession(ctx, {
        step: "amount",
        categoryCode: category.code,
        categoryLabel: `${category.icon} ${category.name}`,
        amount: null,
        date: null,
      });

      await ctx.answerCbQuery();
      return ctx.editMessageText(
        `✅ Loại: *${category.icon} ${category.name}*\n\n` +
          `💵 Nhập *số tiền* (VNĐ):`,
        { parse_mode: "Markdown" }
      );
    }

    case "date": {
      const session = getSession(ctx);
      if (!session || session.step !== "date") {
        return ctx.answerCbQuery("Phiên đã hết hạn, gõ /addbill để bắt đầu lại.", {
          show_alert: true,
        });
      }

      if (rest[0] === "manual") {
        await ctx.answerCbQuery();
        return ctx.editMessageText(
          `📅 Hãy gõ ngày theo dạng *DD/MM/YYYY* (ví dụ: 15/11/2025):`,
          { parse_mode: "Markdown" }
        );
      }

      const date = new Date();
      if (rest[0] === "yesterday") {
        date.setDate(date.getDate() - 1);
      }

      setSession(ctx, { step: "note", date });
      await ctx.answerCbQuery();
      return ctx.editMessageText(
        `📅 Ngày: *${date.toLocaleDateString("vi-VN")}*\n\n` +
          `📝 Nhập *ghi chú* cho hóa đơn (hoặc bấm Bỏ qua):`,
        { parse_mode: "Markdown", reply_markup: noteKeyboard() }
      );
    }

    case "note": {
      const session = getSession(ctx);
      if (!session || session.step !== "note") {
        return ctx.answerCbQuery("Phiên đã hết hạn, gõ /addbill để bắt đầu lại.", {
          show_alert: true,
        });
      }

      if (rest[0] === "skip") {
        await ctx.answerCbQuery();
        await ctx.editMessageText("📝 Ghi chú: (bỏ qua)");
        await finishFlow(ctx, session, "");
        return;
      }

      return ctx.answerCbQuery();
    }

    default:
      return ctx.answerCbQuery();
  }
}

// ---- Xử lý tin nhắn văn bản trong flow ----

async function handleText(ctx) {
  const session = getSession(ctx);
  if (!session) return false;

  const text = ctx.message.text.trim();

  if (session.step === "amount") {
    const amount = parseAmount(text);
    if (amount === null) {
      await ctx.reply("❌ Số tiền không hợp lệ. Vui lòng nhập một số dương.");
      return true;
    }
    setSession(ctx, { step: "date", amount });
    await ctx.reply(
      `💵 Số tiền: *${amount.toLocaleString("vi-VN")} VNĐ*\n\n` +
        `📅 Chọn ngày hóa đơn (hoặc gõ ngày *DD/MM/YYYY*):`,
      { parse_mode: "Markdown", reply_markup: dateKeyboard() }
    );
    return true;
  }

  if (session.step === "date") {
    const date = parseDate(text);
    if (!date) {
      await ctx.reply(
        "❌ Ngày không hợp lệ. Gõ theo dạng DD/MM/YYYY hoặc bấm nút phía trên."
      );
      return true;
    }
    setSession(ctx, { step: "note", date });
    await ctx.reply(
      `📅 Ngày: *${date.toLocaleDateString("vi-VN")}*\n\n` +
        `📝 Nhập *ghi chú* cho hóa đơn (hoặc bấm Bỏ qua):`,
      { parse_mode: "Markdown", reply_markup: noteKeyboard() }
    );
    return true;
  }

  if (session.step === "note") {
    await finishFlow(ctx, session, text);
    return true;
  }

  return false;
}

async function finishFlow(ctx, session, description) {
  try {
    await addbill.createBill(ctx, {
      categoryCode: session.categoryCode,
      amount: session.amount,
      date: session.date,
      description,
    });
  } catch (error) {
    console.error("Error finishing addbill flow:", error);
    await ctx.reply("❌ Có lỗi xảy ra khi lưu hóa đơn. Vui lòng thử lại sau.");
  } finally {
    clearSession(ctx);
  }
}

module.exports = {
  hasActiveFlow,
  handleCallback,
  handleText,
};
