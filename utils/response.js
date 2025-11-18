/**
 * Response Utilities
 * Helper functions for sending formatted responses
 */

/**
 * Send a success message
 */
const sendSuccess = async (ctx, message) => {
  return ctx.reply(`✅ ${message}`, { parse_mode: 'Markdown' });
};

/**
 * Send an error message
 */
const sendError = async (ctx, message) => {
  return ctx.reply(`❌ ${message}`, { parse_mode: 'Markdown' });
};

/**
 * Send an info message
 */
const sendInfo = async (ctx, message) => {
  return ctx.reply(`ℹ️ ${message}`, { parse_mode: 'Markdown' });
};

/**
 * Send a warning message
 */
const sendWarning = async (ctx, message) => {
  return ctx.reply(`⚠️ ${message}`, { parse_mode: 'Markdown' });
};

/**
 * Send a loading message (can be edited later)
 */
const sendLoading = async (ctx, message = 'Processing...') => {
  return ctx.reply(`⏳ ${message}`);
};

module.exports = {
  sendSuccess,
  sendError,
  sendInfo,
  sendWarning,
  sendLoading
};

