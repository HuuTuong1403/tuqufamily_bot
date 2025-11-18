require("dotenv").config();
const { Telegraf } = require("telegraf");
const commandHandler = require("./commands");
const logger = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");
const auth = require("./middlewares/auth");
const User = require("./models/User");

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Apply middlewares
bot.use(errorHandler());
bot.use(logger());
bot.use(auth());

// Middleware to track users
bot.use(async (ctx, next) => {
  if (ctx.from) {
    try {
      ctx.state.user = await User.findOrCreate(ctx.from);
    } catch (error) {
      console.error("Error finding/creating user:", error);
    }
  }
  await next();
});

// Load and register commands
console.log("🔄 Loading commands...");
commandHandler.loadCommands();
commandHandler.registerCommands(bot);

// Handle text messages that are not commands
bot.on("text", async (ctx) => {
  const text = ctx.message.text;

  // Skip if it's a command (already handled)
  if (text.startsWith("/")) return;

  // Echo non-command messages
  await ctx.reply(`You said: ${text}\n\nTry /help to see available commands.`);
});

// Handle callback queries (for inline keyboards)
bot.on("callback_query", async (ctx) => {
  await ctx.answerCbQuery();
  // Handle callback data here
});

module.exports = bot;
