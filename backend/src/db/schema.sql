CREATE TABLE IF NOT EXISTS wallets (
    address TEXT PRIMARY KEY,
    owner TEXT,
    salt INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    spending_policy TEXT,
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS session_keys (
    id TEXT PRIMARY KEY,
    wallet_address TEXT,
    key_address TEXT,
    valid_after INTEGER,
    valid_until INTEGER,
    spend_limit TEXT,
    spent TEXT DEFAULT '0',
    active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS transactions (
    tx_hash TEXT PRIMARY KEY,
    from_wallet TEXT,
    to_wallet TEXT,
    amount_usdc TEXT,
    fee_usdc TEXT,
    purpose TEXT,
    status TEXT,
    timestamp INTEGER,
    block_number INTEGER
);

CREATE TABLE IF NOT EXISTS payment_proofs (
    token_id TEXT PRIMARY KEY,
    tx_hash TEXT,
    payer_wallet TEXT,
    payee_wallet TEXT,
    amount TEXT,
    expires_at INTEGER,
    used INTEGER DEFAULT 0
);
