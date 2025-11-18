/**
 * /about command handler
 * Shows information about the bot
 */

module.exports = {
  name: "about",
  description: "Thông tin người giúp việc",

  async execute(ctx) {
    const aboutMessage = `
ℹ️ *Một vài thông tin về người giúp việc này*

Phiên bản: 1.0.0 (Bản đầu tiền chắc cũng là cuối cùng)

Được mày mò bởi Tường Tỉnh Táo
    `;

    await ctx.reply(aboutMessage, { parse_mode: "Markdown" });
  },
};
