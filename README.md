# 🏪 Village Shop — Setup Guide

## 📁 What's in this package

```
index.html          ← Website (open in browser or host on GitHub Pages)
discord-bot/
  index.js          ← Bot code
  bank.json         ← Price data (update this to change prices)
  package.json      ← Node dependencies
  .env.example      ← Config template
  README.md         ← This file
```

---

## 🌐 Website Setup

**Option A — Local (simplest):**
Just open `index.html` in any browser. Done!

**Option B — GitHub Pages (free, public URL):**
1. Create a GitHub account at github.com
2. Create a new repository (e.g. `village-shop`)
3. Upload `index.html` to it
4. Go to Settings → Pages → Source: `main` branch
5. Your site is live at `https://yourusername.github.io/village-shop`

---

## 🤖 Discord Bot Setup

### Step 1 — Create the bot
1. Go to https://discord.com/developers/applications
2. Click **New Application** → give it a name (e.g. "Village Shop")
3. Go to **Bot** tab → click **Add Bot**
4. Under **Token** → click **Reset Token** → copy it (save it!)
5. Scroll down → enable **applications.commands** scope

### Step 2 — Invite bot to your server
1. Go to **OAuth2 → URL Generator**
2. Check scopes: `bot` + `applications.commands`
3. Check bot permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`
4. Copy the URL and open it → select your server → Authorize

### Step 3 — Configure
1. Rename `.env.example` to `.env`
2. Fill in:
   - `BOT_TOKEN` — from Step 1
   - `APP_ID` — from Discord Dev Portal → General Information → Application ID
   - `GUILD_ID` — right-click your Discord server → Copy Server ID
     (Enable Developer Mode in Discord: Settings → Advanced → Developer Mode)

### Step 4 — Run the bot
```bash
npm install
node index.js
```

Bot is now online! Try these commands in Discord:
- `/shop` — browse all items with pagination
- `/price emerald` — look up a specific item
- `/search berry` — search items by name

---

## 🔄 Updating Prices

Just edit `bank.json` — both the website and bot read from the same file!
For the website, after editing you just refresh the page (or re-upload to GitHub).
For the bot, restart it with `node index.js`.

---

## 🚀 Keeping the bot online 24/7 (free)

Use **Railway.app**:
1. Push your `discord-bot/` folder to a GitHub repo
2. Sign up at railway.app → New Project → Deploy from GitHub
3. Add your environment variables in Railway's dashboard
4. Done — bot stays online permanently for free!
