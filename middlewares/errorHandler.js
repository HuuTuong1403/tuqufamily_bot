/**
 * Error Handler Middleware
 * Catches and handles errors gracefully
 */

module.exports = () => {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      console.error('❌ Error caught by error handler:', error);
      
      // Log error details
      console.error({
        error: error.message,
        stack: error.stack,
        user: ctx.from?.id,
        chat: ctx.chat?.id,
        message: ctx.message?.text
      });

      // Send user-friendly error message
      try {
        await ctx.reply(
          '⚠️ Sorry, something went wrong while processing your request. Please try again later.',
          { reply_to_message_id: ctx.message?.message_id }
        );
      } catch (replyError) {
        console.error('Failed to send error message to user:', replyError);
      }
    }
  };
};

