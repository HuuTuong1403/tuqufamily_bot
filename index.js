require("dotenv").config();
const express = require("express");
const bot = require("./bot");
const { connectDB } = require("./utils/database");

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = `/webhook/${process.env.BOT_TOKEN}`;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Bot is running",
    timestamp: new Date().toISOString(),
  });
});

// Webhook endpoint for Telegram
app.post(WEBHOOK_PATH, (req, res) => {
  bot.handleUpdate(req.body, res);
});

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  try {
    await bot.stop(signal);
    console.log("✅ Bot stopped");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Main function
async function main() {
  try {
    // Connect to database
    await connectDB();
    console.log("✅ Database connected");

    // Set webhook for production, use polling for development
    if (process.env.NODE_ENV === "production") {
      await bot.telegram.setWebhook(WEBHOOK_URL);
      console.log("🔗 Webhook set to:", WEBHOOK_URL);
    } else {
      // For local development
      await bot.launch();
      console.log("🔄 Bot is running in polling mode (development)");
    }

    console.log(`Bot username: @${bot.botInfo.username}`);
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

// Start the application
main().then(() => {
  console.log("Test");
  app.listen(PORT, () => {
    console.log(`🚀 Express server is running on port ${PORT}`);
  });
});

// Export for Vercel serverless
module.exports = app;
