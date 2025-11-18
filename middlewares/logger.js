/**
 * Logger Middleware
 * Logs all incoming messages and commands
 */

module.exports = () => {
  return async (ctx, next) => {
    const start = Date.now();
    const userId = ctx.from?.id || 'unknown';
    const username = ctx.from?.username || 'unknown';
    const messageType = ctx.updateType;
    const messageText = ctx.message?.text || ctx.callbackQuery?.data || '';

    console.log(`📨 [${new Date().toISOString()}] User ${username} (${userId}): ${messageText}`);

    try {
      await next();
    } catch (error) {
      console.error(`❌ Error processing update:`, error);
      throw error;
    }

    const responseTime = Date.now() - start;
    console.log(`✅ Processed in ${responseTime}ms`);
  };
};

