/**
 * /editbill command handler
 * Chỉnh sửa hóa đơn
 * Cú pháp: /editbill <mã> <trường> <giá trị mới>
 */

const Bill = require("../../models/Bill");
const Category = require("../../models/Category");
const { escapeMarkdown } = require("../../utils/response");

// Helper function to parse date
function parseDate(dateStr) {
  const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateStr.match(datePattern);

  if (!match) return null;

  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);

  // Validate ranges
  if (
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    return null;
  }

  // Create date object
  const date = new Date(year, month - 1, day);

  // Check if date is valid
  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year
  ) {
    return null;
  }

  return date;
}

module.exports = {
  name: "editbill",
  description: "Chỉnh sửa hóa đơn",
  usage: "/editbill <mã> <category|amount|description|date> <giá trị mới>",

  async execute(ctx, args) {
    if (args.length < 3) {
      return ctx.reply(
        `❌ *Cú pháp không đúng!*\n\n` +
          `*Cách dùng:* /editbill <mã> <trường> <giá trị mới>\n\n` +
          `*Các trường có thể chỉnh sửa:*\n` +
          `• \`category\` - Loại hóa đơn\n` +
          `• \`amount\` - Số tiền\n` +
          `• \`description\` - Mô tả\n` +
          `• \`date\` - Ngày (DD/MM/YYYY)\n\n` +
          `*Ví dụ:*\n` +
          `/editbill bill1 category dien\n` +
          `/editbill bill2 amount 600000\n` +
          `/editbill bill3 description Tiền điện mới\n` +
          `/editbill bill4 date 15/11/2025\n\n` +
          `Dùng /listbills để xem mã các hóa đơn`,
        { parse_mode: "Markdown" }
      );
    }

    const billCode = args[0];
    const field = args[1].toLowerCase();
    const newValue = args.slice(2).join(" ");

    // Validate field
    const validFields = ["category", "amount", "description", "date"];
    if (!validFields.includes(field)) {
      return ctx.reply(
        `❌ *Trường không hợp lệ!*\n\n` +
          `Các trường có thể chỉnh sửa: ${validFields.join(", ")}\n\n` +
          `Ví dụ: /editbill ${billCode} amount 500000`,
        { parse_mode: "Markdown" }
      );
    }

    try {
      // Find the bill and check ownership
      const bill = await Bill.findOne({
        code: billCode,
        userId: ctx.from.id,
      });

      if (!bill) {
        return ctx.reply(
          `❌ *Không tìm thấy hóa đơn!*\n\n` +
            `Không tìm thấy hóa đơn với ID này hoặc bạn không có quyền chỉnh sửa.\n\n` +
            `Dùng /listbills để xem danh sách hóa đơn của bạn`,
          { parse_mode: "Markdown" }
        );
      }

      // Store old value for comparison
      const oldValue =
        field === "category"
          ? bill.category.name
          : field === "amount"
          ? bill.amount
          : field === "date"
          ? new Date(bill.date).toLocaleDateString("vi-VN")
          : bill.description;

      // Update based on field
      switch (field) {
        case "category":
          const categoryCode = newValue.toLowerCase();

          // Validate category exists
          const categoryExists = await Category.categoryExists(categoryCode);

          if (!categoryExists) {
            return ctx.reply(
              `❌ *Loại hóa đơn không tồn tại!*\n\n` +
                `Loại "${newValue}" chưa có trong danh sách của bạn.\n\n` +
                `Dùng /categories để xem danh sách loại\n` +
                `Hoặc /addcategory để thêm loại mới`,
              { parse_mode: "Markdown" }
            );
          }

          const categoryInfo = await Category.findOne({
            code: categoryCode,
          });

          bill.category = {
            code: categoryInfo.code,
            name: categoryInfo.name,
          };
          break;

        case "amount":
          const amount = parseFloat(newValue);

          if (isNaN(amount) || amount <= 0) {
            return ctx.reply(
              `❌ *Số tiền không hợp lệ!*\n\n` +
                `Vui lòng nhập số tiền là một số dương.\n` +
                `Ví dụ: /editbill ${billCode} amount 500000`,
              { parse_mode: "Markdown" }
            );
          }

          bill.amount = amount;
          break;

        case "date":
          const newDate = parseDate(newValue);

          if (!newDate) {
            return ctx.reply(
              `❌ *Ngày không hợp lệ!*\n\n` +
                `Vui lòng nhập ngày theo định dạng DD/MM/YYYY.\n` +
                `Ví dụ: /editbill ${billCode} date 15/11/2025`,
              { parse_mode: "Markdown" }
            );
          }

          bill.date = newDate;
          bill.month = newDate.getMonth() + 1;
          bill.year = newDate.getFullYear();
          break;

        case "description":
          bill.description = newValue;
          break;
      }

      // Save the updated bill
      await bill.save();

      // Format display values
      const displayOldValue =
        field === "amount"
          ? `${oldValue.toLocaleString("vi-VN")} VNĐ`
          : oldValue || "Không có";

      const displayNewValue =
        field === "category"
          ? bill.category.name
          : field === "amount"
          ? `${bill.amount.toLocaleString("vi-VN")} VNĐ`
          : field === "date"
          ? new Date(bill.date).toLocaleDateString("vi-VN")
          : bill.description || "Không có";

      const fieldNames = {
        category: "Loại",
        amount: "Số tiền",
        description: "Mô tả",
        date: "Ngày",
      };

      await ctx.reply(
        `✅ *Đã cập nhật hóa đơn thành công!*\n\n` +
          `📝 *Thông tin đã thay đổi:*\n` +
          `• Trường: ${fieldNames[field]}\n` +
          `• Giá trị cũ: ${escapeMarkdown(displayOldValue)}\n` +
          `• Giá trị mới: ${escapeMarkdown(displayNewValue)}\n\n` +
          `📋 *Thông tin hóa đơn hiện tại:*\n` +
          `• Loại: ${escapeMarkdown(bill.category.name)}\n` +
          `• Số tiền: ${bill.amount.toLocaleString("vi-VN")} VNĐ\n` +
          `• Mô tả: ${escapeMarkdown(bill.description) || "Không có"}\n` +
          `• Ngày: ${new Date(bill.date).toLocaleDateString("vi-VN")}\n` +
          `• Trạng thái: ${
            bill.isPaid ? "Đã thanh toán ✅" : "Chưa thanh toán ❌"
          }\n\n` +
          `Dùng /listbills để xem danh sách hóa đơn`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error editing bill:", error);
      await ctx.reply(
        `❌ Có lỗi xảy ra khi chỉnh sửa hóa đơn. Vui lòng kiểm tra ID và thử lại.`
      );
    }
  },
};
