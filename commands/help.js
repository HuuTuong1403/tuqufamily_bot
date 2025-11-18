/**
 * /help command handler
 * Shows available commands and their descriptions
 */

module.exports = {
  name: "help",
  description: "Hiển thị một vài lệnh có thể thao tác",

  async execute(ctx) {
    const helpMessage = `
📚 *Hướng dẫn sử dụng TuquFamily Bot*

*💰 Quản lý hóa đơn:*

📝 *Thêm hóa đơn:*
\`/addbill <loại> <số tiền> <mô tả>\`
Ví dụ: \`/addbill điện 500000 Tiền điện tháng 11\`

📋 *Xem danh sách:*
\`/listbills\` - Xem hóa đơn tháng này
\`/listbills 10 2025\` - Xem hóa đơn tháng 10/2025

📊 *Thống kê:*
\`/stats\` - Thống kê tháng này
\`/stats 10 2025\` - Thống kê tháng 10/2025

🗑️ *Xóa hóa đơn:*
\`/deletebill <ID>\` - Xóa hóa đơn theo ID

*🏷️ Quản lý loại hóa đơn:*
/categories - Xem danh sách loại
/addcategory - Thêm loại mới
/editcategory - Sửa loại
/deletecategory - Xóa loại

*ℹ️ Lệnh khác:*
/start - Khởi tạo bot
/about - Thông tin về bot

Cần thêm trợ giúp? Liên hệ admin! 😊
    `;

    await ctx.reply(helpMessage, { parse_mode: "Markdown" });
  },
};
