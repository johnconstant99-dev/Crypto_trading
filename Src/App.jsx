import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { create } from 'zustand';
import { SpeedInsights } from '@vercel/speed-insights/react';
// Zustand Store
const useStore = create((set, get) => ({
// API Configuration
mode: 'paper', // 'paper' or 'live'
paperApiKey: '',
paperSecretKey: '',
liveApiKey: '',
liveSecretKey: '',
// Portfolio Data
account: null,
positions: [],
orders: [],
// Market Data
quotes: {},
watchlist: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'AVAXUSD'],
// UI State
currentPage: 'dashboard',
selectedSymbol: null,
// Actions
setMode: (mode) => set({ mode }),
setApiKeys: (type, apiKey, secretKey) => set({
[`${type}ApiKey`]: apiKey,
[`${type}SecretKey`]: secretKey,
}),
setAccount: (account) => set({ account }),
setPositions: (positions) => set({ positions }),
setOrders: (orders) => set({ orders }),
updateQuote: (symbol, quote) => set((state) => ({
quotes: { ...state.quotes, [symbol]: quote }
})),
setCurrentPage: (page) => set({ currentPage: page }),
setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
addToWatchlist: (symbol) => set((state) => ({
watchlist: [...new Set([...state.watchlist, symbol])]
})),
removeFromWatchlist: (symbol) => set((state) => ({
watchlist: state.watchlist.filter(s => s !== symbol)
})),
}));
// Alpaca API Helper
class AlpacaAPI {
constructor(apiKey, secretKey, isPaper = true) {
this.apiKey = apiKey;
this.secretKey = secretKey;
this.baseUrl = isPaper
? 'https://paper-api.alpaca.markets'
: 'https://api.alpaca.markets';
this.dataUrl = 'https://data.alpaca.markets';
}
async request(endpoint, method = 'GET', body = null) {
const headers = {
'APCA-API-KEY-ID': this.apiKey,
'APCA-API-SECRET-KEY': this.secretKey,
'Content-Type': 'application/json',
};
const options = { method, headers };
if (body) options.body = JSON.stringify(body);
const response = await fetch(`${this.baseUrl}${endpoint}`, options);
if (!response.ok) {
const error = await response.json();
throw new Error(error.message || 'API request failed');
}
return response.json();
}
async getAccount() {
return this.request('/v2/account');
}
async getPositions() {
return this.request('/v2/positions');
}
async getOrders(status = 'all') {
return this.request(`/v2/orders?status=${status}&limit=50`);
}
async placeOrder(symbol, qty, side, type = 'market', timeInForce = 'gtc', limitPrice = null) {
const order = {
symbol,
qty,
side,
type,
time_in_force: timeInForce,
};
if (type === 'limit' && limitPrice) {
order.limit_price = limitPrice;
}
return this.request('/v2/orders', 'POST', order);
}
async cancelOrder(orderId) {
return this.request(`/v2/orders/${orderId}`, 'DELETE');
}
async getLatestQuote(symbol) {
const headers = {
'APCA-API-KEY-ID': this.apiKey,
'APCA-API-SECRET-KEY': this.secretKey,
};
const response = await fetch(
`${this.dataUrl}/v1beta3/crypto/us/latest/quotes?symbols=${symbol}`,
{ headers }
);
const data = await response.json();
return data.quotes?.[symbol];
}
async getLatestTrades(symbols) {
const headers = {
'APCA-API-KEY-ID': this.apiKey,
'APCA-API-SECRET-KEY': this.secretKey,
};
const symbolStr = symbols.join(',');
const response = await fetch(
`${this.dataUrl}/v1beta3/crypto/us/latest/trades?symbols=${symbolStr}`,
{ headers }
);
return response.json();
}
}
// Components
function Navbar() {
const { currentPage, setCurrentPage, mode } = useStore();
const navItems = [
{ id: 'dashboard', icon: ' ', label: 'Dashboard' },
{ id: 'trading', icon: ' ', label: 'Trading' },
{ id: 'portfolio', icon: ' ', label: 'Portfolio' },
{ id: 'orders', icon: ' ', label: 'Orders' },
{ id: 'settings', icon: ' ', label: 'Settings' },
];
return (
<nav className="navbar">
<div className="nav-brand">
<span className="logo"> </span>
<span className="brand-name">AlpacaTrade</span>
<span className={`mode-badge ${mode}`}>{mode.toUpperCase()}</span>
</div>
<div className="nav-items">
{navItems.map(item => (
<button
key={item.id}
className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
onClick={() => setCurrentPage(item.id)}
>
<span className="nav-icon">{item.icon}</span>
<span className="nav-label">{item.label}</span>
</button>
))}
</div>
</nav>
);
}
function Dashboard() {
const { account, positions, quotes, watchlist } = useStore();
const totalValue = account?.portfolio_value || 0;
const cashBalance = account?.cash || 0;
const buyingPower = account?.buying_power || 0;
const dayPL = account?.equity ? parseFloat(account.equity) - parseFloat(account.last_equity) : 0;
const dayPLPercent = account?.last_equity ? (dayPL / parseFloat(account.last_equity)) * 100 : 0;
return (
<div className="page">
<h1 className="page-title">Dashboard</h1>
<div className="stats-grid">
<div className="stat-card">
<div className="stat-label">Portfolio Value</div>
<div className="stat-value">${parseFloat(totalValue).toFixed(2)}</div>
</div>
<div className="stat-card">
<div className="stat-label">Cash Balance</div>
<div className="stat-value">${parseFloat(cashBalance).toFixed(2)}</div>
</div>
<div className="stat-card">
<div className="stat-label">Buying Power</div>
<div className="stat-value">${parseFloat(buyingPower).toFixed(2)}</div>
</div>
<div className="stat-card">
<div className="stat-label">Day P/L</div>
<div className={`stat-value ${dayPL >= 0 ? 'positive' : 'negative'}`}>
{dayPL >= 0 ? '+' : ''}${dayPL.toFixed(2)} ({dayPLPercent.toFixed(2)}%)
</div>
</div>
</div>
<div className="section">
<h2 className="section-title">Watchlist</h2>
<div className="watchlist-grid">
{watchlist.map(symbol => {
const quote = quotes[symbol];
const price = quote?.ap || 0;
return (
<div key={symbol} className="watchlist-card">
<div className="crypto-header">
<span className="crypto-symbol">{symbol.replace('USD', '')}</span>
<span className="crypto-name">{symbol}</span>
</div>
<div className="crypto-price">${price.toFixed(2)}</div>
<MiniChart symbol={symbol} />
</div>
);
})}
</div>
</div>
<div className="section">
<h2 className="section-title">Open Positions</h2>
{positions.length === 0 ? (
<div className="empty-state">No open positions</div>
) : (
<div className="positions-list">
{positions.map(position => {
const unrealizedPL = parseFloat(position.unrealized_pl);
const unrealizedPLPercent = parseFloat(position.unrealized_plpc) * 100;
return (
<div key={position.symbol} className="position-card">
<div className="position-header">
<span className="position-symbol">{position.symbol.replace('USD', '')}</span>
<span className="position-qty">{position.qty} {position.symbol.replace('USD', '')}</span>
</div>
<div className="position-details">
<div className="detail-item">
<span className="detail-label">Avg Price:</span>
<span className="detail-value">${parseFloat(position.avg_entry_price).toFixed(2)}</span>
</div>
<div className="detail-item">
<span className="detail-label">Current:</span>
<span className="detail-value">${parseFloat(position.current_price).toFixed(2)}</span>
</div>
<div className="detail-item">
<span className="detail-label">P/L:</span>
<span className={`detail-value ${unrealizedPL >= 0 ? 'positive' : 'negative'}`}>
{unrealizedPL >= 0 ? '+' : ''}${unrealizedPL.toFixed(2)} ({unrealizedPLPercent.toFixed(2)}%)
</span>
</div>
</div>
</div>
);
})}
</div>
)}
</div>
</div>
);
}
function Trading() {
const { quotes, watchlist, mode, paperApiKey, paperSecretKey, liveApiKey, liveSecretKey } = useStore();
const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');
const [orderSide, setOrderSide] = useState('buy');
const [orderType, setOrderType] = useState('market');
const [quantity, setQuantity] = useState('');
const [limitPrice, setLimitPrice] = useState('');
const [status, setStatus] = useState('');
const [showConfirm, setShowConfirm] = useState(false);
const api = new AlpacaAPI(
mode === 'paper' ? paperApiKey : liveApiKey,
mode === 'paper' ? paperSecretKey : liveSecretKey,
mode === 'paper'
);
const currentQuote = quotes[selectedSymbol];
const currentPrice = currentQuote?.ap || 0;
const executeOrder = async () => {
if (!quantity || parseFloat(quantity) <= 0) {
setStatus(' Invalid quantity');
return;
}
if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
setStatus(' Invalid limit price');
return;
}
if (mode === 'live') {
setShowConfirm(true);
return;
}
await placeOrder();
};
const placeOrder = async () => {
try {
setStatus(' Placing order...');
const order = await api.placeOrder(
selectedSymbol,
parseFloat(quantity),
orderSide,
orderType,
'gtc',
orderType === 'limit' ? parseFloat(limitPrice) : null
);
setStatus(` Order placed: ${order.id}`);
setQuantity('');
setLimitPrice('');
setShowConfirm(false);
} catch (error) {
setStatus(` Error: ${error.message}`);
setShowConfirm(false);
}
};
return (
<div className="page">
<h1 className="page-title">Trading</h1>
<div className="trading-layout">
<div className="trading-chart">
<div className="chart-header">
<select
className="symbol-select"
value={selectedSymbol}
onChange={(e) => setSelectedSymbol(e.target.value)}
>
{watchlist.map(symbol => (
<option key={symbol} value={symbol}>{symbol}</option>
))}
</select>
<div className="current-price">
${currentPrice.toFixed(2)}
</div>
</div>
<PriceChart symbol={selectedSymbol} />
</div>
<div className="order-panel">
<h2 className="panel-title">Place Order</h2>
<div className="order-tabs">
<button
className={`order-tab buy ${orderSide === 'buy' ? 'active' : ''}`}
onClick={() => setOrderSide('buy')}
>
Buy
</button>
<button
className={`order-tab sell ${orderSide === 'sell' ? 'active' : ''}`}
onClick={() => setOrderSide('sell')}
>
Sell
</button>
</div>
<div className="order-type-tabs">
<button
className={`type-tab ${orderType === 'market' ? 'active' : ''}`}
onClick={() => setOrderType('market')}
>
Market
</button>
<button
className={`type-tab ${orderType === 'limit' ? 'active' : ''}`}
onClick={() => setOrderType('limit')}
>
Limit
</button>
</div>
<div className="form-group">
<label>Quantity</label>
<input
type="number"
step="0.001"
placeholder="0.00"
value={quantity}
onChange={(e) => setQuantity(e.target.value)}
className="form-input"
/>
</div>
{orderType === 'limit' && (
<div className="form-group">
<label>Limit Price</label>
<input
type="number"
step="0.01"
placeholder="0.00"
value={limitPrice}
onChange={(e) => setLimitPrice(e.target.value)}
className="form-input"
/>
</div>
)}
<div className="order-summary">
<div className="summary-row">
<span>Type:</span>
<span>{orderType.toUpperCase()}</span>
</div>
<div className="summary-row">
<span>Est. Total:</span>
<span>${(parseFloat(quantity || 0) * (orderType === 'limit' ? parseFloat(limitPrice || 0) : currentPrice)).toFixed(2)}</span>
</div>
</div>
<button
className={`order-submit ${orderSide}`}
onClick={executeOrder}
>
{orderSide === 'buy' ? 'Buy' : 'Sell'} {selectedSymbol.replace('USD', '')}
</button>
{status && (
<div className="order-status">{status}</div>
)}
</div>
</div>
{showConfirm && (
<div className="modal-overlay" onClick={() => setShowConfirm(false)}>
<div className="modal" onClick={(e) => e.stopPropagation()}>
<h2 className="modal-title"> Confirm LIVE Order</h2>
<p className="modal-text">
You are about to place a LIVE order with real money:
</p>
<div className="modal-details">
<div><strong>Side:</strong> {orderSide.toUpperCase()}</div>
<div><strong>Symbol:</strong> {selectedSymbol}</div>
<div><strong>Quantity:</strong> {quantity}</div>
<div><strong>Type:</strong> {orderType.toUpperCase()}</div>
{orderType === 'limit' && <div><strong>Limit Price:</strong> ${limitPrice}</div>}
</div>
<div className="modal-actions">
<button className="btn-cancel" onClick={() => setShowConfirm(false)}>
Cancel
</button>
<button className="btn-confirm" onClick={placeOrder}>
Confirm Order
</button>
</div>
</div>
</div>
)}
</div>
);
}
function Portfolio() {
const { positions, account, quotes } = useStore();
const totalValue = account?.portfolio_value || 0;
const positionsValue = positions.reduce((sum, p) => sum + parseFloat(p.market_value), 0);
const cashValue = parseFloat(account?.cash || 0);
return (
<div className="page">
<h1 className="page-title">Portfolio</h1>
<div className="portfolio-allocation">
<h2 className="section-title">Allocation</h2>
<div className="allocation-bars">
<div className="allocation-bar">
<div className="bar-label">
<span>Cash</span>
<span>${cashValue.toFixed(2)} ({((cashValue / totalValue) * 100).toFixed(1)}%)</span>
</div>
<div className="bar-track">
<div
className="bar-fill cash"
style={{ width: `${(cashValue / totalValue) * 100}%` }}
/>
</div>
</div>
{positions.map(position => {
const value = parseFloat(position.market_value);
const percent = (value / totalValue) * 100;
return (
<div key={position.symbol} className="allocation-bar">
<div className="bar-label">
<span>{position.symbol.replace('USD', '')}</span>
<span>${value.toFixed(2)} ({percent.toFixed(1)}%)</span>
</div>
<div className="bar-track">
<div
className="bar-fill crypto"
style={{ width: `${percent}%` }}
/>
</div>
</div>
);
})}
</div>
</div>
<div className="section">
<h2 className="section-title">Holdings</h2>
<div className="holdings-table">
<div className="table-header">
<div>Symbol</div>
<div>Quantity</div>
<div>Avg Price</div>
<div>Current Price</div>
<div>Market Value</div>
<div>P/L</div>
</div>
{positions.map(position => {
const unrealizedPL = parseFloat(position.unrealized_pl);
const unrealizedPLPercent = parseFloat(position.unrealized_plpc) * 100;
return (
<div key={position.symbol} className="table-row">
<div className="cell-symbol">{position.symbol.replace('USD', '')}</div>
<div>{position.qty}</div>
<div>${parseFloat(position.avg_entry_price).toFixed(2)}</div>
<div>${parseFloat(position.current_price).toFixed(2)}</div>
<div>${parseFloat(position.market_value).toFixed(2)}</div>
<div className={unrealizedPL >= 0 ? 'positive' : 'negative'}>
{unrealizedPL >= 0 ? '+' : ''}${unrealizedPL.toFixed(2)} ({unrealizedPLPercent.toFixed(2)}%)
</div>
</div>
);
})}
</div>
</div>
</div>
);
}
function Orders() {
const { orders, mode, paperApiKey, paperSecretKey, liveApiKey, liveSecretKey } = useStore()
const [status, setStatus] = useState('');
const api = new AlpacaAPI(
mode === 'paper' ? paperApiKey : liveApiKey,
mode === 'paper' ? paperSecretKey : liveSecretKey,
mode === 'paper'
);
const cancelOrder = async (orderId) => {
try {
setStatus(` Canceling order ${orderId}...`);
await api.cancelOrder(orderId);
setStatus(` Order canceled`);
setTimeout(() => setStatus(''), 3000);
} catch (error) {
setStatus(` Error: ${error.message}`);
}
};
const pendingOrders = orders.filter(o => ['new', 'partially_filled', 'pending_new'].includes(o.status));
const completedOrders = orders.filter(o => !['new', 'partially_filled', 'pending_new'].includes(o.status));
return (
<div className="page">
<h1 className="page-title">Orders</h1>
{status && <div className="order-status">{status}</div>}
<div className="section">
<h2 className="section-title">Pending Orders ({pendingOrders.length})</h2>
{pendingOrders.length === 0 ? (
<div className="empty-state">No pending orders</div>
) : (
<div className="orders-list">
{pendingOrders.map(order => (
<div key={order.id} className="order-card">
<div className="order-header">
<span className={`order-side ${order.side}`}>{order.side.toUpperCase()}</span>
<span className="order-symbol">{order.symbol}</span>
<span className={`order-status ${order.status}`}>{order.status}</span>
</div>
<div className="order-details">
<div><strong>Type:</strong> {order.type}</div>
<div><strong>Qty:</strong> {order.qty}</div>
{order.limit_price && <div><strong>Limit:</strong> ${parseFloat(order.limit_price).toFixed(2)}</div>}
<div><strong>Filled:</strong> {order.filled_qty}/{order.qty}</div>
<div><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</div>
</div>
<button
className="btn-cancel-order"
onClick={() => cancelOrder(order.id)}
>
Cancel Order
</button>
</div>
))}
</div>
)}
</div>
<div className="section">
<h2 className="section-title">Order History</h2>
{completedOrders.length === 0 ? (
<div className="empty-state">No order history</div>
) : (
<div className="orders-list">
{completedOrders.slice(0, 20).map(order => (
<div key={order.id} className="order-card">
<div className="order-header">
<span className={`order-side ${order.side}`}>{order.side.toUpperCase()}</span>
<span className="order-symbol">{order.symbol}</span>
<span className={`order-status ${order.status}`}>{order.status}</span>
</div>
<div className="order-details">
<div><strong>Type:</strong> {order.type}</div>
<div><strong>Qty:</strong> {order.qty}</div>
{order.filled_avg_price && <div><strong>Avg Fill:</strong> ${parseFloat(order.filled_avg_price).toFixed(2)}</div>}
<div><strong>Filled:</strong> {order.filled_qty}/{order.qty}</div>
<div><strong>Updated:</strong> {new Date(order.updated_at).toLocaleString()}</div>
</div>
</div>
))}
</div>
)}
</div>
</div>
);
}
function Settings() {
const {
mode, setMode,
paperApiKey, paperSecretKey,
liveApiKey, liveSecretKey,
setApiKeys,
watchlist, addToWatchlist, removeFromWatchlist
} = useStore();
const [paperKey, setPaperKey] = useState(paperApiKey);
const [paperSecret, setPaperSecret] = useState(paperSecretKey);
const [liveKey, setLiveKey] = useState(liveApiKey);
const [liveSecret, setLiveSecret] = useState(liveSecretKey);
const [newSymbol, setNewSymbol] = useState('');
const [status, setStatus] = useState('');
const saveKeys = (type) => {
if (type === 'paper') {
setApiKeys('paper', paperKey, paperSecret);
setStatus(' Paper trading keys saved');
} else {
setApiKeys('live', liveKey, liveSecret);
setStatus(' Live trading keys saved');
}
setTimeout(() => setStatus(''), 3000);
};
const addSymbol = () => {
if (newSymbol && newSymbol.length > 0) {
addToWatchlist(newSymbol.toUpperCase());
setNewSymbol('');
}
};
return (
<div className="page">
<h1 className="page-title">Settings</h1>
{status && <div className="settings-status">{status}</div>}
<div className="settings-section">
<h2 className="section-title">Trading Mode</h2>
<div className="mode-selector">
<button
className={`mode-btn ${mode === 'paper' ? 'active' : ''}`}
onClick={() => setMode('paper')}
>
<span className="mode-icon"> </span>
<span className="mode-name">Paper Trading</span>
<span className="mode-desc">Test with virtual money</span>
</button>
<button
className={`mode-btn ${mode === 'live' ? 'active' : ''}`}
onClick={() => setMode('live')}
>
<span className="mode-icon"> </span>
<span className="mode-name">Live Trading</span>
<span className="mode-desc">Real money trades</span>
</button>
</div>
</div>
<div className="settings-section">
<h2 className="section-title">Paper Trading API Keys</h2>
<div className="form-group">
<label>API Key</label>
<input
type="password"
value={paperKey}
onChange={(e) => setPaperKey(e.target.value)}
className="form-input"
placeholder="Enter paper API key"
/>
</div>
<div className="form-group">
<label>Secret Key</label>
<input
type="password"
value={paperSecret}
onChange={(e) => setPaperSecret(e.target.value)}
className="form-input"
placeholder="Enter paper secret key"
/>
</div>
<button className="btn-save" onClick={() => saveKeys('paper')}>
Save Paper Keys
</button>
</div>
<div className="settings-section">
<h2 className="section-title">Live Trading API Keys</h2>
<div className="form-group">
<label>API Key</label>
<input
type="password"
value={liveKey}
onChange={(e) => setLiveKey(e.target.value)}
className="form-input"
placeholder="Enter live API key"
/>
</div>
<div className="form-group">
<label>Secret Key</label>
<input
type="password"
value={liveSecret}
onChange={(e) => setLiveSecret(e.target.value)}
className="form-input"
placeholder="Enter live secret key"
/>
</div>
<button className="btn-save" onClick={() => saveKeys('live')}>
Save Live Keys
</button>
</div>
<div className="settings-section">
<h2 className="section-title">Watchlist</h2>
<div className="watchlist-manager">
<div className="add-symbol">
<input
type="text"
value={newSymbol}
onChange={(e) => setNewSymbol(e.target.value)}
placeholder="Symbol (e.g., BTCUSD)"
className="form-input"
onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
/>
<button className="btn-add" onClick={addSymbol}>Add</button>
</div>
<div className="watchlist-items">
{watchlist.map(symbol => (
<div key={symbol} className="watchlist-item">
<span>{symbol}</span>
<button onClick={() => removeFromWatchlist(symbol)}>×</button>
</div>
))}
</div>
</div>
</div>
</div>
);
}
function MiniChart({ symbol }) {
const [data, setData] = useState([]);
useEffect(() => {
// Generate sample historical data
const points = 20;
const basePrice = Math.random() * 50000 + 10000;
const chartData = [];
for (let i = 0; i < points; i++) {
chartData.push({
time: i,
price: basePrice + (Math.random() - 0.5) * 2000,
});
}
setData(chartData);
}, [symbol]);
return (
<div className="mini-chart">
<ResponsiveContainer width="100%" height={60}>
<LineChart data={data}>
<Line
type="monotone"
dataKey="price"
stroke="#10b981"
strokeWidth={2}
dot={false}
/>
</LineChart>
</ResponsiveContainer>
</div>
);
}
function PriceChart({ symbol }) {
const [data, setData] = useState([]);
useEffect(() => {
// Generate sample price history
const points = 50;
const basePrice = Math.random() * 50000 + 10000;
const chartData = [];
let currentPrice = basePrice;
for (let i = 0; i < points; i++) {
currentPrice += (Math.random() - 0.5) * 500;
chartData.push({
time: new Date(Date.now() - (points - i) * 60000).toLocaleTimeString(),
price: currentPrice,
});
}
setData(chartData);
}, [symbol]);
return (
<div className="price-chart">
<ResponsiveContainer width="100%" height={300}>
<AreaChart data={data}>
<defs>
<linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
<stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
</linearGradient>
</defs>
<XAxis dataKey="time" stroke="#6b7280" />
<YAxis stroke="#6b7280" domain={['auto', 'auto']} />
<Tooltip
contentStyle={{
backgroundColor: '#1f2937',
border: 'none',
borderRadius: '8px',
color: '#fff'
}}
/>
<Area
type="monotone"
dataKey="price"
stroke="#3b82f6"
strokeWidth={2}
fillOpacity={1}
fill="url(#colorPrice)"
/>
</AreaChart>
</ResponsiveContainer>
</div>
);
}
function App() {
const {
currentPage,
mode,
paperApiKey,
paperSecretKey,
liveApiKey,
liveSecretKey,
setAccount,
setPositions,
setOrders,
updateQuote,
watchlist
} = useStore();
const intervalRef = useRef(null);
useEffect(() => {
const apiKey = mode === 'paper' ? paperApiKey : liveApiKey;
const secretKey = mode === 'paper' ? paperSecretKey : liveSecretKey;
if (!apiKey || !secretKey) return;
const api = new AlpacaAPI(apiKey, secretKey, mode === 'paper');
const fetchData = async () => {
try {
const [account, positions, orders] = await Promise.all([
api.getAccount(),
api.getPositions(),
api.getOrders('all'),
]);
setAccount(account);
setPositions(positions);
setOrders(orders);
// Fetch quotes for watchlist
if (watchlist.length > 0) {
const trades = await api.getLatestTrades(watchlist);
watchlist.forEach(symbol => {
if (trades.trades?.[symbol]) {
updateQuote(symbol, { ap: trades.trades[symbol].p });
}
});
}
} catch (error) {
console.error('Error fetching data:', error);
}
};
fetchData();
intervalRef.current = setInterval(fetchData, 5000);
return () => {
if (intervalRef.current) clearInterval(intervalRef.current);
};
}, [mode, paperApiKey, paperSecretKey, liveApiKey, liveSecretKey, watchlist]);
const renderPage = () => {
switch (currentPage) {
case 'dashboard': return <Dashboard />;
case 'trading': return <Trading />;
case 'portfolio': return <Portfolio />;
case 'orders': return <Orders />;
case 'settings': return <Settings />;
default: return <Dashboard />;
}
};
return (
<div className="app">
<Navbar />
<main className="main-content">
{renderPage()}
</main>
<SpeedInsights />
<style>{`
* {
margin: 0;
padding: 0;
box-sizing: border-box;
}
body {
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
background: #0f172a;
color: #e2e8f0;
}
.app {
min-height: 100vh;
display: flex;
}
.navbar {
width: 240px;
background: #1e293b;
border-right: 1px solid #334155;
padding: 24px 0;
display: flex;
flex-direction: column;
}
.nav-brand {
padding: 0 24px 24px;
border-bottom: 1px solid #334155;
margin-bottom: 24px;
display: flex;
align-items: center;
gap: 12px;
}
.logo {
font-size: 28px;
}
.brand-name {
font-size: 20px;
font-weight: 700;
color: #3b82f6;
}
.mode-badge {
padding: 4px 8px;
border-radius: 4px;
font-size: 10px;
font-weight: 700;
margin-left: auto;
}
.mode-badge.paper {
background: #059669;
color: white;
}
.mode-badge.live {
background: #dc2626;
color: white;
}
.nav-items {
display: flex;
flex-direction: column;
gap: 4px;
padding: 0 12px;
}
.nav-item {
display: flex;
align-items: center;
gap: 12px;
padding: 12px 16px;
background: none;
border: none;
color: #94a3b8;
border-radius: 8px;
cursor: pointer;
transition: all 0.2s;
font-size: 14px;
}
.nav-item:hover {
background: #334155;
color: #e2e8f0;
}
.nav-item.active {
background: #3b82f6;
color: white;
}
.nav-icon {
font-size: 18px;
}
.main-content {
flex: 1;
overflow-y: auto;
padding: 32px;
}
.page {
max-width: 1400px;
margin: 0 auto;
}
.page-title {
font-size: 32px;
font-weight: 700;
margin-bottom: 32px;
color: #f1f5f9;
}
.stats-grid {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
gap: 20px;
margin-bottom: 32px;
}
.stat-card {
background: #1e293b;
padding: 24px;
border-radius: 12px;
border: 1px solid #334155;
}
.stat-label {
font-size: 14px;
color: #94a3b8;
margin-bottom: 8px;
}
.stat-value {
font-size: 28px;
font-weight: 700;
color: #f1f5f9;
}
.stat-value.positive {
color: #10b981;
}
.stat-value.negative {
color: #ef4444;
}
.section {
margin-bottom: 32px;
}
.section-title {
font-size: 20px;
font-weight: 600;
margin-bottom: 16px;
color: #f1f5f9;
}
.watchlist-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
gap: 16px;
}
.watchlist-card {
background: #1e293b;
padding: 20px;
border-radius: 12px;
border: 1px solid #334155;
cursor: pointer;
transition: all 0.2s;
}
.watchlist-card:hover {
border-color: #3b82f6;
transform: translateY(-2px);
}
.crypto-header {
display: flex;
align-items: center;
gap: 8px;
margin-bottom: 12px;
}
.crypto-symbol {
font-size: 18px;
font-weight: 700;
color: #f1f5f9;
}
.crypto-name {
font-size: 12px;
color: #64748b;
}
.crypto-price {
font-size: 24px;
font-weight: 700;
margin-bottom: 12px;
color: #10b981;
}
.mini-chart {
height: 60px;
}
.positions-list {
display: grid;
gap: 16px;
}
.position-card {
background: #1e293b;
padding: 20px;
border-radius: 12px;
border: 1px solid #334155;
}
.position-header {
display: flex;
align-items: center;
gap: 12px;
margin-bottom: 16px;
}
.position-symbol {
font-size: 18px;
font-weight: 700;
color: #f1f5f9;
}
.position-qty {
font-size: 14px;
color: #64748b;
}
.position-details {
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 16px;
}
.detail-item {
display: flex;
flex-direction: column;
gap: 4px;
}
.detail-label {
font-size: 12px;
color: #64748b;
}
.detail-value {
font-size: 16px;
font-weight: 600;
color: #f1f5f9;
}
.detail-value.positive {
color: #10b981;
}
.detail-value.negative {
color: #ef4444;
}
.empty-state {
background: #1e293b;
padding: 48px;
border-radius: 12px;
border: 1px solid #334155;
text-align: center;
color: #64748b;
}
.trading-layout {
display: grid;
grid-template-columns: 1fr 400px;
gap: 24px;
}
.trading-chart {
background: #1e293b;
padding: 24px;
border-radius: 12px;
border: 1px solid #334155;
}
.chart-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 24px;
}
.symbol-select {
background: #0f172a;
border: 1px solid #334155;
color: #e2e8f0;
padding: 12px 16px;
border-radius: 8px;
font-size: 16px;
cursor: pointer;
}
.current-price {
font-size: 28px;
font-weight: 700;
color: #10b981;
}
.price-chart {
margin-top: 24px;
}
.order-panel {
background: #1e293b;
padding: 24px;
border-radius: 12px;
border: 1px solid #334155;
}
.panel-title {
font-size: 18px;
font-weight: 600;
margin-bottom: 20px;
color: #f1f5f9;
}
.order-tabs {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 8px;
margin-bottom: 20px;
}
.order-tab {
padding: 12px;
border: none;
border-radius: 8px;
font-size: 16px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s;
}
.order-tab.buy {
background: #065f46;
color: #d1fae5;
}
.order-tab.buy.active {
background: #10b981;
color: white;
}
.order-tab.sell {
background: #7f1d1d;
color: #fecaca;
}
.order-tab.sell.active {
background: #ef4444;
color: white;
}
.order-type-tabs {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 8px;
margin-bottom: 20px;
}
.type-tab {
padding: 10px;
background: #0f172a;
border: 1px solid #334155;
border-radius: 8px;
color: #94a3b8;
font-size: 14px;
cursor: pointer;
transition: all 0.2s;
}
.type-tab.active {
background: #3b82f6;
color: white;
border-color: #3b82f6;
}
.form-group {
margin-bottom: 16px;
}
.form-group label {
display: block;
font-size: 14px;
color: #94a3b8;
margin-bottom: 8px;
}
.form-input {
width: 100%;
padding: 12px 16px;
background: #0f172a;
border: 1px solid #334155;
border-radius: 8px;
color: #e2e8f0;
font-size: 16px;
}
.form-input:focus {
outline: none;
border-color: #3b82f6;
}
.order-summary {
background: #0f172a;
padding: 16px;
border-radius: 8px;
margin-bottom: 20px;
}
.summary-row {
display: flex;
justify-content: space-between;
margin-bottom: 8px;
font-size: 14px;
}
.summary-row:last-child {
margin-bottom: 0;
font-weight: 600;
font-size: 16px;
}
.order-submit {
width: 100%;
padding: 16px;
border: none;
border-radius: 8px;
font-size: 16px;
font-weight: 700;
cursor: pointer;
transition: all 0.2s;
}
.order-submit.buy {
background: #10b981;
color: white;
}
.order-submit.buy:hover {
background: #059669;
}
.order-submit.sell {
background: #ef4444;
color: white;
}
.order-submit.sell:hover {
background: #dc2626;
}
.order-status {
margin-top: 16px;
padding: 12px;
background: #0f172a;
border-radius: 8px;
text-align: center;
font-size: 14px;
}
.modal-overlay {
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(0, 0, 0, 0.8);
display: flex;
align-items: center;
justify-content: center;
z-index: 1000;
}
.modal {
background: #1e293b;
padding: 32px;
border-radius: 16px;
border: 1px solid #334155;
max-width: 500px;
width: 90%;
}
.modal-title {
font-size: 24px;
font-weight: 700;
margin-bottom: 16px;
color: #f1f5f9;
}
.modal-text {
font-size: 14px;
color: #94a3b8;
margin-bottom: 20px;
}
.modal-details {
background: #0f172a;
padding: 16px;
border-radius: 8px;
margin-bottom: 24px;
font-size: 14px;
}
.modal-details div {
margin-bottom: 8px;
}
.modal-details div:last-child {
margin-bottom: 0;
}
.modal-actions {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 12px;
}
.btn-cancel, .btn-confirm {
padding: 14px;
border: none;
border-radius: 8px;
font-size: 16px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s;
}
.btn-cancel {
background: #334155;
color: #e2e8f0;
}
.btn-cancel:hover {
background: #475569;
}
.btn-confirm {
background: #ef4444;
color: white;
}
.btn-confirm:hover {
background: #dc2626;
}
.portfolio-allocation {
background: #1e293b;
padding: 24px;
border-radius: 12px;
border: 1px solid #334155;
margin-bottom: 32px;
}
.allocation-bars {
display: flex;
flex-direction: column;
gap: 16px;
margin-top: 20px;
}
.allocation-bar {
display: flex;
flex-direction: column;
gap: 8px;
}
.bar-label {
display: flex;
justify-content: space-between;
font-size: 14px;
color: #94a3b8;
}
.bar-track {
height: 24px;
background: #0f172a;
border-radius: 8px;
overflow: hidden;
}
.bar-fill {
height: 100%;
border-radius: 8px;
transition: width 0.5s;
}
.bar-fill.cash {
background: #3b82f6;
}
.bar-fill.crypto {
background: #10b981;
}
.holdings-table {
background: #1e293b;
border-radius: 12px;
border: 1px solid #334155;
overflow: hidden;
}
.table-header, .table-row {
display: grid;
grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1.5fr;
gap: 16px;
padding: 16px 24px;
}
.table-header {
background: #0f172a;
font-size: 12px;
font-weight: 600;
color: #64748b;
text-transform: uppercase;
}
.table-row {
border-top: 1px solid #334155;
font-size: 14px;
}
.cell-symbol {
font-weight: 700;
color: #f1f5f9;
}
.positive {
color: #10b981;
}
.negative {
color: #ef4444;
}
.orders-list {
display: grid;
gap: 16px;
}
.order-card {
background: #1e293b;
padding: 20px;
border-radius: 12px;
border: 1px solid #334155;
}
.order-header {
display: flex;
align-items: center;
gap: 12px;
margin-bottom: 16px;
}
.order-side {
padding: 4px 12px;
border-radius: 6px;
font-size: 12px;
font-weight: 700;
}
.order-side.buy {
background: #065f46;
color: #d1fae5;
}
.order-side.sell {
background: #7f1d1d;
color: #fecaca;
}
.order-symbol {
font-size: 16px;
font-weight: 700;
color: #f1f5f9;
}
.order-status {
padding: 4px 12px;
border-radius: 6px;
font-size: 11px;
font-weight: 600;
margin-left: auto;
text-transform: uppercase;
}
.order-status.new, .order-status.pending_new {
background: #1e40af;
color: #dbeafe;
}
.order-status.filled {
background: #065f46;
color: #d1fae5;
}
.order-status.canceled, .order-status.expired {
background: #78350f;
color: #fef3c7;
}
.order-details {
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 12px;
font-size: 13px;
color: #94a3b8;
}
.btn-cancel-order {
margin-top: 16px;
padding: 10px 16px;
background: #7f1d1d;
color: #fecaca;
border: none;
border-radius: 8px;
font-size: 14px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s;
}
.btn-cancel-order:hover {
background: #991b1b;
}
.settings-status {
padding: 16px;
background: #065f46;
color: #d1fae5;
border-radius: 8px;
margin-bottom: 24px;
text-align: center;
font-weight: 600;
}
.settings-section {
background: #1e293b;
padding: 24px;
border-radius: 12px;
border: 1px solid #334155;
margin-bottom: 24px;
}
.mode-selector {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 16px;
}
.mode-btn {
padding: 24px;
background: #0f172a;
border: 2px solid #334155;
border-radius: 12px;
cursor: pointer;
transition: all 0.2s;
display: flex;
flex-direction: column;
align-items: center;
gap: 8px;
}
.mode-btn:hover {
border-color: #3b82f6;
}
.mode-btn.active {
background: #1e3a8a;
border-color: #3b82f6;
}
.mode-icon {
font-size: 32px;
}
.mode-name {
font-size: 16px;
font-weight: 700;
color: #f1f5f9;
}
.mode-desc {
font-size: 12px;
color: #64748b;
}
.btn-save {
padding: 14px 24px;
background: #3b82f6;
color: white;
border: none;
border-radius: 8px;
font-size: 16px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s;
}
.btn-save:hover {
background: #2563eb;
}
.watchlist-manager {
display: flex;
flex-direction: column;
gap: 16px;
}
.add-symbol {
display: flex;
gap: 12px;
}
.btn-add {
padding: 12px 24px;
background: #3b82f6;
color: white;
border: none;
border-radius: 8px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s;
}
.btn-add:hover {
background: #2563eb;
}
.watchlist-items {
display: flex;
flex-wrap: wrap;
gap: 8px;
}
.watchlist-item {
display: flex;
align-items: center;
gap: 8px;
padding: 8px 12px;
background: #0f172a;
border: 1px solid #334155;
border-radius: 8px;
}
.watchlist-item button {
background: none;
border: none;
color: #ef4444;
font-size: 20px;
cursor: pointer;
line-height: 1;
}
@media (max-width: 1024px) {
.trading-layout {
grid-template-columns: 1fr;
}
.navbar {
width: 180px;
}
.stats-grid {
grid-template-columns: repeat(2, 1fr);
}
}
@media (max-width: 768px) {
.navbar {
width: 80px;
}
.nav-label {
display: none;
}
.brand-name {
display: none;
}
.mode-badge {
display: none;
}
.stats-grid {
grid-template-columns: 1fr;
}
.position-details {
grid-template-columns: 1fr;
}
.table-header, .table-row {
grid-template-columns: 1fr 1fr;
font-size: 12px;
}
}
`}</style>
</div>
);
}
export default App;
