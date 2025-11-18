# TuquFamily Telegram Bot

A well-structured Telegram bot built with Node.js and Telegraf.

## 📁 Project Structure

```
tuqufamily_bot/
├── commands/              # Bot commands
│   ├── admin/            # Admin-only commands
│   │   └── stats.js      # Bot statistics
│   ├── utility/          # Utility commands
│   │   ├── echo.js       # Echo command
│   │   └── ping.js       # Ping/pong command
│   ├── start.js          # Welcome command
│   ├── help.js           # Help command
│   ├── about.js          # About command
│   └── index.js          # Command loader
├── middlewares/          # Bot middlewares
│   ├── auth.js          # Authentication middleware
│   ├── errorHandler.js  # Error handling
│   └── logger.js        # Request logging
├── models/              # Database models
│   └── User.js          # User model
├── utils/               # Utility functions
│   ├── database.js      # Database helpers
│   └── response.js      # Response helpers
├── controller/          # Legacy controller (webhook)
│   ├── lib/
│   │   ├── axios.js
│   │   └── Telegram.js
│   └── index.js
├── bot.js               # Bot setup and configuration
├── index.js             # Application entry point
├── .env                 # Environment variables
└── package.json         # Dependencies
```

## 🚀 Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with the following variables:

```env
BOT_TOKEN=your_bot_token_here
MONGODB_URI=your_mongodb_uri_here
```

3. Start the bot:

```bash
npm start
```

## 📝 Adding New Commands

To add a new command, create a new file in the `commands/` directory (or subdirectory):

```javascript
// commands/mycommand.js
module.exports = {
  name: "mycommand",
  description: "Description of my command",
  category: "general", // optional
  adminOnly: false, // optional, default false
  usage: "/mycommand <args>", // optional

  async execute(ctx, args) {
    // Your command logic here
    await ctx.reply("Command executed!");
  },
};
```

The command will be automatically loaded on bot startup.

## 🔧 Available Commands

### General Commands

- `/start` - Welcome message
- `/help` - List of commands
- `/about` - Bot information

## 🛠️ Middlewares

- **Logger**: Logs all incoming messages and response times
- **Error Handler**: Catches and handles errors gracefully
- **Auth**: Authentication and authorization checks

## 💾 Database

The bot uses MongoDB to store user data. The User model includes:

- Telegram user info (ID, username, name)
- Join date

## 📦 Dependencies

- `telegraf` - Telegram bot framework
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variable management
- `axios` - HTTP client
- `express` - Web framework (for webhooks)

## 🔄 Development

The project uses a modular architecture:

- Commands are automatically loaded from the `commands/` directory
- Middlewares are applied globally in `bot.js`
- Database utilities are in `utils/database.js`
- Response helpers are in `utils/response.js`

## 📄 License

ISC
