# 🚀 AlpacaTrade - Crypto Trading Platform

A professional crypto trading platform built with React, Zustand, and Alpaca API. Trade cryptocurrencies with both paper trading (virtual money) and live trading modes.

## ✨ Features

- 📊 **Real-time Dashboard** - Portfolio value, P/L, buying power tracking
- 💱 **Trading Interface** - Market & limit orders with live price charts
- 💼 **Portfolio Management** - Allocation breakdown, holdings with real-time P/L
- 📝 **Order Management** - View and cancel pending orders, complete order history
- 🔄 **Dual Trading Modes** - Switch between Paper (test) and Live (real money)
- ⚡ **Real-time Data** - Auto-refreshing market data every 5 seconds
- 🎯 **Watchlist** - Track your favorite crypto pairs
- 🎨 **Professional UI** - Dark mode finance interface

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Zustand** - State management
- **Recharts** - Data visualization
- **Alpaca API** - Live trading & market data
- **Vite** - Build tool
- **Vercel** - Deployment platform

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd alpaca-crypto-trader
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🚀 Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Go to [Vercel](https://vercel.com)**

3. **Click "New Project"**

4. **Import your GitHub repository**

5. **Vercel auto-detects Vite** - Just click "Deploy"

6. **Done!** Your app is live at `https://your-app.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## 🔑 Getting Alpaca API Keys

### Paper Trading (Free, Virtual Money)

1. Go to [Alpaca Paper Trading](https://app.alpaca.markets/paper/dashboard/overview)
2. Sign up for free account
3. Navigate to "API Keys" section
4. Generate new paper trading API keys
5. Copy **API Key** and **Secret Key**

### Live Trading (Real Money)

1. Go to [Alpaca Live Trading](https://app.alpaca.markets/brokerage/dashboard/overview)
2. Complete account verification (requires identity verification)
3. Fund your account
4. Navigate to "API Keys" section
5. Generate new live trading API keys
6. Copy **API Key** and **Secret Key**

## 🎮 How to Use

### 1. Configure API Keys

- Click **Settings** in the navigation
- Enter your Paper Trading API keys
- (Optional) Enter your Live Trading API keys
- Click "Save" for each

### 2. Choose Trading Mode

- In Settings, select **Paper Trading** or **Live Trading**
- Paper mode uses virtual money (safe for testing)
- Live mode uses real money (requires funded account)

### 3. Start Trading

- **Dashboard** - View portfolio overview and watchlist
- **Trading** - Place buy/sell orders with market or limit prices
- **Portfolio** - See allocation breakdown and holdings
- **Orders** - Manage pending orders and view history

### 4. Manage Watchlist

- In Settings, add crypto symbols (e.g., BTCUSD, ETHUSD, SOLUSD)
- View prices and mini charts on Dashboard
- Use watchlist symbols for quick trading

## 🔐 Security Notes

- **API keys are stored in browser memory only** (not persisted)
- You'll need to re-enter keys each session
- Live trading has confirmation dialog for safety
- Never commit API keys to version control
- Use environment variables for production deployments

## 📊 Supported Crypto Pairs

- BTCUSD (Bitcoin)
- ETHUSD (Ethereum)
- SOLUSD (Solana)
- AVAXUSD (Avalanche)
- DOGEUSD (Dogecoin)
- MATICUSD (Polygon)
- And more on Alpaca...

## 🐛 Troubleshooting

### API Connection Issues

- Verify API keys are correct (no extra spaces)
- Check Alpaca account status
- Ensure proper mode (paper vs live) is selected
- Check browser console for detailed errors

### CORS Errors

- Alpaca API should work from browser
- If issues persist, consider adding a backend proxy

### Orders Not Executing

- Verify sufficient buying power
- Check market hours (crypto trades 24/7)
- Ensure valid symbol format (e.g., BTCUSD not BTC)

## 📝 Environment Variables (Optional)

For production deployments, you can use environment variables:

```env
VITE_PAPER_API_KEY=your_paper_key
VITE_PAPER_SECRET_KEY=your_paper_secret
VITE_LIVE_API_KEY=your_live_key
VITE_LIVE_SECRET_KEY=your_live_secret
```

Update the code to read from `import.meta.env.VITE_*` variables.

## 🔄 Updates & Maintenance

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build
```

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## ⚠️ Disclaimer

**This software is for educational purposes only.**

- Trading cryptocurrencies involves substantial risk
- Past performance does not guarantee future results
- Only trade with money you can afford to lose
- Always start with paper trading before live trading
- Not financial advice - DYOR (Do Your Own Research)

## 🤝 Support

For issues with:
- **App functionality** - Open a GitHub issue
- **Alpaca API** - Check [Alpaca Docs](https://docs.alpaca.markets/)
- **Trading questions** - Contact Alpaca support

---

Built with ⚡ by [Your Name]
