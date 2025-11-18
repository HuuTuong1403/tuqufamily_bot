/**
 * Command Loader
 * Explicitly imports all commands (works in serverless environments)
 */

// Import all commands explicitly
const start = require("./start");
const help = require("./help");
const about = require("./about");

// Bill commands
const addbill = require("./bill/addbill");
const deletebill = require("./bill/deletebill");
const listbills = require("./bill/listbills");
const stats = require("./bill/stats");

// Category commands
const addcategory = require("./category/addcategory");
const categories = require("./category/categories");
const deletecategory = require("./category/deletecategory");
const editcategory = require("./category/editcategory");

class CommandHandler {
  constructor() {
    this.commands = new Map();
  }

  /**
   * Load all commands
   */
  loadCommands() {
    // Register all commands
    const commandList = [
      start,
      help,
      about,
      addbill,
      deletebill,
      listbills,
      stats,
      addcategory,
      categories,
      deletecategory,
      editcategory,
    ];

    for (const command of commandList) {
      if (command && command.name) {
        this.commands.set(command.name, command);
        console.log(`  📝 Loaded command: ${command.name}`);
      }
    }

    console.log(`✅ Loaded ${this.commands.size} commands`);
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
