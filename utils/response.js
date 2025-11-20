/**
 * Response Utilities
 * Helper functions for sending formatted responses
 */

/**
 * Escape special characters for Telegram Markdown
 * This prevents Markdown parsing errors when user input contains special chars
 *
 * Special characters in Markdown: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
const escapeMarkdown = (text) => {
  if (!text) return text;
  if (typeof text !== "string") return text;

  return text
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`")
    .replace(/>/g, "\\>")
    .replace(/#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/-/g, "\\-")
    .replace(/=/g, "\\=")
    .replace(/\|/g, "\\|")
    .replace(/\{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!");
};

/**
 * Send a success message
 */
const sendSuccess = async (ctx, message) => {
  return ctx.reply(`✅ ${message}`, { parse_mode: "Markdown" });
};

/**
 * Send an error message
 */
const sendError = async (ctx, message) => {
  return ctx.reply(`❌ ${message}`, { parse_mode: "Markdown" });
};

/**
 * Send an info message
 */
const sendInfo = async (ctx, message) => {
  return ctx.reply(`ℹ️ ${message}`, { parse_mode: "Markdown" });
};

/**
 * Send a warning message
 */
const sendWarning = async (ctx, message) => {
  return ctx.reply(`⚠️ ${message}`, { parse_mode: "Markdown" });
};

/**
 * Send a loading message (can be edited later)
 */
const sendLoading = async (ctx, message = "Processing...") => {
  return ctx.reply(`⏳ ${message}`);
};

module.exports = {
  sendSuccess,
  sendError,
  sendInfo,
  sendWarning,
  sendLoading,
  escapeMarkdown,
};
