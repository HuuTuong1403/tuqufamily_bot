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
\`/addbill <loại> <số tiền> [DD/MM/YYYY] <mô tả>\`
Ví dụ: \`/addbill dien 500000 Tiền điện\`
Hoặc: \`/addbill dien 500000 15/11/2025 Tiền điện\`

✏️ *Sửa hóa đơn:*
\`/editbill <mã> <trường> <giá trị mới>\`
Ví dụ: \`/editbill bill1 amount 600000\`
Hoặc: \`/editbill bill1 date 15/11/2025\`

📋 *Xem danh sách:*
\`/listbills\` - Xem hóa đơn tháng này
\`/listbills 10 2025\` - Xem tất cả hóa đơn trong tháng 10/2025
\`/listbills 20/11/2025\` - Xem hóa đơn trong ngày 20/11/2025
\`/listbills tuong0704\` - Xem hóa đơn của user tuong0704 thanh toán
\`/listbills tuong0704 20/11/2025\` - Xem hóa đơn của user tuong0704 thanh toán ngày 20/11/2025
\`/listbills tuong0704 10 2025\` - Xem hóa đơn của user tuong0704 thánh toán trong tháng 10/2025

📊 *Thống kê:*
\`/stats\` - Thống kê tháng này
\`/stats 10 2025\` - Thống kê tháng 10/2025

🤝 *Đối soát công nợ:*
\`/balance\` - Chia đều chi tiêu tháng này, gợi ý ai trả ai
\`/balance 10/2025\` - Đối soát tháng 10/2025

📤 *Xuất báo cáo:*
\`/export\` - Xuất CSV + biểu đồ tháng này
\`/export 10/2025\` - Xuất báo cáo tháng 10/2025

✅ *Thanh toán hóa đơn:*
\`/paidbill <mã>\` - Đánh dấu hóa đơn đã thanh toán
\`/unpaidbill <mã>\` - Đánh dấu hóa đơn chưa thanh toán
💡 Trong /listbills có nút bấm nhanh để đánh dấu đã trả / xóa

🗑️ *Xóa hóa đơn:*
\`/deletebill <mã>\` - Xóa hóa đơn theo mã

*🏷️ Quản lý loại hóa đơn:*
/categories - Xem danh sách loại
/addcategory - Thêm loại mới
/editcategory - Sửa loại
/deletecategory - Xóa loại

*ℹ️ Lệnh khác:*
/start - Khởi tạo bot
/about - Thông tin về bot

Cần thêm trợ giúp? Liên hệ Tường Tỉnh Táo! 😊
    `;

    await ctx.reply(helpMessage, { parse_mode: "Markdown" });
  },
};
