# Deployment Guide

## 🐛 Problem Fixed

The bot wasn't working after deployment because:
1. **Missing webhook endpoint** - Telegram couldn't send updates to your server
2. **Incorrect bot launch configuration** - Bot tried to use webhook without proper setup
3. **No environment detection** - Bot didn't differentiate between development and production

## ✅ Solution Implemented

The bot now:
- **Automatically detects mode**: Uses webhooks when `WEBHOOK_URL` is set, otherwise uses polling
- **Has proper webhook endpoint**: `/webhook/{BOT_TOKEN}` to receive Telegram updates
- **Validates environment variables**: Checks for required configs before starting
- **Better logging**: Shows which mode it's running in

## 🚀 Deployment Instructions

### 1. Environment Variables

You need to set these environment variables in your deployment platform:

```env
BOT_TOKEN=your_bot_token_from_botfather
MONGODB_URI=your_mongodb_connection_string
WEBHOOK_URL=https://your-deployed-domain.com
PORT=3000
NODE_ENV=production
```

**Important:**
- `WEBHOOK_URL` should be your **deployed domain** (e.g., `https://mybot.railway.app` or `https://mybot.vercel.app`)
- Do NOT include trailing slash
- Do NOT include the `/webhook/` path (it's added automatically)

### 2. Platform-Specific Instructions

#### Railway / Render / Heroku
1. Add all environment variables in the dashboard
2. Deploy from GitHub
3. Check logs to verify: `✅ Webhook set successfully`

#### Vercel (Serverless)
For Vercel, you need a different approach since it's serverless. Create `api/webhook.js`:

```javascript
const bot = require('../bot');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } else {
    res.status(200).json({ status: 'Bot is running' });
  }
};
```

Then set webhook manually:
```bash
curl -X POST https://api.telegram.org/bot{BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/webhook"}'
```

### 3. Verify Deployment

After deploying, check:

1. **Visit your domain** - Should show:
   ```json
   {
     "status": "ok",
     "message": "Bot is running",
     "mode": "webhook",
     "environment": "production"
   }
   ```

2. **Check logs** - Should see:
   ```
   ✅ Database connected
   🌐 Starting bot in WEBHOOK mode...
   📍 Webhook URL: https://your-domain.com/webhook/123...
   ✅ Webhook set successfully
   🚀 Express server is running on port 3000
   ```

3. **Send message to bot** - Should respond immediately

### 4. Troubleshooting

#### Bot not responding?

1. **Check webhook status:**
   ```bash
   curl https://api.telegram.org/bot{BOT_TOKEN}/getWebhookInfo
   ```
   
   Should show:
   - `url`: Your webhook URL
   - `pending_update_count`: Should be 0
   - `last_error_message`: Should be empty

2. **Check logs** for:
   - `📨 Received webhook update:` - If missing, Telegram can't reach your server
   - Any error messages

3. **Common issues:**
   - **URL not accessible**: Make sure your deployed URL is publicly accessible
   - **HTTPS required**: Telegram requires HTTPS for webhooks
   - **Wrong BOT_TOKEN**: Verify token is correct
   - **Database connection failed**: Check MONGODB_URI

#### Reset webhook:
```bash
# Delete webhook (will use polling)
curl -X POST https://api.telegram.org/bot{BOT_TOKEN}/deleteWebhook

# Set new webhook
curl -X POST https://api.telegram.org/bot{BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/webhook/{BOT_TOKEN}"}'
```

## 🧪 Local Development

For local development, **don't set WEBHOOK_URL**. The bot will automatically use polling mode:

```env
BOT_TOKEN=your_bot_token
MONGODB_URI=your_mongodb_uri
# WEBHOOK_URL= (leave empty or comment out)
```

Run with:
```bash
npm start
```

You should see:
```
🔄 Starting bot in POLLING mode...
✅ Bot launched in polling mode
```

## 📝 Notes

- **Webhook mode** is recommended for production (more efficient, instant updates)
- **Polling mode** is better for development (works on localhost)
- The bot automatically chooses the right mode based on `WEBHOOK_URL`
- Telegram will retry failed webhook deliveries for up to 24 hours

