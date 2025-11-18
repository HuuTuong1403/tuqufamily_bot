/**
 * Authentication Middleware
 * Checks if user is authorized to use the bot
 */

module.exports = () => {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    // Allow all users by default
    // You can implement whitelist/blacklist logic here
    
    const allowedUsers = process.env.ALLOWED_USERS 
      ? process.env.ALLOWED_USERS.split(',').map(id => parseInt(id))
      : null;

    // If whitelist is configured, check if user is allowed
    if (allowedUsers && allowedUsers.length > 0) {
      if (!allowedUsers.includes(userId)) {
        console.log(`🚫 Unauthorized access attempt by user ${userId}`);
        return ctx.reply('❌ You are not authorized to use this bot.');
      }
    }

    // Store user info in context for later use
    ctx.state.userId = userId;
    ctx.state.chatId = chatId;

    await next();
  };
};

