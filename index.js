require("dotenv").config();
const express = require("express");
const bot = require("./bot");
const { connectDB } = require("./utils/database");

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const BOT_TOKEN = process.env.BOT_TOKEN;
const NODE_ENV = process.env.NODE_ENV || "development";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Bot is running",
    timestamp: new Date().toISOString(),
    mode: WEBHOOK_URL ? "webhook" : "polling",
    environment: NODE_ENV,
  });
});

// Webhook endpoint for Telegram updates
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
  try {
    console.log(
      "📨 Received webhook update:",
      JSON.stringify(req.body, null, 2)
    );
    bot.handleUpdate(req.body);
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Error handling webhook update:", error);
    res.status(500).send("Error");
  }
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
    // Validate required environment variables
    if (!BOT_TOKEN) {
      throw new Error("BOT_TOKEN is required");
    }

    // Connect to database
    await connectDB();
    console.log("✅ Database connected");

    // Use webhook mode if WEBHOOK_URL is provided, otherwise use polling
    if (WEBHOOK_URL) {
      console.log("🌐 Starting bot in WEBHOOK mode...");
      console.log(`📍 Webhook URL: ${WEBHOOK_URL}/webhook/${BOT_TOKEN}`);

      // Set webhook
      await bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook/${BOT_TOKEN}`);
      console.log("✅ Webhook set successfully");

      // Note: In webhook mode, we don't call bot.launch()
      // The bot listens via the Express endpoint
    } else {
      console.log("🔄 Starting bot in POLLING mode...");
      await bot.launch();
      console.log("✅ Bot launched in polling mode");
    }
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

// Start the application
main().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Express server is running on port ${PORT}`);
    console.log(`🤖 Bot mode: ${WEBHOOK_URL ? "WEBHOOK" : "POLLING"}`);
  });
});

// Export for Vercel serverless
module.exports = app;
