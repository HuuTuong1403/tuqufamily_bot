/**
 * Main Application Entry Point
 * Starts the bot and connects to database
 */

require("dotenv").config();
const bot = require("./bot");
const { connectDB } = require("./utils/database");

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

    // Launch bot
    await bot.launch();
    console.log("🚀 Bot is running!");
    console.log(`Bot username: @${bot.botInfo.username}`);
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

// Start the application
main();
