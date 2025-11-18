/**
 * Command Loader
 * Automatically loads and registers all commands from the commands directory
 */

const fs = require("fs");
const path = require("path");

class CommandHandler {
  constructor() {
    this.commands = new Map();
  }

  /**
   * Load all commands from the commands directory
   */
  loadCommands() {
    this.loadCommandsFromDirectory(__dirname);
    console.log(`✅ Loaded ${this.commands.size} commands`);
  }

  /**
   * Recursively load commands from a directory
   */
  loadCommandsFromDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      // Skip the index.js file
      if (file === "index.js") continue;

      if (stat.isDirectory()) {
        // Recursively load commands from subdirectories
        this.loadCommandsFromDirectory(filePath);
      } else if (file.endsWith(".js")) {
        try {
          const command = require(filePath);

          if (command.name) {
            this.commands.set(command.name, command);
            console.log(`  📝 Loaded command: ${command.name}`);
          }
        } catch (error) {
          console.error(
            `❌ Error loading command from ${filePath}:`,
            error.message
          );
        }
      }
    }
  }

  getCommand(name) {
    return this.commands.get(name);
  }

  getAllCommands() {
    return Array.from(this.commands.values());
  }

  registerCommands(bot) {
    for (const [name, command] of this.commands) {
      bot.command(name, async (ctx) => {
        try {
          const args = ctx.message.text.split(" ").slice(1);

          await command.execute(ctx, args);
        } catch (error) {
          console.error(`Error executing command ${name}:`, error);
          await ctx.reply("❌ An error occurred while executing this command.");
        }
      });
    }
  }
}

module.exports = new CommandHandler();
