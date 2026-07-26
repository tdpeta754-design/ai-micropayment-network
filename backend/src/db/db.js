const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'aimpn.json');

// Memory store backed by JSON file for instant synchronous access & zero Windows C++ build issues
let store = {
    wallets: [],
    session_keys: [],
    transactions: [],
    payment_proofs: []
};

if (fs.existsSync(dbPath)) {
    try {
        store = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
        console.error('Error reading db file, re-initializing:', e);
    }
}

function save() {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving db file:', e);
    }
}

// SQL Parser Helper for our exact tables and queries
const db = {
    prepare(sql) {
        const cleanSql = sql.trim().replace(/\s+/g, ' ');
        
        return {
            run(...params) {
                if (cleanSql.startsWith('INSERT INTO wallets')) {
                    const [address, owner, salt, spending_policy] = params;
                    if (!store.wallets.some(w => w.address === address)) {
                        store.wallets.push({ address, owner, salt, spending_policy, status: 'active', created_at: new Date().toISOString() });
                        save();
                    }
                } else if (cleanSql.startsWith('INSERT INTO session_keys')) {
                    const [id, wallet_address, key_address, valid_after, valid_until, spend_limit] = params;
                    store.session_keys.push({ id, wallet_address, key_address, valid_after, valid_until, spend_limit, active: 1, spent: '0' });
                    save();
                } else if (cleanSql.startsWith('INSERT OR IGNORE INTO transactions') || cleanSql.startsWith('INSERT INTO transactions')) {
                    const [tx_hash, from_wallet, to_wallet, amount_usdc, fee_usdc, purpose, status, timestamp, block_number] = params;
                    if (!store.transactions.some(t => t.tx_hash === tx_hash)) {
                        store.transactions.push({ tx_hash, from_wallet, to_wallet, amount_usdc, fee_usdc, purpose, status, timestamp, block_number });
                        save();
                    }
                } else if (cleanSql.startsWith('INSERT INTO payment_proofs') || cleanSql.startsWith('INSERT OR REPLACE INTO payment_proofs')) {
                    const [token_id, tx_hash, payer_wallet, payee_wallet, amount, expires_at] = params;
                    const idx = store.payment_proofs.findIndex(p => p.token_id === token_id);
                    const doc = { token_id, tx_hash, payer_wallet, payee_wallet, amount, expires_at, used: 0 };
                    if (idx >= 0) store.payment_proofs[idx] = doc;
                    else store.payment_proofs.push(doc);
                    save();
                } else if (cleanSql.startsWith('UPDATE payment_proofs SET used = 1')) {
                    const [token_id] = params;
                    const proof = store.payment_proofs.find(p => p.token_id === token_id);
                    if (proof) {
                        proof.used = 1;
                        save();
                    }
                }
                return { changes: 1 };
            },
            get(...params) {
                if (cleanSql.startsWith('SELECT address FROM wallets WHERE address = ?') || cleanSql.startsWith('SELECT * FROM wallets WHERE address = ?')) {
                    return store.wallets.find(w => w.address === params[0]) || null;
                } else if (cleanSql.startsWith('SELECT * FROM session_keys WHERE id = ?')) {
                    return store.session_keys.find(s => s.id === params[0]) || null;
                } else if (cleanSql.startsWith('SELECT * FROM payment_proofs WHERE token_id = ?')) {
                    return store.payment_proofs.find(p => p.token_id === params[0]) || null;
                } else if (cleanSql.startsWith('SELECT * FROM transactions WHERE tx_hash = ?')) {
                    return store.transactions.find(t => t.tx_hash === params[0]) || null;
                }
                return null;
            },
            all(...params) {
                if (cleanSql.startsWith('SELECT * FROM wallets')) {
                    return store.wallets;
                } else if (cleanSql.startsWith('SELECT * FROM session_keys WHERE wallet_address = ?')) {
                    return store.session_keys.filter(s => s.wallet_address === params[0] && s.active === 1);
                } else if (cleanSql.startsWith('SELECT * FROM transactions WHERE from_wallet = ? OR to_wallet = ?')) {
                    const [wallet, , limit] = params;
                    return store.transactions
                        .filter(t => t.from_wallet === wallet || t.to_wallet === wallet)
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, limit || 20);
                } else if (cleanSql.startsWith('SELECT * FROM transactions')) {
                    const [limit] = params;
                    return store.transactions
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, limit || 20);
                }
                return [];
            }
        };
    },
    exec(sql) {
        if (sql.includes('DELETE FROM wallets')) store.wallets = [];
        if (sql.includes('DELETE FROM session_keys')) store.session_keys = [];
        if (sql.includes('DELETE FROM transactions')) store.transactions = [];
        if (sql.includes('DELETE FROM payment_proofs')) store.payment_proofs = [];
        save();
    }
};

module.exports = db;
