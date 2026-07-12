const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public')); 

const users = {};
let currentMarketPrice = 100.00; 

function createUser(username) {
    if (users[username]) return users[username];
    users[username] = {
        username: username,
        balances: { USD: 0, ASSET: 0 },
        history: []
    };
    return users[username];
}

app.get('/api/user/:username', (req, res) => {
    const user = createUser(req.params.username);
    res.json({ ...user, currentMarketPrice });
});

app.post('/api/deposit', (req, res) => {
    const { username, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
    const user = createUser(username);
    user.balances.USD += parseFloat(amount);
    res.json({ message: "Deposit successful", balances: user.balances });
});

app.post('/api/trade', (req, res) => {
    const { username, side, quantity } = req.body; 
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ error: "Invalid quantity" });
    const user = users[username];
    if (!user) return res.status(404).json({ error: "User not found" });

    const totalCost = qty * currentMarketPrice;

    if (side === 'BUY') {
        if (user.balances.USD < totalCost) return res.status(400).json({ error: "Insufficient USD balance" });
        user.balances.USD -= totalCost;
        user.balances.ASSET += qty;
        currentMarketPrice += (qty * 0.05); 
    } else if (side === 'SELL') {
        if (user.balances.ASSET < qty) return res.status(400).json({ error: "Insufficient asset balance" });
        user.balances.ASSET -= qty;
        user.balances.USD += totalCost;
        currentMarketPrice = Math.max(0.01, currentMarketPrice - (qty * 0.05));
    }
    res.json({ message: "Trade executed", balances: user.balances, currentMarketPrice });
});

const PORT = process.env.PORT || 3000;
// CHANGE THIS LAST LINE TO MATCH THIS EXACTLY:
app.listen(PORT, '0.0.0.0', () => console.log(`Trading engine running on port ${PORT}`));