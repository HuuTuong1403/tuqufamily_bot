/**
 * /start command handler
 * Khởi tạo bot và hiển thị thông tin chào mừng
 */

module.exports = {
  name: "start",
  description: "Khởi tạo người giúp việc",

  async execute(ctx) {
    const welcomeMessage = `
👋 *Chào mừng đến với TuquFamily Bot!*

Tôi là trợ lý quản lý chi tiêu của bạn. Tôi có thể giúp bạn:

*💰 Quản lý hóa đơn:*
• /addbill - Thêm hóa đơn mới
• /listbills - Xem danh sách hóa đơn
• /deletebill - Xóa hóa đơn
• /stats - Thống kê chi tiêu

*🏷️ Quản lý loại chi tiêu:*
• /categories - Xem các loại
• /addcategory - Thêm loại mới
• /editcategory - Sửa loại
• /deletecategory - Xóa loại

*ℹ️ Thông tin:*
• /help - Hướng dẫn sử dụng
• /about - Về bot này

Hãy bắt đầu bằng cách xem các loại: /categories
Hoặc thêm hóa đơn đầu tiên: /addbill điện 500000 Tiền điện
    `;

    await ctx.reply(welcomeMessage, { parse_mode: "Markdown" });
  },
};
